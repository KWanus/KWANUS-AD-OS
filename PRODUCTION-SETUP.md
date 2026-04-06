# Himalaya Production Setup

Everything is built and tested locally. Follow these steps to go live.

## 1. Deploy to Vercel

```bash
git add -A && git commit -m "Full execution engine: images, emails, payments, tracking, AI generators"
vercel --prod
```

## 2. Environment Variables (Vercel Dashboard)

All these are already in `.env` — copy them to Vercel:

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `DATABASE_URL` | Supabase → Settings → Database | Yes |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | Yes |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Yes (for AI copy) |
| `OPENAI_API_KEY` | platform.openai.com | For ad images |
| `FAL_KEY` | fal.ai | Fallback for images |
| `RESEND_API_KEY` | resend.com/api-keys | Yes (for emails) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com/apikeys | Yes (for payments) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com/apikeys | Yes |
| `STRIPE_WEBHOOK_SECRET` | See step 3 below | Yes |
| `SERPAPI_KEY` | serpapi.com | For competitor research |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://himalaya.app`) | Yes |

## 3. Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. URL: `https://YOUR-DOMAIN.com/api/stripe/webhook`
4. Events: Select `checkout.session.completed`
5. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in Vercel

## 4. Resend Webhook (for email tracking)

1. Go to [Resend Dashboard → Webhooks](https://resend.com/webhooks)
2. Click "Add webhook"
3. URL: `https://YOUR-DOMAIN.com/api/webhooks/resend`
4. Events: Select all (`email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`)
5. Save

This enables open/click tracking in your analytics dashboard.

## 5. Resend Domain (for sending from your domain)

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Add your domain (e.g. `himalaya.app`)
3. Add the DNS records Resend provides
4. Verify
5. Users can set their sending domain in Settings

Without this, emails send from `onboarding@resend.dev` (Resend test domain — works but looks unprofessional).

## 6. Vercel Cron (automatic)

`vercel.json` already configures:
- `/api/email-flows/process` — every 5 minutes (sends queued emails)
- `/api/cron/health-recalc` — daily at 6am

These activate automatically on Vercel deploy.

## 7. Test the Full Pipeline

After deploy:

1. Go to `/himalaya`
2. Type a niche (e.g. "dental practices in Texas")
3. Click "Go"
4. Wait 30-90 seconds
5. Verify:
   - [ ] Results page loads with score + strategy
   - [ ] "Your business is live" shows with site URL
   - [ ] Copy URL button works
   - [ ] Click Publish → site goes live
   - [ ] Visit the public URL → site renders with form
   - [ ] Submit the form → "Thank you" message appears
   - [ ] Check Emails → contact appears in contacts
   - [ ] Check email flow → enrollment shows as active
   - [ ] Wait 5 minutes → first welcome email should arrive via Resend
   - [ ] Click payment link on site → Stripe checkout loads
   - [ ] Complete test payment → redirects to /thank-you
   - [ ] Check site analytics → order appears with revenue

## What Works Without API Keys

| Feature | Without Key |
|---------|-------------|
| AI Copy (Anthropic) | Falls back to prompt-only mode (user pastes into ChatGPT) |
| AI Images (OpenAI/fal) | Skipped — campaign has text hooks only |
| Email Sending (Resend) | Email flows created but don't send |
| Payments (Stripe) | No payment link on site — form only |
| Tracking (Pixels) | Skipped if user hasn't set pixel IDs in Settings |
| Competitor Research (SerpAPI) | Falls back to template-based foundation |

The system degrades gracefully. Every step is non-blocking.
