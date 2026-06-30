import { buildOpenApiSpec } from "@seedance/models";

export async function GET() {
  return Response.json(buildOpenApiSpec());
}
