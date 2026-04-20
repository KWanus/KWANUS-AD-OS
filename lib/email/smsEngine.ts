// ---------------------------------------------------------------------------
// Unified Messaging Engine — SMS, Push Notifications, and Multi-Channel Bus
// Sits alongside email/send.ts and integrations/smsClient.ts to provide
// a single API for reaching contacts across every channel.
//
// Zero external dependencies — uses fetch for Twilio/Vonage HTTP APIs and
// the web-push VAPID spec directly.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// 1. SMS Provider Abstraction
// ═══════════════════════════════════════════════════════════════════════════

export type SmsResult = {
  ok: boolean;
  id?: string;
  provider: "twilio" | "vonage" | "log";
  error?: string;
};

export type SmsInput = {
  to: string; // E.164 format: +15551234567
  body: string;
  from?: string;
};

// ── Provider Interface ───────────────────────────────────────────────────

interface SmsProvider {
  name: "twilio" | "vonage" | "log";
  isConfigured(): boolean;
  send(to: string, body: string, from?: string): Promise<SmsResult>;
}

// ── Twilio Provider ──────────────────────────────────────────────────────

const twilioProvider: SmsProvider = {
  name: "twilio",

  isConfigured() {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE
    );
  },

  async send(to, body, from?) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = from ?? process.env.TWILIO_PHONE!;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          ok: false,
          provider: "twilio" as const,
          error: (err as Record<string, string>).message ?? `Twilio ${res.status}`,
        };
      }

      const data = (await res.json()) as { sid: string };
      return { ok: true, id: data.sid, provider: "twilio" as const };
    } catch (err) {
      return {
        ok: false,
        provider: "twilio" as const,
        error: err instanceof Error ? err.message : "Twilio send failed",
      };
    }
  },
};

// ── Vonage / Nexmo Provider ──────────────────────────────────────────────

const vonageProvider: SmsProvider = {
  name: "vonage",

  isConfigured() {
    return !!(
      process.env.VONAGE_API_KEY &&
      process.env.VONAGE_API_SECRET &&
      process.env.VONAGE_FROM
    );
  },

  async send(to, body, from?) {
    const apiKey = process.env.VONAGE_API_KEY!;
    const apiSecret = process.env.VONAGE_API_SECRET!;
    const fromNumber = from ?? process.env.VONAGE_FROM!;

    try {
      const res = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          to: to.replace(/^\+/, ""), // Vonage wants digits only
          from: fromNumber,
          text: body,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          provider: "vonage" as const,
          error: `Vonage HTTP ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        messages: Array<{
          status: string;
          "message-id"?: string;
          "error-text"?: string;
        }>;
      };

      const msg = data.messages?.[0];
      if (!msg || msg.status !== "0") {
        return {
          ok: false,
          provider: "vonage" as const,
          error: msg?.["error-text"] ?? "Vonage send failed",
        };
      }

      return { ok: true, id: msg["message-id"], provider: "vonage" as const };
    } catch (err) {
      return {
        ok: false,
        provider: "vonage" as const,
        error: err instanceof Error ? err.message : "Vonage send failed",
      };
    }
  },
};

// ── Log-only Fallback (development) ──────────────────────────────────────

const logProvider: SmsProvider = {
  name: "log",

  isConfigured() {
    return true; // Always available
  },

  async send(to, body) {
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[SMS:log] to=${to} id=${logId}\n  body: ${body.slice(0, 160)}`);
    return { ok: true, id: logId, provider: "log" as const };
  },
};

// ── Unified SMS Sender ───────────────────────────────────────────────────

const SMS_PROVIDERS: SmsProvider[] = [twilioProvider, vonageProvider, logProvider];

/**
 * Send an SMS through the first available provider.
 * Order: Twilio → Vonage → log-only fallback.
 */
