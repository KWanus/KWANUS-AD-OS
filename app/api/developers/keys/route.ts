import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createApiKey, listApiKeys, revokeApiKey, getApiUsage } from "@/lib/api/apiKeyManager";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const [keys, usage] = await Promise.all([
      listApiKeys(user.id),
      getApiUsage(user.id),
    ]);

    // Strip hashed keys from response
    const safeKeys = keys.map(k => ({ ...k, hashedKey: undefined }));

    return NextResponse.json({ ok: true, keys: safeKeys, usage });
  } catch (err) {
    console.error("API keys error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.action === "create") {
      const result = await createApiKey(user.id, body.name ?? "My API Key", body.tier ?? "free");
      return NextResponse.json({
        ok: true,
        key: { ...result.apiKey, hashedKey: undefined },
        rawKey: result.rawKey, // Only shown ONCE
      });
    }

    if (body.action === "revoke") {
      await revokeApiKey(body.keyId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("API keys error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
