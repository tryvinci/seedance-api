import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import {
  updateGeneration,
  commitHold,
  refundHold,
  getGeneration,
  getWebhookEndpoint,
} from "@seedance/db";
import { pollProvider } from "@seedance/providers";
import type { Env } from "../env";
import { getDb, copyToR2, publicMediaUrl, deliverWebhook } from "../lib/utils";

export interface PollParams {
  generationId: string;
  ownerId: string;
  provider: "modelark" | "wavespeed";
  taskId: string;
  creditsCost: number;
}

export class PollGenerationWorkflow extends WorkflowEntrypoint<
  Env,
  PollParams
> {
  async run(event: WorkflowEvent<PollParams>, step: WorkflowStep) {
    const { generationId, ownerId, provider, taskId, creditsCost } =
      event.payload;
    const db = getDb(this.env);
    const maxAttempts = 120;
    const baseDelayMs = 3000;

    await step.do("mark-processing", async () => {
      await updateGeneration(db, generationId, { status: "processing" });
    });

    let outputUrl: string | undefined;
    let failed = false;
    let errorMsg: string | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await step.do(`poll-${attempt}`, async () => {
        return pollProvider(
          {
            modelarkApiKey: this.env.MODELARK_API_KEY,
            wavespeedApiKey: this.env.WAVESPEED_API_KEY,
            arkBase: this.env.ARK_BASE,
          },
          provider,
          taskId,
        );
      });

      if (result.status === "completed" && result.outputUrl) {
        outputUrl = result.outputUrl;
        break;
      }
      if (result.status === "failed") {
        failed = true;
        errorMsg = result.error ?? "Generation failed";
        break;
      }

      await step.sleep(`wait-${attempt}`, baseDelayMs + attempt * 500);
    }

    if (failed || !outputUrl) {
      await step.do("refund", async () => {
        await updateGeneration(db, generationId, {
          status: "failed",
          error: errorMsg ?? "Timeout or no output",
        });
        await refundHold(db, ownerId, generationId, creditsCost);
      });
      await this.notifyUser(step, generationId, ownerId, "failed");
      return;
    }

    const r2Key = await step.do("store-output", async () => {
      const ext = outputUrl!.includes(".mp4") ? "mp4" : "png";
      const key = `outputs/${ownerId}/${generationId}.${ext}`;
      await copyToR2(this.env.MEDIA, outputUrl!, key);
      const publicUrl = publicMediaUrl(this.env, key);
      await updateGeneration(db, generationId, {
        status: "completed",
        outputR2Key: key,
        outputUrl: publicUrl,
      });
      await commitHold(db, generationId);
      return key;
    });

    await this.notifyUser(step, generationId, ownerId, "completed", r2Key);
  }

  private async notifyUser(
    step: WorkflowStep,
    generationId: string,
    ownerId: string,
    status: string,
    r2Key?: string,
  ) {
    await step.do("webhook", async () => {
      const db = getDb(this.env);
      const endpoint = await getWebhookEndpoint(db, ownerId);
      if (!endpoint) return;
      const gen = await getGeneration(db, generationId);
      await deliverWebhook(endpoint.url, endpoint.secret, {
        event: `generation.${status}`,
        generation: {
          id: generationId,
          status,
          model: gen?.canonicalModel,
          output_url: gen?.outputUrl,
          output_r2_key: r2Key,
        },
      });
    });
  }
}
