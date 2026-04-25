# 🧪 Preview System Test Instructions

## Quick Test to See Preview in Action

### Option 1: Test with Existing Site

1. **Log in** at `http://localhost:3001`
2. **Navigate to "Websites"** section
3. **Click on any website** you've created
4. **Click "Edit Site"** button
5. **Look for "Open Preview"** button in toolbar (blue button with external link icon)
6. **Click "Open Preview"** → New tab opens
7. **You should see**:
   - Preview banner at top (violet → amber gradient)
   - "👁️ PREVIEW MODE" message
   - "← Edit Site" and "Exit Preview" buttons
   - Your website content below

### Option 2: Create New Site to Test

If you don't have any sites yet:

1. **Go to** `http://localhost:3001`
2. **Find the "Build" input** or "Create Website" button
3. **Generate a new site** (AI-powered)
4. **Once created**, click "Edit Site"
5. **Follow steps 5-7 from Option 1**

---

## What to Look For

### ✅ Preview Banner Should Show:
- Fixed position at top of page
- Gradient background (purple → orange)
- Eye emoji (👁️) + "PREVIEW MODE" text
- "← Edit Site" button (frosted glass effect)
- "Exit Preview" button (white background)

### ✅ Site Content Should:
- Render normally below the banner
- Show all blocks/sections
- Use the site's theme (colors, fonts)
- Have 48px top padding (so banner doesn't overlap content)

### ✅ Browser Console Should Show:
```
👁️ PREVIEW MODE
Analytics and tracking pixels are disabled in preview mode.
```

---

## Testing the Workflow

### Full Edit → Preview → Publish Flow:

1. **Open inline editor** for any site
2. **Click "Open Preview"** → Keeps editor tab open
3. **In editor tab**: Make a change (add text, change color)
4. **Click "Save"** in editor
5. **Switch to preview tab**
6. **Refresh the page** (Cmd+R / Ctrl+R)
7. **See your changes** reflected
8. **Repeat 3-7** until satisfied
9. **In editor tab**: Click "Publish"
10. **Site goes live** at `/s/{slug}`

---

## Preview URL Structure

- **Preview URL**: `http://localhost:3001/preview/{siteId}`
  - Example: `http://localhost:3001/preview/cm1a2b3c4d5e6f7g8h9i0`
  - Requires authentication (owner only)
  - Shows unpublished content

- **Public URL**: `http://localhost:3001/s/{slug}`
  - Example: `http://localhost:3001/s/my-business`
  - Anyone can view
  - Only shows published sites

---

## Testing Security

### Owner-Only Access:

1. **Copy preview URL** (e.g., `/preview/cm1a2b3c4d5e6f7g8h9i0`)
2. **Try accessing in incognito window** (or logged out)
3. **Should see**: 404 Not Found
4. **Why**: Preview requires `userId` to match `site.userId`

### Published vs Unpublished:

1. **Create a new site** (unpublished by default)
2. **Try accessing** at `/s/{slug}` → 404 Not Found
3. **Access via preview** `/preview/{id}` → ✅ Works!
4. **Click "Publish"** in editor
5. **Now try** `/s/{slug}` → ✅ Works!

---

## Expected Behavior

| Action | Expected Result |
|--------|----------------|
| Click "Open Preview" | New tab opens at `/preview/{id}` |
| Preview loads | Banner shows, content renders |
| Console logs | "👁️ PREVIEW MODE" message |
| Analytics/tracking | Disabled (not fired in preview) |
| SEO | Page has `noindex, nofollow` |
| Cache | Always fresh (`force-dynamic`) |
| Click "← Edit Site" | Returns to inline editor |
| Click "Exit Preview" | Goes to site dashboard |

---

## Troubleshooting

### Preview shows 404:
- ✅ Make sure you're logged in
- ✅ Check that the site ID is correct
- ✅ Verify you're the owner of the site

### Preview is blank:
- ✅ Check if site has pages (needs at least one page)
- ✅ Look for errors in browser console
- ✅ Verify blocks are rendering correctly

### Changes not showing:
- ✅ Did you click "Save" in the editor?
- ✅ Did you refresh the preview tab?
- ✅ Check if caching is disabled (`force-dynamic`)

---

## API Endpoints You Can Test

### Generate a Site (from scratch):
```bash
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "niche": "Consulting",
    "location": "San Francisco"
  }'
```

### Scan & Clone a Site:
```bash
curl -X POST http://localhost:3001/api/sites/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "siteName": "Example Clone",
    "mode": "clone"
  }'
```

**Note**: Both require authentication via Clerk. Test in the UI instead.

---

## Demo Video Script (If Recording)

1. **Start**: "I'm going to show you how to preview a website before publishing"
2. **Navigate**: Click to websites section
3. **Select**: Choose a site and click "Edit Site"
4. **Point out**: "Here's the new 'Open Preview' button"
5. **Click**: Open Preview → New tab
6. **Show**: Preview banner, site content
7. **Demonstrate**: Make a change in editor
8. **Save**: Click Save button
9. **Switch**: Go to preview tab
10. **Refresh**: Show updated content
11. **Explain**: "This is exactly what visitors will see when published"
12. **Finish**: Click Publish → Site goes live

---

## Success Criteria

✅ Preview opens in new tab from inline editor
✅ Preview banner displays with correct styling
✅ Site content renders with theme applied
✅ Analytics/tracking disabled in console
✅ Owner-only access enforced
✅ Changes reflect after save + refresh
✅ Published sites accessible at `/s/{slug}`

---

**The preview system is production-ready. Test it and you'll see it works exactly like Shopify!**
