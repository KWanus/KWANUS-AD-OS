import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        clickbankNickname: true,
        amazonTrackingId: true,
        jvzooAffiliateId: true,
        warriorplusId: true,
        sharesaleAffiliateId: true,
      },
    });
    return NextResponse.json({ ok: true, accounts: user ?? {} });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json() as {
      clickbankNickname?: string;
      amazonTrackingId?: string;
      jvzooAffiliateId?: string;
      warriorplusId?: string;
      sharesaleAffiliateId?: string;
    };
    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        clickbankNickname: body.clickbankNickname ?? null,
        amazonTrackingId: body.amazonTrackingId ?? null,
        jvzooAffiliateId: body.jvzooAffiliateId ?? null,
        warriorplusId: body.warriorplusId ?? null,
        sharesaleAffiliateId: body.sharesaleAffiliateId ?? null,
      },
      select: {
        clickbankNickname: true,
        amazonTrackingId: true,
        jvzooAffiliateId: true,
        warriorplusId: true,
        sharesaleAffiliateId: true,
      },
    });
    return NextResponse.json({ ok: true, accounts: user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
