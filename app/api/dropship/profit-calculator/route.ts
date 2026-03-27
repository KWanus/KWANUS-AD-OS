import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { supplierPrice, shippingCost, adSpend, conversionRate, targetRoas } = body;

    if (supplierPrice == null || shippingCost == null || adSpend == null || conversionRate == null) {
      return NextResponse.json(
        { ok: false, error: "supplierPrice, shippingCost, adSpend, and conversionRate are required" },
        { status: 400 }
      );
    }

    const sp = Number(supplierPrice);
    const sc = Number(shippingCost);
    const as_ = Number(adSpend);
    const cr = Number(conversionRate) / 100; // convert percentage to decimal
    const tr = targetRoas ? Number(targetRoas) : null;

    // Processing fee: 2.9% + $0.30 (Stripe standard)
    const PROCESSING_RATE = 0.029;
    const PROCESSING_FLAT = 0.30;

    const cogs = sp + sc;
    // Ad cost per sale = ad spend per click * (1 / conversion_rate)
    // Here adSpend is treated as total daily/campaign spend and conversionRate as store CVR %
    // We interpret: adCostPerSale = adSpend / conversionRate (i.e. spend to acquire 1 sale)
    const adCostPerSale = cr > 0 ? as_ / cr : 0;

    // Break-even ROAS = revenue / ad_spend = price / (price - cogs - processing)
    // We compute it for each pricing tier

    function calcTier(multiplier: number) {
      const price = parseFloat((cogs * multiplier).toFixed(2));
      const processingFee = parseFloat((price * PROCESSING_RATE + PROCESSING_FLAT).toFixed(2));
      const totalCost = cogs + processingFee + adCostPerSale;
      const profitPerUnit = parseFloat((price - totalCost).toFixed(2));
      const marginPercent = price > 0 ? parseFloat(((profitPerUnit / price) * 100).toFixed(1)) : 0;
      const beRoas = price > 0 && (price - cogs - processingFee) > 0
        ? parseFloat((price / (price - cogs - processingFee)).toFixed(2))
        : 0;
      return { price, margin: `${marginPercent}%`, profitPerUnit, beRoas, processingFee };
    }

    const conservative = calcTier(2.0);  // 2x COGS
    const standard = calcTier(2.8);      // 2.8x COGS
    const premium = calcTier(4.0);       // 4x COGS

    // Overall break-even ROAS uses standard tier
    const breakEvenRoas = standard.beRoas;

    // Profit at target ROAS
    let profitAtTargetRoas = 0;
    if (tr && tr > 0) {
      // revenue = roas * adSpend; profit = revenue - cogs - processingFee(revenue) - adSpend
      const revenue = tr * as_;
      const processingFee = revenue * PROCESSING_RATE + PROCESSING_FLAT;
      profitAtTargetRoas = parseFloat((revenue - cogs - processingFee - as_).toFixed(2));
    }

    const result = {
      suggestedPricing: [
        { tier: "conservative", price: conservative.price, margin: conservative.margin, profitPerUnit: conservative.profitPerUnit },
        { tier: "standard", price: standard.price, margin: standard.margin, profitPerUnit: standard.profitPerUnit },
        { tier: "premium", price: premium.price, margin: premium.margin, profitPerUnit: premium.profitPerUnit },
      ],
      breakEvenRoas,
      targetRoas: tr ?? null,
      profitAtTargetRoas,
      costBreakdown: {
        cogs,
        shipping: sc,
        processingFee: standard.processingFee,
        adCostPerSale: parseFloat(adCostPerSale.toFixed(2)),
        total: parseFloat((cogs + standard.processingFee + adCostPerSale).toFixed(2)),
      },
    };

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Profit calculator error:", err);
    return NextResponse.json({ ok: false, error: "Failed to calculate profit" }, { status: 500 });
  }
}
