import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/api/opt-in-forms(.*)",
  "/launch(.*)",
  "/review(.*)",
  "/wall(.*)",
  "/go(.*)",
  "/api/testimonials(.*)",
  "/api/chat(.*)",
  "/api/bookings(.*)",
  "/book(.*)",
  "/api/compliance/unsubscribe(.*)",
  "/api/intent(.*)",
  "/api/mcp(.*)",
  "/api/oauth/callback(.*)",
  "/api/debug(.*)",
  "/api/track(.*)",
  "/api/orders(.*)",
  "/api/checkout(.*)",
  "/api/ads/optimize",
  "/api/voice(.*)",
  "/api/cron(.*)",
  "/api/automations/process-delayed(.*)",
  "/api/email-flows/process-delayed(.*)",
  "/welcome(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/setup(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
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
