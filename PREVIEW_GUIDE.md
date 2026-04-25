# 🎯 Website Preview System - User Guide

## What We Built

You asked: **"as far as the localhost3001 for thes site it doesent work so what do we need to do. for it to go live. what does shopify do so i can preview the site"**

We've implemented a **Shopify-style preview system** that allows you to view your websites BEFORE publishing them.

---

## How It Works Now

### 1. **Preview Route Created** (`/preview/[id]`)
- Access any site at: `http://localhost:3001/preview/{siteId}`
- Shows **unpublished** sites (the old `/s/[slug]` only showed published sites)
- Owner-only access (auth-protected)
- Always fresh content (no caching)

### 2. **Preview Banner**
When viewing a site in preview mode, you'll see:
- Fixed banner at top with gradient background (violet → amber)
- "👁️ PREVIEW MODE - This is how your site will look to visitors" message
- Two action buttons:
  - **← Edit Site** - Return to inline editor
  - **Exit Preview** - Go back to site dashboard

### 3. **One-Click Access from Editor**
In the inline website editor (`/websites/{siteId}/edit`):
- New **"Open Preview"** button in toolbar (blue, before Save button)
- Click it → Opens preview in **new tab**
- Make edits → Save → Refresh preview tab to see changes

---

## User Workflow

```
1. Edit Site
   └─> Click "Open Preview" button
       └─> New tab opens at /preview/{siteId}
           └─> See exactly what visitors will see
               └─> Make changes in editor tab
                   └─> Click "Save"
                       └─> Refresh preview tab
                           └─> See updated site
                               └─> When satisfied → Click "Publish"
```

---

## What's Different from `/s/[slug]`

| Feature | `/s/[slug]` (Public) | `/preview/[id]` (Preview) |
|---------|---------------------|---------------------------|
| **Access** | Anyone with link | Owner only |
| **Visibility** | Published sites only | Unpublished sites |
| **SEO** | Indexed by search engines | `noindex, nofollow` |
| **Analytics** | Tracking enabled | Tracking disabled |
| **Caching** | Cached for performance | Always fresh (`force-dynamic`) |
| **Banner** | None | Preview banner with navigation |

---

## Technical Implementation

### Files Created/Modified

1. **`/app/preview/[id]/page.tsx`** (NEW - 211 lines)
   - Server component with auth check
   - Fetches site by ID (not slug)
   - Shows ALL pages (not just published ones)
   - Preview banner with inline styles (guaranteed rendering)
   - Disables analytics/tracking scripts

2. **`/components/website/InlineEditor.tsx`** (MODIFIED)
   - Added `ExternalLink` icon import
   - Added "Open Preview" button (line 308-316)
   - Opens in new tab with `target="_blank"`

### Key Code Features

```typescript
// Always fresh, never cached
export const dynamic = "force-dynamic";

// Not indexed by search engines
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Preview Mode",
    robots: "noindex, nofollow",
  };
}

// Owner-only access
if (!site || !userId || site.userId !== userId) {
  notFound();
}

// Shows unpublished pages
include: {
  pages: { orderBy: { order: "asc" } }, // ALL pages
}

// Preview banner (inline styles for guaranteed rendering)
<div style={{
  position: "fixed", top: 0, zIndex: 9999,
  background: "linear-gradient(135deg, #8b5cf6, #f59e0b)",
  ...
}}>
  👁️ PREVIEW MODE
</div>
```

---

## How to Use Right Now

1. **Log into your app** at `http://localhost:3001`
2. **Go to a website** you've created (or create a new one)
3. **Click "Edit Site"** to open the inline editor
4. **Click "Open Preview"** button in the toolbar
5. **New tab opens** showing exactly what visitors will see
6. **Make changes** in the editor tab
7. **Click "Save"**
8. **Refresh preview tab** to see updates
9. **When satisfied** → Click "Publish"

---

## What This Matches from Shopify

✅ **Preview before publishing** - View unpublished sites
✅ **Owner-only access** - Security built-in
✅ **Preview indicator** - Clear banner shows preview mode
✅ **Easy navigation** - Edit/Exit buttons in banner
✅ **Side-by-side editing** - Preview opens in new tab
✅ **Fresh content** - No caching, always up-to-date
✅ **SEO protection** - Preview pages not indexed

---

## Next Steps

Your preview system is **fully functional**. You can now:

1. **Test the preview** by creating/editing a website
2. **Share preview links** with team members (owner-only for now)
3. **Optionally add**:
   - Shareable preview tokens (for non-owners)
   - Mobile preview toggle
   - Side-by-side editor/preview view
   - Auto-refresh on save

---

## Why localhost:3001 Wasn't Working Before

**Problem**: The public site route `/s/[slug]` had this check:
```typescript
if (!site || !site.published || site.pages.length === 0) notFound();
```

This blocked **unpublished** sites from being viewed at all.

**Solution**: Created separate `/preview/[id]` route that:
- Bypasses the published check
- Requires authentication (owner only)
- Shows all content regardless of published status

---

## Summary

✅ **Preview system implemented** (Shopify-style)
✅ **One-click access** from inline editor
✅ **Owner-only security** built-in
✅ **Preview banner** with navigation
✅ **Fresh content** (no caching)
✅ **SEO protection** (not indexed)

**Your sites are now previewable at `http://localhost:3001/preview/{siteId}` before publishing!**
