import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/s/(.*)",                    // Published site pages
  "/api/webhooks(.*)",          // Stripe + N8N webhooks
  "/api/stripe/webhook",        // Stripe webhook (alt path)
  "/api/opt-in-forms/(.*)/submit", // Public form submissions
  "/api/email-contacts/unsubscribe", // Email unsubscribe (public)
  "/api/health",                // Health check (monitoring)
  "/api/sites/(.*)/track",      // Site view tracking (public)
  "/api/cron/(.*)",             // Cron jobs (secured via CRON_SECRET)
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