export async function sendSmsUnified(input: SmsInput): Promise<SmsResult> {
  for (const provider of SMS_PROVIDERS) {
    if (!provider.isConfigured()) continue;

    const result = await provider.send(input.to, input.body, input.from);
    if (result.ok) return result;

    // If a real provider failed, try the next one
    console.warn(`[SMS] ${provider.name} failed: ${result.error}`);
  }

  return { ok: false, provider: "log", error: "All SMS providers failed" };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SMS Message Types & Helpers
// ═══════════════════════════════════════════════════════════════════════════

export type SmsMessageType = "transactional" | "marketing" | "conversational";

export type SmsMessage = {
  type: SmsMessageType;
  to: string;
  body: string;
  from?: string;
  /** For marketing: required opt-in check */
  skipConsentCheck?: boolean;
};

/** GSM-7 character limit per segment */
const GSM_SEGMENT_CHARS = 160;
/** UCS-2 (unicode) chars per segment */
const UCS2_SEGMENT_CHARS = 70;
/** Concat header overhead */
const GSM_CONCAT_CHARS = 153;
const UCS2_CONCAT_CHARS = 67;

/**
 * Detect whether a message requires UCS-2 encoding (non-GSM chars present).
 */
function isUcs2(text: string): boolean {
  // GSM 03.38 basic character set — anything outside this requires UCS-2
  // eslint-disable-next-line no-control-regex
  const gsmRegex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-Zäöñü§a-zàäöñüà^{}\\[\]~|€]*$/;
  return !gsmRegex.test(text);
}

/**
 * Calculate how many SMS segments a message will consume.
 */
export function calculateSmsSegments(body: string): {
  characters: number;
  segments: number;
  encoding: "GSM-7" | "UCS-2";
  remainingInSegment: number;
} {
  const characters = body.length;
  const ucs2 = isUcs2(body);
  const encoding = ucs2 ? "UCS-2" : "GSM-7";

  const singleLimit = ucs2 ? UCS2_SEGMENT_CHARS : GSM_SEGMENT_CHARS;
  const concatLimit = ucs2 ? UCS2_CONCAT_CHARS : GSM_CONCAT_CHARS;

  let segments: number;
  let remainingInSegment: number;

  if (characters <= singleLimit) {
    segments = 1;
    remainingInSegment = singleLimit - characters;
  } else {
    segments = Math.ceil(characters / concatLimit);
    remainingInSegment = segments * concatLimit - characters;
  }

  return { characters, segments, encoding, remainingInSegment };
}

/**
 * Shorten URLs in SMS body with a tracking placeholder.
 * In production, replace with your actual shortener domain.
 */
export function shortenSmsUrls(
  body: string,
  trackingBaseUrl?: string
): { body: string; urls: Array<{ original: string; short: string }> } {
  const baseUrl =
    trackingBaseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://localhost:3005";

  const urls: Array<{ original: string; short: string }> = [];

  const shortened = body.replace(
    /https?:\/\/[^\s]+/g,
    (originalUrl) => {
      const hash = crypto
        .createHash("md5")
        .update(originalUrl)
        .digest("hex")
        .slice(0, 8);
      const short = `${baseUrl}/r/${hash}`;
      urls.push({ original: originalUrl, short });
      return short;
    }
  );

  return { body: shortened, urls };
}

/**
 * Send a typed SMS with consent checking and segment tracking.
 */
export async function sendTypedSms(
  userId: string,
  message: SmsMessage
): Promise<SmsResult & { segments?: number }> {
  // Marketing messages require opt-in
  if (message.type === "marketing" && !message.skipConsentCheck) {
    const consent = await checkSmsConsent(userId, message.to);
    if (!consent.consented) {
      return {
        ok: false,
        provider: "log",
        error: `SMS consent not found for ${message.to}: ${consent.reason}`,
      };
    }
  }

  const segmentInfo = calculateSmsSegments(message.body);

  // Shorten URLs for tracking
  const { body: processedBody } = shortenSmsUrls(message.body);

  const result = await sendSmsUnified({
    to: message.to,
    body: processedBody,
    from: message.from,
  });

  // Track usage
  if (result.ok) {
    await trackSmsUsage(userId, segmentInfo.segments).catch(() => {});
  }

  return { ...result, segments: segmentInfo.segments };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Push Notification Engine
// ═══════════════════════════════════════════════════════════════════════════

export type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushNotification = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  /** Time-to-live in seconds (default 86400 = 24h) */
  ttl?: number;
};

