// ---------------------------------------------------------------------------
// Google Calendar Integration — Sync appointments & bookings
//
// This allows users to:
// 1. Connect their Google Calendar
// 2. Auto-create calendar events for client meetings
// 3. Sync bookings from booking page to calendar
// 4. Show availability in real-time
// 5. Send calendar invites automatically
//
// Uses Google OAuth 2.0 with Calendar API access.
// ---------------------------------------------------------------------------

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",      // Create/edit events
  "https://www.googleapis.com/auth/calendar.readonly",    // Read calendar
];

/** Initialize OAuth2 client */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Generate Google Calendar authorization URL */
export function getGoogleCalendarAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: userId,
    prompt: "consent",
  });
}

/** Exchange authorization code for tokens */
export async function handleGoogleCalendarCallback(code: string, userId: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Calendar OAuth: Missing tokens");
      return false;
    }

    // Store tokens in database (reuse EmailIntegration or create CalendarIntegration)
    await prisma.calendarIntegration.upsert({
      where: { userId },
      update: {
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        connected: true,
      },
      create: {
        userId,
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        connected: true,
      },
    });

    return true;
  } catch (err) {
    console.error("Calendar OAuth callback error:", err);
    return false;
  }
}

/** Get authenticated Calendar client */
async function getCalendarClient(userId: string) {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { userId },
  });

  if (!integration || integration.provider !== "google" || !integration.connected) {
    throw new Error("Google Calendar not connected");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  // Auto-refresh if expired
  if (integration.expiresAt && integration.expiresAt < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.calendarIntegration.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token ?? integration.accessToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : integration.expiresAt,
      },
    });
    oauth2Client.setCredentials(credentials);
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Create calendar event */
export async function createCalendarEvent(params: {
  userId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
}): Promise<{ ok: boolean; eventId?: string; eventLink?: string; error?: string }> {
  try {
    const calendar = await getCalendarClient(params.userId);

    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: "America/Los_Angeles", // TODO: Get from user settings
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone: "America/Los_Angeles",
      },
      attendees: params.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 },      // 30 min before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: "all", // Send email invites
    });

    return {
      ok: true,
      eventId: response.data.id ?? undefined,
      eventLink: response.data.htmlLink ?? undefined,
    };
  } catch (err) {
    console.error("Create calendar event error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Get upcoming events */
export async function getUpcomingEvents(params: {
  userId: string;
  maxResults?: number;
  timeMin?: Date;
}): Promise<{
  ok: boolean;
  events: Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    attendees?: string[];
    link?: string;
  }>;
}> {
  try {
    const calendar = await getCalendarClient(params.userId);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: (params.timeMin ?? new Date()).toISOString(),
      maxResults: params.maxResults ?? 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items ?? []).map(event => ({
      id: event.id ?? "",
      summary: event.summary ?? "Untitled Event",
      start: event.start?.dateTime ?? event.start?.date ?? "",
      end: event.end?.dateTime ?? event.end?.date ?? "",
      attendees: event.attendees?.map(a => a.email ?? "").filter(Boolean),
      link: event.htmlLink ?? undefined,
    }));

    return { ok: true, events };
  } catch (err) {
    console.error("Get upcoming events error:", err);
    return { ok: false, events: [] };
  }
}

/** Check availability for a time slot */
export async function checkAvailability(params: {
  userId: string;
  startTime: Date;
  endTime: Date;
}): Promise<{ ok: boolean; available: boolean }> {
  try {
    const calendar = await getCalendarClient(params.userId);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: params.startTime.toISOString(),
        timeMax: params.endTime.toISOString(),
        items: [{ id: "primary" }],
      },
    });

    const busy = response.data.calendars?.primary?.busy ?? [];
    const available = busy.length === 0;

    return { ok: true, available };
  } catch (err) {
    console.error("Check availability error:", err);
    return { ok: false, available: false };
  }
}

/** Disconnect Google Calendar */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await prisma.calendarIntegration.update({
    where: { userId },
    data: { connected: false },
  });
}
