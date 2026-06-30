import type { D1Database, KVNamespace, R2Bucket, Workflow } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  POLL_WORKFLOW: Workflow;
  CLERK_SECRET_KEY: string;
  CLERK_JWT_KEY: string;
  MODELARK_API_KEY: string;
  WAVESPEED_API_KEY: string;
  ARK_BASE: string;
  AUTHORIZED_PARTIES: string;
  MEDIA_PUBLIC_URL?: string;
}

export interface AuthContext {
  ownerId: string;
  tokenType: string;
}