export type PushResult = {
  ok: boolean;
  statusCode?: number;
  error?: string;
};

function hasVapidConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/**
 * Build a signed JWT for VAPID authentication per RFC 8292.
 */
function buildVapidJwt(audience: string): string {
  const privateKeyBase64 = process.env.VAPID_PRIVATE_KEY!;

  // VAPID JWT header
  const header = { typ: "JWT", alg: "ES256" };

  // Claims: aud = push service origin, exp = 24h, sub = contact email
  const claims = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400,
    sub: `mailto:${process.env.VAPID_CONTACT_EMAIL ?? "notifications@himalaya.app"}`,
  };

  const encodeSegment = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url");

  const headerB64 = encodeSegment(header);
  const claimsB64 = encodeSegment(claims as unknown as Record<string, unknown>);
  const unsigned = `${headerB64}.${claimsB64}`;

  // Sign with the VAPID private key (base64url-encoded raw ECDSA P-256 key)
  const keyBuffer = Buffer.from(privateKeyBase64, "base64url");
  const pem = convertRawKeyToPem(keyBuffer);

  const sign = crypto.createSign("SHA256");
  sign.update(unsigned);
  const derSig = sign.sign(pem);

  // Convert DER signature to raw r||s (64 bytes) for JWT ES256
  const rawSig = derToRaw(derSig);
  const sigB64 = Buffer.from(rawSig).toString("base64url");

  return `${unsigned}.${sigB64}`;
}

/**
 * Convert a raw 32-byte ECDSA P-256 private key to PEM format.
 */
function convertRawKeyToPem(rawKey: Buffer): string {
  // SEC1 / RFC 5915: wrap the raw key in an EC private key structure
  // OID for P-256: 1.2.840.10045.3.1.7
  const oidP256 = Buffer.from("06082a8648ce3d030107", "hex");
  const keyOctet = Buffer.concat([Buffer.from([0x04, 0x20]), rawKey]);

  // Build the SEQUENCE
  const ecKey = Buffer.concat([
    Buffer.from([0x30, 0x00]), // placeholder length
    Buffer.from([0x02, 0x01, 0x01]), // version = 1
    keyOctet,
    Buffer.from([0xa0]),
    Buffer.from([oidP256.length]),
    oidP256,
  ]);

  // Fix the sequence length
  ecKey[1] = ecKey.length - 2;

  const b64 = ecKey.toString("base64");
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN EC PRIVATE KEY-----\n${lines.join("\n")}\n-----END EC PRIVATE KEY-----`;
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format (64 bytes).
 */
function derToRaw(der: Buffer): Buffer {
  // DER: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  let offset = 2; // skip SEQUENCE header
  const rLen = der[offset + 1];
  const r = der.subarray(offset + 2, offset + 2 + rLen);
  offset += 2 + rLen;
  const sLen = der[offset + 1];
  const s = der.subarray(offset + 2, offset + 2 + sLen);

  // Pad/trim to 32 bytes each
  const rPad = Buffer.alloc(32);
  const sPad = Buffer.alloc(32);
  r.copy(rPad, Math.max(0, 32 - r.length), Math.max(0, r.length - 32));
  s.copy(sPad, Math.max(0, 32 - s.length), Math.max(0, s.length - 32));

  return Buffer.concat([rPad, sPad]);
}

/**
 * Send a single web push notification via the Web Push Protocol (RFC 8030 + RFC 8291).
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  url?: string,
  icon?: string
): Promise<PushResult> {
  if (!hasVapidConfigured()) {
    console.log(
      `[Push:log] title="${title}" body="${body.slice(0, 80)}" endpoint=${subscription.endpoint.slice(0, 60)}...`
    );
    return { ok: true, statusCode: 200 };
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url ?? "/",
    icon: icon ?? "/icon-192.png",
  } satisfies PushNotification);

  try {
    const audience = new URL(subscription.endpoint).origin;
    const jwt = buildVapidJwt(audience);
    const publicKey = process.env.VAPID_PUBLIC_KEY!;

    // Encrypt payload per RFC 8291 (aes128gcm)
    const encrypted = await encryptPushPayload(
      payload,
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${publicKey}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
      },
      body: new Uint8Array(encrypted),
    });

    if (res.status === 201 || res.status === 200) {
      return { ok: true, statusCode: res.status };
    }

    // 410 Gone = subscription expired, caller should remove it
    if (res.status === 410) {
      return { ok: false, statusCode: 410, error: "Subscription expired" };
    }

    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      statusCode: res.status,
      error: `Push service returned ${res.status}: ${errText.slice(0, 200)}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Push send failed",
    };
  }
}

