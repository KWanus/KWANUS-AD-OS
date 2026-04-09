// ---------------------------------------------------------------------------
// POST /api/paths/deploy — unified deploy for ANY business path
// Takes: path type + config → builds everything specialized for that path
// This is the master orchestrator for all paths
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateConsultantSiteBlocks, generateConsultantEmails, generateConsultingPackages } from "@/lib/paths/consultantPath";
import { generateLocalSiteBlocks, generateLocalEmails, generateLocalAdHooks } from "@/lib/paths/localBusinessPath";
import { generateProductPageBlocks, generateDropshipAdHooks, generateDropshipEmails } from "@/lib/paths/dropshipPath";
import { generateAgencySiteBlocks, generateAgencyPackages } from "@/lib/paths/agencyPath";
import { generateSalesPageBlocks, generateDigitalProductEmails } from "@/lib/paths/digitalProductPath";

type PathType = "consultant" | "local" | "dropship" | "agency" | "digital_product" | "affiliate";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      path: PathType;
      config: Record<string, unknown>;
    };

    if (!body.path) return NextResponse.json({ ok: false, error: "path required" }, { status: 400 });

    let siteBlocks: object[] = [];
    let emails: { subject: string; body: string; timing: string }[] = [];
    let adHooks: { platform: string; text: string }[] = [];
    let siteName = "Himalaya Business";
    let emailFlowName = "Welcome Sequence";
    let campaignName = "Campaign";

    switch (body.path) {
      case "consultant": {
        const niche = (body.config.niche as string) ?? "business";
        const name = (body.config.businessName as string) ?? "Consulting";
        const packages = generateConsultingPackages(niche, (body.config.expertise as string) ?? niche);
        siteBlocks = generateConsultantSiteBlocks({
          businessName: name, niche, expertise: niche,
          packages, bookingEnabled: true, proposalEnabled: true, portalEnabled: true,
        });
        emails = generateConsultantEmails({ businessName: name, niche, expertise: niche, packages, bookingEnabled: true, proposalEnabled: true, portalEnabled: true });
        siteName = `${name} — ${niche} Consulting`;
        emailFlowName = `${name} Lead Nurture`;
        campaignName = `${name} Ad Campaign`;
        break;
      }

      case "local": {
        const config = body.config as Record<string, unknown>;
        const localConfig = {
          businessName: (config.businessName as string) ?? "Local Business",
          niche: (config.niche as string) ?? "service",
          location: (config.location as string) ?? "Your City",
          phone: (config.phone as string) ?? "(555) 000-0000",
          serviceArea: (config.serviceArea as string[]) ?? [(config.location as string) ?? "Your City"],
          services: (config.services as string[]) ?? ["General Service"],
          hours: (config.hours as string) ?? "Mon-Fri 8am-6pm",
        };
        siteBlocks = generateLocalSiteBlocks(localConfig);
        emails = generateLocalEmails(localConfig);
        adHooks = generateLocalAdHooks(localConfig);
        siteName = `${localConfig.businessName} — ${localConfig.location}`;
        emailFlowName = `${localConfig.businessName} Follow-Up`;
        campaignName = `${localConfig.businessName} Local Ads`;

        // Scrape Google Maps for local leads (non-blocking bonus)
        try {
          const { scrapeGoogleMaps } = await import("@/lib/scraper/scrapers");
          const leads = await scrapeGoogleMaps(localConfig.niche, localConfig.location);
          if (leads.length > 0) {
            // Save scraped leads for the user
            for (const lead of leads.slice(0, 10)) {
              await prisma.lead.create({
                data: {
                  userId: user.id,
                  name: lead.name,
                  niche: localConfig.niche,
                  location: localConfig.location,
                  website: lead.website || null,
                  phone: lead.phone || null,
                  rating: lead.rating,
                  reviewCount: lead.reviewCount,
                  status: "new",
                  notes: `Auto-scraped from Google Maps. ${lead.category}. ${lead.address}`,
                },
              }).catch(() => {});
            }
          }
        } catch { /* scraping is non-blocking */ }

        break;
      }

      case "dropship": {
        const product = {
          name: (body.config.productName as string) ?? "Product",
          niche: (body.config.niche as string) ?? "general",
          supplierPrice: (body.config.supplierPrice as number) ?? 10,
          sellingPrice: (body.config.sellingPrice as number) ?? 30,
          profitMargin: 0, shippingCost: (body.config.shippingCost as number) ?? 5,
          shippingTime: (body.config.shippingTime as string) ?? "7-14 business days",
          targetAudience: (body.config.audience as string) ?? "online shoppers",
          description: (body.config.description as string) ?? "",
          benefits: (body.config.benefits as string[]) ?? ["High quality", "Fast shipping", "Satisfaction guaranteed"],
          imagePrompts: [],
        };
        siteBlocks = generateProductPageBlocks(product, (body.config.storeName as string) ?? "Store");
        emails = generateDropshipEmails(product, (body.config.storeName as string) ?? "Store");
        adHooks = generateDropshipAdHooks(product).map((h) => ({ platform: h.platform, text: h.text }));
        siteName = `${(body.config.storeName as string) ?? "Store"} — ${product.name}`;
        emailFlowName = `${product.name} Customer Flow`;
        campaignName = `${product.name} Ads`;
        break;
      }

      case "agency": {
        const agencyConfig = {
          agencyName: (body.config.agencyName as string) ?? "Agency",
          niche: (body.config.niche as string) ?? "marketing",
          services: (body.config.services as string[]) ?? ["SEO", "PPC", "Social Media", "Content"],
          targetClients: (body.config.targetClients as string) ?? "small businesses",
          packages: generateAgencyPackages((body.config.niche as string) ?? "marketing", (body.config.services as string[]) ?? []),
        };
        siteBlocks = generateAgencySiteBlocks(agencyConfig);
        siteName = `${agencyConfig.agencyName} — ${agencyConfig.niche} Agency`;
        emailFlowName = `${agencyConfig.agencyName} Prospect Nurture`;
        campaignName = `${agencyConfig.agencyName} Lead Gen`;
        break;
      }

      case "digital_product": {
        const dpConfig = {
          creatorName: (body.config.creatorName as string) ?? "Creator",
          niche: (body.config.niche as string) ?? "general",
          product: {
            name: (body.config.productName as string) ?? "Digital Product",
            type: (body.config.productType as string ?? "course") as "course",
            price: (body.config.price as number) ?? 97,
            description: (body.config.description as string) ?? "",
            benefits: (body.config.benefits as string[]) ?? ["Learn the system", "Get results", "Lifetime access"],
            targetAudience: (body.config.audience as string) ?? "aspiring learners",
            deliveryMethod: "instant_download" as const,
            upsell: (body.config.price as number) ? { name: `${(body.config.productName as string) ?? "Product"} Premium`, price: ((body.config.price as number) ?? 97) * 3, description: "Everything + VIP support + bonus content" } : undefined,
          },
          hasCourse: true,
          hasEmail: true,
        };
        siteBlocks = generateSalesPageBlocks(dpConfig);
        emails = generateDigitalProductEmails(dpConfig);
        siteName = dpConfig.product.name;
        emailFlowName = `${dpConfig.product.name} Buyer Onboarding`;
        campaignName = `${dpConfig.product.name} Ads`;
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: `Unknown path: ${body.path}` }, { status: 400 });
    }

    // ── Fix placeholder testimonials with realistic generated ones ──
    try {
      const { generateTestimonials } = await import("@/lib/sites/testimonialGenerator");
      const niche = (body.config.niche as string) ?? "business";
      const audience = (body.config.audience as string) ?? (body.config.targetClients as string) ?? "customers";
      const generated = generateTestimonials({
        niche,
        audience,
        painPoint: "common challenges",
        outcome: "real results",
        productName: siteName,
        count: 3,
      });

      // Replace any placeholder testimonial blocks
      for (const block of siteBlocks as Record<string, unknown>[]) {
        if ((block.type === "testimonials") && block.data) {
          const data = block.data as Record<string, unknown>;
          const items = data.items as Record<string, unknown>[];
          if (items) {
            for (let i = 0; i < items.length && i < generated.length; i++) {
              const item = items[i];
              if (typeof item.name === "string" && item.name.includes("[")) {
                item.name = generated[i].name;
                item.role = generated[i].role;
                item.quote = generated[i].quote;
                item.result = generated[i].result;
                (item as Record<string, unknown>).company = generated[i].location;
              }
            }
          }
        }
      }
    } catch { /* testimonial fix is non-blocking */ }

    // ── Create Site ──
    const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Date.now().toString(36);
    const site = await prisma.site.create({
      data: {
        userId: user.id, name: siteName, slug,
        theme: { font: "Inter", primaryColor: "#06b6d4", backgroundColor: "#050a14", textColor: "#ffffff" },
        published: false,
      },
    });
    await prisma.sitePage.create({ data: { siteId: site.id, title: "Home", slug: "home", order: 0, blocks: siteBlocks } });

    // ── Create Email Flow ──
    let flowId: string | null = null;
    if (emails.length > 0) {
      const nodes: object[] = [{ id: "trigger_0", type: "trigger", data: { label: "New Lead" }, position: { x: 250, y: 0 } }];
      const edges: object[] = [];
      let prevId = "trigger_0";
      let yPos = 150;

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        if (i > 0) {
          const dayMatch = email.timing.match(/(\d+)/);
          const days = dayMatch ? parseInt(dayMatch[1]) : i * 2;
          if (days > 0) {
            const delayId = `delay_${i}`;
            nodes.push({ id: delayId, type: "delay", data: { delayValue: days, delayUnit: "days", label: `Wait ${days}d` }, position: { x: 250, y: yPos } });
            edges.push({ id: `e_${prevId}_${delayId}`, source: prevId, target: delayId });
            prevId = delayId;
            yPos += 100;
          }
        }
        const emailId = `email_${i}`;
        nodes.push({ id: emailId, type: "email", data: { subject: email.subject, body: email.body, label: email.subject }, position: { x: 250, y: yPos } });
        edges.push({ id: `e_${prevId}_${emailId}`, source: prevId, target: emailId });
        prevId = emailId;
        yPos += 150;
      }

      const flow = await prisma.emailFlow.create({
        data: { userId: user.id, name: emailFlowName, trigger: "signup", status: "active", nodes: nodes as unknown as object, edges: edges as unknown as object },
      });
      flowId = flow.id;
    }

    // ── Create Campaign ──
    const campaign = await prisma.campaign.create({
      data: { userId: user.id, name: campaignName, mode: "operator", status: "draft" },
    });

    if (adHooks.length > 0) {
      for (let i = 0; i < adHooks.length; i++) {
        await prisma.adVariation.create({
          data: { campaignId: campaign.id, name: `${adHooks[i].platform} Hook ${i + 1}`, type: "hook", content: { format: adHooks[i].platform, hook: adHooks[i].text }, platform: adHooks[i].platform, sortOrder: i },
        });
      }
    }

    // ── Save Deployment ──
    await prisma.himalayaDeployment.create({
      data: { userId: user.id, analysisRunId: `path-${body.path}`, siteId: site.id, campaignId: campaign.id, emailFlowId: flowId, version: 1, sections: JSON.parse(JSON.stringify({ path: body.path, config: body.config })) },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    return NextResponse.json({
      ok: true,
      path: body.path,
      deployed: {
        site: { id: site.id, url: `/websites/${site.id}`, slug, publicUrl: `${appUrl}/s/${slug}` },
        campaign: { id: campaign.id, url: `/campaigns/${campaign.id}` },
        emailFlow: flowId ? { id: flowId, url: `/emails/flows/${flowId}` } : null,
      },
    });
  } catch (err) {
    console.error("Path deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}
