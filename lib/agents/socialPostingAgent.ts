// ---------------------------------------------------------------------------
// Social Posting Agent — actually posts to platforms via their APIs
// Not just generates content — PUBLISHES it.
// Supports: Instagram, TikTok, Twitter/X, LinkedIn, Facebook
// ---------------------------------------------------------------------------

export type PostRequest = {
  platform: "instagram" | "tiktok" | "twitter" | "linkedin" | "facebook";
  content: string;
  mediaUrl?: string;        // Image or video URL
  mediaBase64?: string;     // Image as base64
  scheduledAt?: string;     // ISO 8601 — schedule for later
  hashtags?: string[];
};

export type PostResult = {
  ok: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
};

// ── Twitter/X ───────────────────────────────────────────────────────────

export async function postToTwitter(input: {
  accessToken: string;
  text: string;
}): Promise<PostResult> {
  try {
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input.text }),
    });

    if (!res.ok) return { ok: false, error: `Twitter error: ${res.status}` };
    const data = await res.json();
    return {
      ok: true,
      postId: data.data?.id,
      postUrl: data.data?.id ? `https://x.com/i/status/${data.data.id}` : undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Twitter post failed" };
  }
}

// ── LinkedIn ────────────────────────────────────────────────────────────

export async function postToLinkedIn(input: {
  accessToken: string;
  authorUrn: string;  // "urn:li:person:xxx"
  text: string;
}): Promise<PostResult> {
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: input.authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: input.text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!res.ok) return { ok: false, error: `LinkedIn error: ${res.status}` };
    const data = await res.json();
    return { ok: true, postId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "LinkedIn post failed" };
  }
}

// ── Facebook ────────────────────────────────────────────────────────────

export async function postToFacebook(input: {
  accessToken: string;
  pageId: string;
  message: string;
  link?: string;
}): Promise<PostResult> {
  try {
    const params = new URLSearchParams({
      message: input.message,
      access_token: input.accessToken,
    });
    if (input.link) params.set("link", input.link);

    const res = await fetch(`https://graph.facebook.com/v25.0/${input.pageId}/feed`, {
      method: "POST",
      body: params,
    });

    if (!res.ok) return { ok: false, error: `Facebook error: ${res.status}` };
    const data = await res.json();
    return { ok: true, postId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Facebook post failed" };
  }
}

// ── Instagram (via Facebook Graph API) ──────────────────────────────────

export async function postToInstagram(input: {
  accessToken: string;
  igUserId: string;
  caption: string;
  imageUrl: string;         // Must be a publicly accessible URL
}): Promise<PostResult> {
  try {
    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v25.0/${input.igUserId}/media`,
      {
        method: "POST",
        body: new URLSearchParams({
          image_url: input.imageUrl,
          caption: input.caption,
          access_token: input.accessToken,
        }),
      }
    );

    if (!createRes.ok) return { ok: false, error: `Instagram media creation failed: ${createRes.status}` };
    const createData = await createRes.json();
    const containerId = createData.id;

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v25.0/${input.igUserId}/media_publish`,
      {
        method: "POST",
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: input.accessToken,
        }),
      }
    );

    if (!publishRes.ok) return { ok: false, error: `Instagram publish failed: ${publishRes.status}` };
    const publishData = await publishRes.json();
    return { ok: true, postId: publishData.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Instagram post failed" };
  }
}

// ── TikTok (Content Posting API) ────────────────────────────────────────

export async function postToTikTok(input: {
  accessToken: string;
  videoUrl: string;
  caption: string;
}): Promise<PostResult> {
  try {
    // TikTok Content Posting API
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: input.caption.slice(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.videoUrl,
        },
      }),
    });

    if (!res.ok) return { ok: false, error: `TikTok error: ${res.status}` };
    const data = await res.json();
    return { ok: true, postId: data.data?.publish_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "TikTok post failed" };
  }
}

// ── Unified Poster ──────────────────────────────────────────────────────

export async function publishPost(request: PostRequest & {
  accessToken: string;
  platformConfig?: Record<string, string>;
}): Promise<PostResult> {
  switch (request.platform) {
    case "twitter":
      return postToTwitter({ accessToken: request.accessToken, text: request.content });
    case "linkedin":
      return postToLinkedIn({
        accessToken: request.accessToken,
        authorUrn: request.platformConfig?.authorUrn ?? "",
        text: request.content,
      });
    case "facebook":
      return postToFacebook({
        accessToken: request.accessToken,
        pageId: request.platformConfig?.pageId ?? "",
        message: request.content,
      });
    case "instagram":
      return postToInstagram({
        accessToken: request.accessToken,
        igUserId: request.platformConfig?.igUserId ?? "",
        caption: request.content,
        imageUrl: request.mediaUrl ?? "",
      });
    case "tiktok":
      return postToTikTok({
        accessToken: request.accessToken,
        caption: request.content,
        videoUrl: request.mediaUrl ?? "",
      });
    default:
      return { ok: false, error: "Unsupported platform" };
  }
}