/**
 * Encrypt a push notification payload per RFC 8291 (aes128gcm content encoding).
 *
 * This implements the full encryption spec:
 * 1. Generate ephemeral ECDH key pair on P-256
 * 2. Derive shared secret via ECDH with the subscriber's public key
 * 3. Derive encryption key and nonce via HKDF
 * 4. Encrypt with AES-128-GCM
 * 5. Prepend the header (salt + key ID length + key ID)
 */
async function encryptPushPayload(
  payload: string,
  p256dhBase64: string,
  authBase64: string
): Promise<Buffer> {
  const subscriberPubKey = Buffer.from(p256dhBase64, "base64url");
  const authSecret = Buffer.from(authBase64, "base64url");

  // 1. Generate ephemeral ECDH key
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const localPubKey = ecdh.getPublicKey();

  // 2. Derive shared secret
  const sharedSecret = ecdh.computeSecret(subscriberPubKey);

  // 3. HKDF to derive IKM (input keying material)
  // info = "WebPush: info\0" + subscriberPubKey + localPubKey
  const infoAuth = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf8"),
    subscriberPubKey,
    localPubKey,
  ]);
  const ikm = hkdf(authSecret, sharedSecret, infoAuth, 32);

  // 4. Generate salt (16 random bytes)
  const salt = crypto.randomBytes(16);

  // 5. Derive content encryption key and nonce
  const cekInfo = Buffer.from("Content-Encoding: aes128gcm\0", "utf8");
  const nonceInfo = Buffer.from("Content-Encoding: nonce\0", "utf8");
  const cek = hkdf(salt, ikm, cekInfo, 16);
  const nonce = hkdf(salt, ikm, nonceInfo, 12);

  // 6. Pad the plaintext (add delimiter byte 0x02 for final record)
  const padded = Buffer.concat([
    Buffer.from(payload, "utf8"),
    Buffer.from([0x02]), // Delimiter: final record
  ]);

  // 7. Encrypt with AES-128-GCM
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ciphertext = Buffer.concat([encrypted, tag]);

  // 8. Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0); // record size
  const idLen = Buffer.from([localPubKey.length]);

  return Buffer.concat([salt, rs, idLen, localPubKey, ciphertext]);
}

/**
 * HKDF-SHA256 (extract + expand).
 */
function hkdf(
  salt: Buffer,
  ikm: Buffer,
  info: Buffer,
  length: number
): Buffer {
  // Extract
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest();

  // Expand
  const infoWithCounter = Buffer.concat([info, Buffer.from([1])]);
  const okm = crypto
    .createHmac("sha256", prk)
    .update(infoWithCounter)
    .digest();

  return okm.subarray(0, length);
}

/**
 * Send push notifications to multiple subscriptions in parallel (batched).
 */
export async function sendPushBatch(
  subscriptions: PushSubscription[],
  notification: PushNotification
): Promise<{
  sent: number;
  failed: number;
  expired: string[]; // endpoints to remove
}> {
  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  // Process in batches of 10 to avoid overwhelming the push service
  const batchSize = 10;
  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((sub) =>
        sendPushNotification(
          sub,
          notification.title,
          notification.body,
          notification.url,
          notification.icon
        )
      )
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled" && result.value.ok) {
        sent++;
      } else {
        failed++;
        // Track expired subscriptions so caller can clean up
        if (
          result.status === "fulfilled" &&
          result.value.statusCode === 410
        ) {
          expired.push(batch[j].endpoint);
        }
      }
    }
  }

  return { sent, failed, expired };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Unified Message Bus
