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
  "/s(.*)",
  "/api/opt-in-forms(.*)",
  "/onboarding(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
