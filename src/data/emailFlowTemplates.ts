export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
};

export type EmailFlowTemplate = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  emailCount: number;
  tags: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export const EMAIL_FLOW_TEMPLATES: EmailFlowTemplate[] = [
  {
    id: "welcome-series",
    name: "Welcome Series",
    description: "Onboard new subscribers with a warm 3-email welcome sequence.",
    trigger: "signup",
    emailCount: 3,
    tags: ["onboarding", "welcome"],
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: { label: "Signup Trigger", nodeType: "trigger", triggerType: "signup" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 300, y: 200 },
        data: {
          label: "Welcome Email",
          nodeType: "email",
          subject: "Welcome to {{brand_name}}! Here's what's next",
          previewText: "You're in. Let's get started.",
        },
      },
      {
        id: "wait-1",
        type: "wait",
        position: { x: 300, y: 370 },
        data: { label: "Wait 2 Days", nodeType: "wait", duration: 2, unit: "days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 300, y: 520 },
        data: {
          label: "Value Proposition",
          nodeType: "email",
          subject: "Here's how {{brand_name}} helps you",
          previewText: "The features you'll love most",
        },
      },
      {
        id: "wait-2",
        type: "wait",
        position: { x: 300, y: 690 },
        data: { label: "Wait 3 Days", nodeType: "wait", duration: 3, unit: "days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 300, y: 840 },
        data: {
          label: "First Purchase Offer",
          nodeType: "email",
          subject: "A special offer just for you",
          previewText: "10% off your first order — expires soon",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "email-1" },
      { id: "e2-3", source: "email-1", target: "wait-1" },
      { id: "e3-4", source: "wait-1", target: "email-2" },
      { id: "e4-5", source: "email-2", target: "wait-2" },
      { id: "e5-6", source: "wait-2", target: "email-3" },
    ],
  },
  {
    id: "abandoned-cart-recovery",
    name: "Abandoned Cart Recovery",
    description: "Recover lost revenue with a 3-step cart reminder sequence.",
    trigger: "abandoned_cart",
    emailCount: 3,
    tags: ["revenue", "recovery"],
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: { label: "Abandoned Cart", nodeType: "trigger", triggerType: "abandoned_cart" },
      },
      {
        id: "wait-1",
        type: "wait",
        position: { x: 300, y: 200 },
        data: { label: "Wait 1 Hour", nodeType: "wait", duration: 1, unit: "hours" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 300, y: 350 },
        data: {
          label: "Cart Reminder",
          nodeType: "email",
          subject: "You left something behind",
          previewText: "Your cart is waiting for you",
        },
      },
      {
        id: "wait-2",
        type: "wait",
        position: { x: 300, y: 520 },
        data: { label: "Wait 23 Hours", nodeType: "wait", duration: 23, unit: "hours" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 300, y: 670 },
        data: {
          label: "Urgency Push",
          nodeType: "email",
          subject: "Still thinking it over?",
          previewText: "Items in your cart may sell out soon",
        },
      },
      {
        id: "wait-3",
        type: "wait",
        position: { x: 300, y: 840 },
        data: { label: "Wait 2 Days", nodeType: "wait", duration: 2, unit: "days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 300, y: 990 },
        data: {
          label: "Final Offer",
          nodeType: "email",
          subject: "Last chance — 10% off your cart",
          previewText: "This offer expires in 24 hours",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "wait-1" },
      { id: "e2-3", source: "wait-1", target: "email-1" },
      { id: "e3-4", source: "email-1", target: "wait-2" },
      { id: "e4-5", source: "wait-2", target: "email-2" },
      { id: "e5-6", source: "email-2", target: "wait-3" },
      { id: "e6-7", source: "wait-3", target: "email-3" },
    ],
  },
  {
    id: "post-purchase-flow",
    name: "Post-Purchase Flow",
    description: "Delight buyers and drive repeat purchases with a 4-email post-purchase sequence.",
    trigger: "purchase",
    emailCount: 4,
    tags: ["retention", "upsell"],
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: { label: "Purchase Trigger", nodeType: "trigger", triggerType: "purchase" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 300, y: 200 },
        data: {
          label: "Order Confirmation",
          nodeType: "email",
          subject: "Your order is confirmed!",
          previewText: "Here's everything you need to know",
        },
      },
      {
        id: "wait-1",
        type: "wait",
        position: { x: 300, y: 370 },
        data: { label: "Wait 2 Days", nodeType: "wait", duration: 2, unit: "days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 300, y: 520 },
        data: {
          label: "Shipping Update",
          nodeType: "email",
          subject: "Your order is on its way!",
          previewText: "Track your package here",
        },
      },
      {
        id: "wait-2",
        type: "wait",
        position: { x: 300, y: 690 },
        data: { label: "Wait 5 Days", nodeType: "wait", duration: 5, unit: "days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 300, y: 840 },
        data: {
          label: "Review Request",
          nodeType: "email",
          subject: "How was your experience?",
          previewText: "Leave a review and get 15% off your next order",
        },
      },
      {
        id: "wait-3",
        type: "wait",
        position: { x: 300, y: 1010 },
        data: { label: "Wait 7 Days", nodeType: "wait", duration: 7, unit: "days" },
      },
      {
        id: "email-4",
        type: "email",
        position: { x: 300, y: 1160 },
        data: {
          label: "Cross-Sell",
          nodeType: "email",
          subject: "Customers who bought this also love...",
          previewText: "Hand-picked just for you",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "email-1" },
      { id: "e2-3", source: "email-1", target: "wait-1" },
      { id: "e3-4", source: "wait-1", target: "email-2" },
      { id: "e4-5", source: "email-2", target: "wait-2" },
      { id: "e5-6", source: "wait-2", target: "email-3" },
      { id: "e6-7", source: "email-3", target: "wait-3" },
      { id: "e7-8", source: "wait-3", target: "email-4" },
    ],
  },
  {
    id: "vip-customer-flow",
    name: "VIP Customer Flow",
    description: "Reward high-value customers (orders $200+) and drive loyalty with 5 exclusive emails.",
    trigger: "purchase",
    emailCount: 5,
    tags: ["vip", "loyalty", "high-value"],
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: {
          label: "Purchase Trigger",
          nodeType: "trigger",
          triggerType: "purchase",
          minOrderValue: 200,
        },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 300, y: 200 },
        data: {
          label: "Order Value ≥ $200?",
          nodeType: "condition",
          field: "order.total",
          operator: "gte",
          value: 200,
        },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 500, y: 380 },
        data: {
          label: "VIP Welcome",
          nodeType: "email",
          subject: "Welcome to our VIP circle",
          previewText: "You've unlocked exclusive benefits",
        },
      },
      {
        id: "wait-1",
        type: "wait",
        position: { x: 500, y: 550 },
        data: { label: "Wait 1 Day", nodeType: "wait", duration: 1, unit: "days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 500, y: 700 },
        data: {
          label: "Exclusive Discount",
          nodeType: "email",
          subject: "Your VIP discount is ready",
          previewText: "20% off — exclusively for you",
        },
      },
      {
        id: "wait-2",
        type: "wait",
        position: { x: 500, y: 870 },
        data: { label: "Wait 3 Days", nodeType: "wait", duration: 3, unit: "days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 500, y: 1020 },
        data: {
          label: "Early Access",
          nodeType: "email",
          subject: "Early access: new arrivals just for VIPs",
          previewText: "Shop before everyone else",
        },
      },
      {
        id: "wait-3",
        type: "wait",
        position: { x: 500, y: 1190 },
        data: { label: "Wait 7 Days", nodeType: "wait", duration: 7, unit: "days" },
      },
      {
        id: "email-4",
        type: "email",
        position: { x: 500, y: 1340 },
        data: {
          label: "Referral Invite",
          nodeType: "email",
          subject: "Share the love — earn rewards",
          previewText: "Invite friends and get $25 credit each",
        },
      },
      {
        id: "wait-4",
        type: "wait",
        position: { x: 500, y: 1510 },
        data: { label: "Wait 14 Days", nodeType: "wait", duration: 14, unit: "days" },
      },
      {
        id: "email-5",
        type: "email",
        position: { x: 500, y: 1660 },
        data: {
          label: "VIP Check-In",
          nodeType: "email",
          subject: "How are you liking your purchase?",
          previewText: "We're always here to help",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "condition-1" },
      { id: "e2-3", source: "condition-1", target: "email-1", label: "Yes" },
      { id: "e3-4", source: "email-1", target: "wait-1" },
      { id: "e4-5", source: "wait-1", target: "email-2" },
      { id: "e5-6", source: "email-2", target: "wait-2" },
      { id: "e6-7", source: "wait-2", target: "email-3" },
      { id: "e7-8", source: "email-3", target: "wait-3" },
      { id: "e8-9", source: "wait-3", target: "email-4" },
      { id: "e9-10", source: "email-4", target: "wait-4" },
      { id: "e10-11", source: "wait-4", target: "email-5" },
    ],
  },
  {
    id: "re-engagement-campaign",
    name: "Re-engagement Campaign",
    description: "Win back subscribers who haven't engaged in 30+ days with a 3-email sequence.",
    trigger: "win_back",
    emailCount: 3,
    tags: ["win-back", "reactivation"],
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 300, y: 50 },
        data: {
          label: "Win-Back Trigger",
          nodeType: "trigger",
          triggerType: "win_back",
          inactiveDays: 30,
        },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 300, y: 200 },
        data: {
          label: "Miss You Email",
          nodeType: "email",
          subject: "We miss you, {{first_name}}",
          previewText: "It's been a while — here's what's new",
        },
      },
      {
        id: "wait-1",
        type: "wait",
        position: { x: 300, y: 370 },
        data: { label: "Wait 3 Days", nodeType: "wait", duration: 3, unit: "days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 300, y: 520 },
        data: {
          label: "Comeback Offer",
          nodeType: "email",
          subject: "A gift to welcome you back",
          previewText: "15% off — just for you",
        },
      },
      {
        id: "wait-2",
        type: "wait",
        position: { x: 300, y: 690 },
        data: { label: "Wait 5 Days", nodeType: "wait", duration: 5, unit: "days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 300, y: 840 },
        data: {
          label: "Final Chance",
          nodeType: "email",
          subject: "This is goodbye (unless...)",
          previewText: "Your offer expires tomorrow",
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "trigger-1", target: "email-1" },
      { id: "e2-3", source: "email-1", target: "wait-1" },
      { id: "e3-4", source: "wait-1", target: "email-2" },
      { id: "e4-5", source: "email-2", target: "wait-2" },
      { id: "e5-6", source: "wait-2", target: "email-3" },
    ],
  },
];