// ═══════════════════════════════════════════════════════════════════════════

export type MessageChannel = "email" | "sms" | "push";

export type UnifiedMessage = {
  channels: MessageChannel[];
  to: string; // contactEmail — resolve phone/push from properties
  subject?: string; // email only
  body: string; // used for all channels
  htmlBody?: string; // email only
  url?: string; // push click target
  priority: "high" | "normal" | "low";
};

export type ChannelAvailability = {
  email: boolean;
  sms: boolean;
  push: boolean;
  phoneNumber?: string;
  pushSubscription?: PushSubscription;
};

export type UnifiedSendResult = {
  email?: { ok: boolean; id?: string; error?: string };
  sms?: SmsResult & { segments?: number };
  push?: PushResult;
  channelsSent: MessageChannel[];
  channelsFailed: MessageChannel[];
};

/**
 * Get which messaging channels are available for a given contact.
 * Reads from EmailContact.properties to find phone and push subscription.
 */
export async function getContactChannels(
  userId: string,
  contactEmail: string
): Promise<ChannelAvailability> {
  const contact = await prisma.emailContact.findFirst({
    where: { userId, email: contactEmail },
    select: { properties: true, status: true },
  });

  if (!contact || contact.status === "unsubscribed") {
    return { email: false, sms: false, push: false };
  }

  const props = (contact.properties ?? {}) as Record<string, unknown>;
  const phoneNumber = typeof props.phone === "string" ? props.phone : undefined;
  const pushSub = props.pushSubscription as PushSubscription | undefined;

  // Check per-channel opt-in/opt-out preferences
  const prefs = (props.channelPreferences ?? {}) as Record<string, boolean>;
  const emailOptedIn = prefs.email !== false; // default: opted in
  const smsOptedIn = prefs.sms !== false && !!phoneNumber;
  const pushOptedIn = prefs.push !== false && !!pushSub;

  return {
    email: emailOptedIn,
    sms: smsOptedIn,
    push: pushOptedIn,
    phoneNumber,
    pushSubscription: pushSub,
  };
}

/**
 * Send a message across all specified channels for a contact.
 * Resolves phone/push subscription from contact properties.
 * Respects per-channel opt-in/opt-out preferences.
 */
export async function sendUnified(
  userId: string,
  message: UnifiedMessage
): Promise<UnifiedSendResult> {
  const channels = await getContactChannels(userId, message.to);
  const result: UnifiedSendResult = {
    channelsSent: [],
    channelsFailed: [],
  };

  // Determine which channels to actually send on
  const toSend = message.channels.filter((ch) => {
    switch (ch) {
      case "email":
        return channels.email;
      case "sms":
        return channels.sms && channels.phoneNumber;
      case "push":
        return channels.push && channels.pushSubscription;
      default:
        return false;
    }
  });

  // Send in parallel across channels
  const promises: Promise<void>[] = [];

  if (toSend.includes("email")) {
    promises.push(
      (async () => {
        try {
          // Dynamic import to avoid circular deps with the email sender
          const { sendEmailUnified } = await import(
            "@/lib/integrations/emailSender"
          );
          const emailResult = await sendEmailUnified({
            from: `Himalaya <notifications@himalaya.app>`,
            to: message.to,
            subject: message.subject ?? message.body.slice(0, 78),
            html: message.htmlBody ?? `<p>${message.body}</p>`,
          });
          result.email = emailResult;
          if (emailResult.ok) result.channelsSent.push("email");
          else result.channelsFailed.push("email");
        } catch (err) {
          result.email = {
            ok: false,
            error: err instanceof Error ? err.message : "Email send failed",
          };
          result.channelsFailed.push("email");
        }
      })()
    );
  }

  if (toSend.includes("sms") && channels.phoneNumber) {
    promises.push(
      (async () => {
        const smsResult = await sendTypedSms(userId, {
          type: "transactional",
          to: channels.phoneNumber!,
          body: message.body,
          skipConsentCheck: message.priority === "high", // OTP, etc.
        });
        result.sms = smsResult;
        if (smsResult.ok) result.channelsSent.push("sms");
        else result.channelsFailed.push("sms");
      })()
    );
  }

  if (toSend.includes("push") && channels.pushSubscription) {
    promises.push(
      (async () => {
        const pushResult = await sendPushNotification(
          channels.pushSubscription!,
          message.subject ?? "Notification",
          message.body,
          message.url,
        );
        result.push = pushResult;
        if (pushResult.ok) result.channelsSent.push("push");
        else result.channelsFailed.push("push");
      })()
    );
  }

  await Promise.allSettled(promises);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SMS in Email Flows
// ═══════════════════════════════════════════════════════════════════════════

type FlowNode = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

type FlowContact = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  properties?: Record<string, unknown> | null;
};

