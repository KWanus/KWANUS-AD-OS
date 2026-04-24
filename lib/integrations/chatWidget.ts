// ---------------------------------------------------------------------------
// Chat Widget — embeddable live chat for generated sites
// Messages stored in DB, delivered to unified inbox
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export type ChatMessage = {
  id: string;
  siteId: string;
  visitorId: string;
  visitorEmail?: string;
  visitorName?: string;
  direction: "inbound" | "outbound";
  message: string;
  timestamp: string;
  read: boolean;
};

/** Save an inbound chat message from a site visitor */
export async function saveChatMessage(input: {
  siteId: string;
  visitorId: string;
  visitorEmail?: string;
  visitorName?: string;
  message: string;
}): Promise<{ ok: boolean; messageId?: string }> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { userId: true, name: true },
    });
    if (!site) return { ok: false };

    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: site.userId,
        event: "chat_message",
        metadata: {
          siteId: input.siteId,
          visitorId: input.visitorId,
          visitorEmail: input.visitorEmail ?? null,
          visitorName: input.visitorName ?? null,
          direction: "inbound",
          message: input.message,
          read: false,
        },
      },
    });

    // Notify owner
    createNotification({
      userId: site.userId,
      type: "new_lead",
      title: `Chat: ${input.visitorName ?? "Visitor"}`,
      body: input.message.slice(0, 100),
      href: "/inbox",
    }).catch(() => {});

    // Auto-create contact if email provided
    if (input.visitorEmail) {
      await prisma.emailContact.upsert({
        where: { userId_email: { userId: site.userId, email: input.visitorEmail } },
        update: {},
        create: {
          userId: site.userId,
          email: input.visitorEmail,
          firstName: input.visitorName ?? null,
          source: `chat:${input.siteId}`,
          tags: ["chat", `site:${input.siteId}`],
        },
      }).catch(() => {});
    }

    return { ok: true, messageId: event.id };
  } catch {
    return { ok: false };
  }
}

/** Get chat messages for a site (for inbox view) */
export async function getChatMessages(userId: string, siteId?: string): Promise<ChatMessage[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: {
      userId,
      event: "chat_message",
      ...(siteId ? { metadata: { path: ["siteId"], equals: siteId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return events.map((e) => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      id: e.id,
      siteId: (meta.siteId as string) ?? "",
      visitorId: (meta.visitorId as string) ?? "",
      visitorEmail: meta.visitorEmail as string | undefined,
      visitorName: meta.visitorName as string | undefined,
      direction: (meta.direction as "inbound" | "outbound") ?? "inbound",
      message: (meta.message as string) ?? "",
      timestamp: e.createdAt.toISOString(),
      read: (meta.read as boolean) ?? false,
    };
  });
}

/** Generate the chat widget script to inject into sites */
export function generateChatWidgetScript(siteId: string): string {
  return `
<div id="himalaya-chat" style="position:fixed;bottom:20px;right:20px;z-index:9999;font-family:system-ui,sans-serif;"></div>
<script>
(function(){
  var siteId = '${siteId}';
  var visitorId = localStorage.getItem('h_visitor') || (function(){ var id = Math.random().toString(36).slice(2,10); localStorage.setItem('h_visitor', id); return id; })();
  var open = false;
  var root = document.getElementById('himalaya-chat');

  function render(){
    root.innerHTML = open ? '<div style="width:340px;height:440px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;">' +
      '<div style="background:linear-gradient(135deg,#f5a623,#e07850);padding:16px;color:#fff;display:flex;justify-content:space-between;align-items:center;">' +
        '<div><strong style="font-size:14px;">Chat with us</strong><br><span style="font-size:11px;opacity:0.8;">We usually reply within minutes</span></div>' +
        '<button onclick="document.getElementById(\\'himalaya-chat\\').querySelector(\\'[data-close]\\').click()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">×</button>' +
      '</div>' +
      '<div id="hc-messages" style="flex:1;padding:12px;overflow-y:auto;font-size:13px;color:#333;"></div>' +
      '<form id="hc-form" style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px;">' +
        '<input name="email" placeholder="Your email" style="flex:1;border:1px solid #ddd;border-radius:8px;padding:8px 12px;font-size:12px;outline:none;" required />' +
      '</form>' +
      '<form id="hc-msg-form" style="padding:0 12px 12px;display:flex;gap:8px;">' +
        '<input name="message" placeholder="Type a message..." style="flex:1;border:1px solid #ddd;border-radius:8px;padding:8px 12px;font-size:12px;outline:none;" required />' +
        '<button type="submit" style="background:#f5a623;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:bold;cursor:pointer;">Send</button>' +
      '</form>' +
    '</div>' +
    '<button data-close onclick="window._hcToggle()" style="display:none;"></button>'
    : '<button onclick="window._hcToggle()" style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#f5a623,#e07850);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(245,166,35,0.4);display:flex;align-items:center;justify-content:center;">' +
        '<svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '</button>';

    if(open){
      var msgForm = document.getElementById('hc-msg-form');
      if(msgForm) msgForm.addEventListener('submit', function(e){
        e.preventDefault();
        var input = msgForm.querySelector('input[name="message"]');
        var emailInput = document.querySelector('#hc-form input[name="email"]');
        if(!input.value.trim()) return;
        var msgs = document.getElementById('hc-messages');
        msgs.innerHTML += '<div style="background:#f5a623;color:#fff;padding:8px 12px;border-radius:12px;margin:4px 0;max-width:80%;margin-left:auto;font-size:13px;">' + input.value + '</div>';
        fetch('/api/chat/message', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({siteId:siteId, visitorId:visitorId, message:input.value, visitorEmail:emailInput?emailInput.value:''})
        }).catch(function(){});
        input.value = '';
        msgs.scrollTop = msgs.scrollHeight;
      });
    }
  }

  window._hcToggle = function(){ open = !open; render(); };
  render();
})();
</script>`;
}
