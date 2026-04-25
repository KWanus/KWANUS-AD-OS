import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/analyze(.*)",
  "/start(.*)",
  "/winners(.*)",
  "/billing(.*)",
  "/emails(.*)",
  "/api/analyze(.*)",
  "/api/winners(.*)",
  "/api/stripe/webhook(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/stats(.*)",
  "/forms(.*)",
  "/api/forms(.*)",
  "/api/email-flows/process(.*)",
  "/s(.*)",
  "/thank-you(.*)",
  "/portal(.*)",
  "/api/portal(.*)",
  "/api/portal/[^/]+(.*)",
  "/api/opt-in-forms(.*)",
  "/launch(.*)",
  "/report(.*)",
  "/review(.*)",
  "/wall(.*)",
  "/go(.*)",
  "/api/testimonials(.*)",
  "/api/chat(.*)",
  "/api/bookings(.*)",
  "/book(.*)",
  "/api/compliance/unsubscribe(.*)",
  "/api/intent(.*)",
  "/api/analytics/track(.*)",
  "/api/discounts(.*)",
  "/api/mcp(.*)",
  "/api/oauth/callback(.*)",
  "/api/debug(.*)",
  "/api/ping(.*)",
  "/api/track(.*)",
  "/api/orders(.*)",
  "/api/checkout(.*)",
  "/api/ads/optimize",
  "/api/voice(.*)",
  "/api/cron(.*)",
  "/api/automations/process-delayed(.*)",
  "/api/email-flows/process-delayed(.*)",
  "/welcome(.*)",
  "/pricing(.*)",
  "/leaderboard(.*)",
  "/agents(.*)",
  "/api/milestones/share-card(.*)",
  "/api/leaderboard(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/setup(.*)",
]);

// Known app hostnames — requests from custom domains get rewritten to /s/[slug]
const APP_HOSTS = new Set([
  "localhost",
  "himalaya.app", "www.himalaya.app",
  // Add your Vercel deployment URLs here
]);

export default clerkMiddleware(async (auth, request) => {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  // Custom domain routing: if the hostname isn't our app, rewrite to /s/ path
  // This lets users point their domain at our app and have their site served
  if (hostname && !APP_HOSTS.has(hostname) && !hostname.endsWith(".vercel.app")) {
    const url = new URL(request.url);
    // Only rewrite non-API, non-asset requests
    if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/_next/")) {
      // Rewrite to the custom domain lookup endpoint
      url.pathname = `/s/_domain/${hostname}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