/**
 * Personalize an SMS template with contact data.
 * Supports: {{first_name}}, {{last_name}}, {{email}}, {{order_total}},
 * and any property from contact.properties.
 */
function personalizeTemplate(
  template: string,
  contact: FlowContact,
  extraVars?: Record<string, string>
): string {
  let result = template;

  // Built-in variables
  const vars: Record<string, string> = {
    first_name: contact.firstName ?? "there",
    last_name: contact.lastName ?? "",
    email: contact.email,
    ...((contact.properties ?? {}) as Record<string, string>),
    ...(extraVars ?? {}),
  };

  // Replace {{var_name}} patterns
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => vars[key] ?? ""
  );

  // Also support {varName} patterns (legacy compat)
  result = result.replace(
    /\{(\w+)\}/g,
    (_, key: string) => vars[key] ?? ""
  );

  return result.trim();
}

/**
 * Execute an SMS node from an email flow.
 * Called by the flow engine when it encounters a node with type "sms".
 */
export async function executeSmsNode(
  node: FlowNode,
  contact: FlowContact,
  userId: string
): Promise<SmsResult & { segments?: number }> {
  const smsBody = (node.data.smsBody ?? node.data.body ?? "") as string;
  if (!smsBody) {
    return { ok: false, provider: "log", error: "SMS node has no body text" };
  }

  // Get phone number from contact properties
  const props = (contact.properties ?? {}) as Record<string, string>;
  const phone = props.phone;

  if (!phone) {
    return {
      ok: false,
      provider: "log",
      error: `No phone number for contact ${contact.email}`,
    };
  }

  // Check consent for marketing
  const nodeType = (node.data.smsType as SmsMessageType) ?? "transactional";
  if (nodeType === "marketing") {
    const consent = await checkSmsConsent(userId, contact.email);
    if (!consent.consented) {
      return {
        ok: false,
        provider: "log",
        error: `SMS consent not found: ${consent.reason}`,
      };
    }
  }

  // Personalize template
  const personalizedBody = personalizeTemplate(
    smsBody,
    contact,
    (node.data.templateVars ?? {}) as Record<string, string>
  );

  // Calculate segments for reporting
  const segmentInfo = calculateSmsSegments(personalizedBody);

  // Shorten URLs
  const { body: finalBody } = shortenSmsUrls(personalizedBody);

  // Send
  const result = await sendSmsUnified({
    to: phone,
    body: finalBody,
    from: (node.data.fromNumber as string) ?? undefined,
  });

  // Track usage
  if (result.ok) {
    await trackSmsUsage(userId, segmentInfo.segments).catch(() => {});
  }

  return { ...result, segments: segmentInfo.segments };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Compliance
// ═══════════════════════════════════════════════════════════════════════════

export type SmsConsentResult = {
  consented: boolean;
  reason: string;
  consentedAt?: string;
};

/**
 * Verify that a contact has opted in to receive SMS messages.
 * Consent is stored in contact.properties.smsConsent.
 */
export async function checkSmsConsent(
  userId: string,
  contactEmail: string
): Promise<SmsConsentResult> {
  const contact = await prisma.emailContact.findFirst({
    where: { userId, email: contactEmail },
    select: { properties: true, status: true },
  });

  if (!contact) {
    return { consented: false, reason: "Contact not found" };
  }

  if (contact.status === "unsubscribed") {
    return { consented: false, reason: "Contact is unsubscribed" };
  }

  const props = (contact.properties ?? {}) as Record<string, unknown>;

  // Check explicit SMS consent
  const smsConsent = props.smsConsent as
    | { optedIn: boolean; at: string; keyword?: string }
    | undefined;

  if (!smsConsent) {
    return { consented: false, reason: "No SMS consent recorded" };
  }

  if (!smsConsent.optedIn) {
    return { consented: false, reason: "SMS consent revoked" };
  }

  return {
    consented: true,
    reason: "SMS consent active",
    consentedAt: smsConsent.at,
  };
}

/**
 * Record SMS opt-in consent for a contact.
 */
export async function recordSmsOptIn(
  userId: string,
  contactEmail: string,
  phone: string,
  source: string = "web_form"
): Promise<{ ok: boolean }> {
  try {
    const contact = await prisma.emailContact.findFirst({
      where: { userId, email: contactEmail },
      select: { id: true, properties: true },
    });

    if (!contact) {
      return { ok: false };
    }

    const props = (contact.properties ?? {}) as Record<string, unknown>;

    await prisma.emailContact.update({
      where: { id: contact.id },
      data: {
        properties: {
          ...props,
          phone,
          smsConsent: {
            optedIn: true,
            at: new Date().toISOString(),
            source,
          },
          channelPreferences: {
            ...((props.channelPreferences ?? {}) as Record<string, boolean>),
            sms: true,
          },
        },
      },
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Process an SMS opt-out keyword (STOP, UNSUBSCRIBE, CANCEL, END, QUIT).
 * Called from an inbound SMS webhook handler.
 */
export async function handleSmsOptOut(
  phone: string,
  keyword: string
): Promise<{ ok: boolean; contactsUpdated: number }> {
  const normalizedKeyword = keyword.trim().toUpperCase();
  const optOutKeywords = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];

  if (!optOutKeywords.includes(normalizedKeyword)) {
    return { ok: false, contactsUpdated: 0 };
  }

  try {
    // Find all contacts with this phone number across all users
    // (phone is stored in properties.phone)
    const contacts = await prisma.emailContact.findMany({
      where: {
        properties: {
          path: ["phone"],
          equals: phone,
        },
      },
      select: { id: true, properties: true },
    });

    let updated = 0;

    for (const contact of contacts) {
      const props = (contact.properties ?? {}) as Record<string, unknown>;

      await prisma.emailContact.update({
        where: { id: contact.id },
        data: {
          properties: {
            ...props,
            smsConsent: {
              optedIn: false,
              at: new Date().toISOString(),
              keyword: normalizedKeyword,
            },
            channelPreferences: {
              ...((props.channelPreferences ?? {}) as Record<string, boolean>),
              sms: false,
            },
          },
        },
      });

      updated++;
    }

    return { ok: true, contactsUpdated: updated };
  } catch {
    return { ok: false, contactsUpdated: 0 };
  }
}

/**
 * Track monthly SMS usage for billing purposes.
 * Stores in contact-level properties keyed by YYYY-MM.
 */
async function trackSmsUsage(
  userId: string,
  segments: number
): Promise<void> {
  const monthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const cacheKey = `sms_usage:${userId}:${monthKey}`;

  // Use a simple upsert pattern — store usage in a dedicated record
  // We piggyback on EmailContact with a synthetic record for the user
  const usageEmail = `__sms_usage__@${userId}`;

  try {
    const existing = await prisma.emailContact.findFirst({
      where: { userId, email: usageEmail },
      select: { id: true, properties: true },
    });

    if (existing) {
      const props = (existing.properties ?? {}) as Record<string, unknown>;
      const currentUsage =
        typeof props[cacheKey] === "number" ? (props[cacheKey] as number) : 0;

      const updatedProps: Record<string, unknown> = {
            ...props,
            [cacheKey]: currentUsage + segments,
            lastSmsAt: new Date().toISOString(),
          };

      await prisma.emailContact.update({
        where: { id: existing.id },
        data: {
          properties: updatedProps as object,
        },
      });
    } else {
      const newProps: Record<string, unknown> = {
            [cacheKey]: segments,
            lastSmsAt: new Date().toISOString(),
          };

      await prisma.emailContact.create({
        data: {
          userId,
          email: usageEmail,
          status: "unsubscribed", // Never send email to this synthetic record
          source: "system:sms_usage",
          tags: ["system", "sms-usage-tracker"],
          properties: newProps as object,
        },
      });
    }
  } catch (err) {
    console.warn(`[SMS] Failed to track usage for ${userId}:`, err);
  }
}

/**
 * Get SMS usage stats for a user in the current billing period.
 */
export async function getSmsUsage(
  userId: string
): Promise<{
  currentMonth: number;
  previousMonth: number;
  monthKey: string;
  lastSmsAt: string | null;
}> {
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = prevDate.toISOString().slice(0, 7);

  const usageEmail = `__sms_usage__@${userId}`;

  try {
    const record = await prisma.emailContact.findFirst({
      where: { userId, email: usageEmail },
      select: { properties: true },
    });

    if (!record) {
      return {
        currentMonth: 0,
        previousMonth: 0,
        monthKey: currentMonthKey,
        lastSmsAt: null,
      };
    }

    const props = (record.properties ?? {}) as Record<string, unknown>;
    const currentCacheKey = `sms_usage:${userId}:${currentMonthKey}`;
    const prevCacheKey = `sms_usage:${userId}:${prevMonthKey}`;

    return {
      currentMonth:
        typeof props[currentCacheKey] === "number"
          ? (props[currentCacheKey] as number)
          : 0,
      previousMonth:
        typeof props[prevCacheKey] === "number"
          ? (props[prevCacheKey] as number)
          : 0,
      monthKey: currentMonthKey,
      lastSmsAt:
        typeof props.lastSmsAt === "string"
          ? (props.lastSmsAt as string)
          : null,
    };
  } catch {
    return {
      currentMonth: 0,
      previousMonth: 0,
      monthKey: currentMonthKey,
      lastSmsAt: null,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Push Subscription Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Store a push subscription for a contact (saved in properties.pushSubscription).
 */
export async function savePushSubscription(
  userId: string,
  contactEmail: string,
  subscription: PushSubscription
): Promise<{ ok: boolean }> {
  try {
    const contact = await prisma.emailContact.findFirst({
      where: { userId, email: contactEmail },
      select: { id: true, properties: true },
    });

    if (!contact) return { ok: false };

    const props = (contact.properties ?? {}) as Record<string, unknown>;

    await prisma.emailContact.update({
      where: { id: contact.id },
      data: {
        properties: {
          ...props,
          pushSubscription: subscription,
          channelPreferences: {
            ...((props.channelPreferences ?? {}) as Record<string, boolean>),
            push: true,
          },
        },
      },
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Remove a push subscription for a contact (e.g., after 410 Gone).
 */
export async function removePushSubscription(
  userId: string,
  contactEmail: string
): Promise<{ ok: boolean }> {
  try {
    const contact = await prisma.emailContact.findFirst({
      where: { userId, email: contactEmail },
      select: { id: true, properties: true },
    });

    if (!contact) return { ok: false };

    const props = (contact.properties ?? {}) as Record<string, unknown>;

    // Remove subscription, keep other properties
    const { pushSubscription: _, ...rest } = props;

    await prisma.emailContact.update({
      where: { id: contact.id },
      data: {
        properties: {
          ...rest,
          channelPreferences: {
            ...((rest.channelPreferences ?? {}) as Record<string, boolean>),
            push: false,
          },
        },
      },
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
