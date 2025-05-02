import { NextRequest } from "next/server";

const ADMIN_EMAILS = ["admin@example.com", "testadmin@example.com"];

export async function isAdminUser(request: Request | NextRequest): Promise<boolean> {
  console.warn(
    "isAdminUser check is currently bypassed for API development. Implement proper auth!"
  );

  return true;
}

export async function checkAdminAuth(request: Request | NextRequest): Promise<Response | null> {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  return null;
}
