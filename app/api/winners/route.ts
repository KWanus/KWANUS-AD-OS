import { NextRequest, NextResponse } from "next/server";

export interface WinnerAd {
  id: string;
  title: string;
  niche: string;
  platform: "TikTok" | "Facebook" | "Instagram" | "YouTube";
  format: "UGC" | "Static Image" | "Slideshow" | "Talking Head" | "Demo";
  thumbnail: string;
  metrics: {
    views: string;
    likes: string;
    roas: number;
    spend: string;
    ctr?: string;
    cpm?: string;
  };
  score: number;
  saturation: "low" | "medium" | "high";
  url: string;
  hook: string;
  whyItWorks: string;
}

const MOCK_WINNERS: WinnerAd[] = [
  // ── Health & Wellness ──────────────────────────────────────────────────────
  {
    id: "w1",
    title: "Portable Ice Bath Recovery Pod",
    niche: "Health & Wellness",
    platform: "TikTok",
    format: "UGC",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "18.4M", likes: "1.2M", roas: 5.8, spend: "$32k", ctr: "4.2%", cpm: "$8.50" },
    score: 97,
    saturation: "low",
    url: "https://example.com/ice-bath",
    hook: "I stopped going to the gym for 30 days and did THIS instead...",
    whyItWorks: "Recovery angle is underserved. Athletes + biohackers = high LTV buyers."
  },
  {
    id: "w2",
    title: "Red Light Therapy Face Mask",
    niche: "Beauty & Skincare",
    platform: "TikTok",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "12.1M", likes: "890k", roas: 6.2, spend: "$18k", ctr: "5.1%", cpm: "$7.20" },
    score: 95,
    saturation: "low",
    url: "https://example.com/red-light",
    hook: "Dermatologists don't want you to know this $89 trick...",
    whyItWorks: "Sci-fi look drives curiosity. Before/after is irresistible. High perceived value."
  },
  {
    id: "w3",
    title: "Posture Corrector Pro",
    niche: "Health & Wellness",
    platform: "Facebook",
    format: "Static Image",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "3.2M", likes: "95k", roas: 4.1, spend: "$28k", ctr: "3.8%", cpm: "$12.00" },
    score: 84,
    saturation: "medium",
    url: "https://example.com/posture",
    hook: "If you sit at a desk 8+ hours a day, you need this.",
    whyItWorks: "Massive addressable market. Pain-point obvious. Works on 35-65 FB demo perfectly."
  },
  // ── Pet Products ──────────────────────────────────────────────────────────
  {
    id: "w4",
    title: "Magic Self-Cleaning Pet Brush",
    niche: "Pet Supplies",
    platform: "TikTok",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "22.7M", likes: "1.8M", roas: 5.1, spend: "$5k", ctr: "6.3%", cpm: "$4.80" },
    score: 95,
    saturation: "low",
    url: "https://example.com/pet-brush",
    hook: "My dog HATES being groomed until I found this...",
    whyItWorks: "Demo shows instant satisfaction. Pet content = organic viral spread. Low saturation."
  },
  {
    id: "w5",
    title: "Orthopedic Dog Bed",
    niche: "Pet Supplies",
    platform: "Facebook",
    format: "Slideshow",
    thumbnail: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "4.1M", likes: "120k", roas: 3.9, spend: "$22k", ctr: "3.2%", cpm: "$14.00" },
    score: 82,
    saturation: "medium",
    url: "https://example.com/dog-bed",
    hook: "Your dog deserves better sleep than you.",
    whyItWorks: "Guilt-based angle + aspirational. Repeat buyers. Works for 35-55 dog mom demo."
  },
  // ── Home & Kitchen ────────────────────────────────────────────────────────
  {
    id: "w6",
    title: "Eco-Friendly Portable Blender",
    niche: "Home & Kitchen",
    platform: "TikTok",
    format: "UGC",
    thumbnail: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "2.4M", likes: "185k", roas: 4.2, spend: "$12k", ctr: "4.8%", cpm: "$9.20" },
    score: 92,
    saturation: "low",
    url: "https://example.com/blender",
    hook: "I made a protein shake while hiking Mount Rainier.",
    whyItWorks: "Adventure lifestyle angle. Demo-friendly. Strong gifting angle for Q4."
  },
  {
    id: "w7",
    title: "Heated Blanket with Auto-Off",
    niche: "Home & Kitchen",
    platform: "Facebook",
    format: "Static Image",
    thumbnail: "https://images.unsplash.com/photo-1580893246395-52aead8960dc?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "5.9M", likes: "310k", roas: 4.7, spend: "$41k", ctr: "3.5%", cpm: "$11.50" },
    score: 89,
    saturation: "medium",
    url: "https://example.com/heated-blanket",
    hook: "I haven't paid for heat in 3 winters because of this.",
    whyItWorks: "Utility + savings angle. Seasonal but evergreen. High AOV. Gift category."
  },
  {
    id: "w8",
    title: "Countertop Ice Maker",
    niche: "Home & Kitchen",
    platform: "TikTok",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "9.2M", likes: "640k", roas: 3.8, spend: "$19k", ctr: "5.7%", cpm: "$6.80" },
    score: 87,
    saturation: "medium",
    url: "https://example.com/ice-maker",
    hook: "POV: You never run out of ice again.",
    whyItWorks: "Satisfying demo content. Strong summertime peak. Impulse buy price point."
  },
  // ── Fitness ────────────────────────────────────────────────────────────────
  {
    id: "w9",
    title: "Adjustable Resistance Bands Set",
    niche: "Fitness",
    platform: "TikTok",
    format: "Talking Head",
    thumbnail: "https://images.unsplash.com/photo-1598289431512-b97b0917afed?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "6.8M", likes: "520k", roas: 5.5, spend: "$9k", ctr: "5.2%", cpm: "$5.40" },
    score: 93,
    saturation: "low",
    url: "https://example.com/resistance-bands",
    hook: "I replaced my $200/month gym membership with this $45 kit.",
    whyItWorks: "Savings + convenience. Workout-from-home evergreen. Easy demo. Strong January spike."
  },
  {
    id: "w10",
    title: "Jump Rope Counter Pro",
    niche: "Fitness",
    platform: "Instagram",
    format: "UGC",
    thumbnail: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "3.3M", likes: "280k", roas: 4.9, spend: "$7k", ctr: "4.6%", cpm: "$7.10" },
    score: 88,
    saturation: "low",
    url: "https://example.com/jump-rope",
    hook: "2000 jumps in 10 minutes. I tracked every one.",
    whyItWorks: "Gamification angle. Challenge culture. Strong athletic community share rate."
  },
  // ── Fashion & Apparel ─────────────────────────────────────────────────────
  {
    id: "w11",
    title: "Orthopedic Cloud Slides",
    niche: "Apparel & Footwear",
    platform: "TikTok",
    format: "UGC",
    thumbnail: "https://images.unsplash.com/photo-1603191659812-ee978eeeef76?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "5.1M", likes: "420k", roas: 3.8, spend: "$45k", ctr: "4.1%", cpm: "$10.20" },
    score: 88,
    saturation: "medium",
    url: "https://example.com/slides",
    hook: "I wore these for 12 hours straight. My feet want to say something.",
    whyItWorks: "Comfort + lifestyle angle. Strong gifting. Wide demo appeal. TikTok made me buy it."
  },
  {
    id: "w12",
    title: "Seamless Shapewear Shorts",
    niche: "Apparel & Footwear",
    platform: "Instagram",
    format: "Static Image",
    thumbnail: "https://images.unsplash.com/photo-1594938298603-c8148c4b4e9e?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "7.2M", likes: "560k", roas: 4.3, spend: "$38k", ctr: "3.9%", cpm: "$11.80" },
    score: 86,
    saturation: "medium",
    url: "https://example.com/shapewear",
    hook: "I wore this under everything for 30 days. Here's what happened.",
    whyItWorks: "Before/after potential. High LTV customer. Strong UGC loop. Influencer-friendly."
  },
  // ── Tech & Gadgets ────────────────────────────────────────────────────────
  {
    id: "w13",
    title: "Magnetic Wireless Charger 3-in-1",
    niche: "Tech & Gadgets",
    platform: "Facebook",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "4.8M", likes: "195k", roas: 3.4, spend: "$55k", ctr: "2.8%", cpm: "$13.50" },
    score: 80,
    saturation: "high",
    url: "https://example.com/charger",
    hook: "One cable. Three devices. No more desk chaos.",
    whyItWorks: "Clean desk aesthetic = aspirational. Apple ecosystem buyers = high LTV. Gift purchase."
  },
  {
    id: "w14",
    title: "Smart UV Water Bottle",
    niche: "Tech & Gadgets",
    platform: "TikTok",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "11.3M", likes: "830k", roas: 4.6, spend: "$14k", ctr: "5.4%", cpm: "$6.20" },
    score: 91,
    saturation: "low",
    url: "https://example.com/uv-bottle",
    hook: "This bottle kills 99.9% of bacteria in 60 seconds. I tested it.",
    whyItWorks: "Health + tech crossover. High perceived value. Travel/outdoors demo. Strong gifting."
  },
  // ── Decor & Lifestyle ─────────────────────────────────────────────────────
  {
    id: "w15",
    title: "GlowTube Kinetic Lamp",
    niche: "Decor & Lifestyle",
    platform: "TikTok",
    format: "Demo",
    thumbnail: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "8.4M", likes: "1.2M", roas: 2.9, spend: "$150k", ctr: "3.1%", cpm: "$16.20" },
    score: 74,
    saturation: "high",
    url: "https://example.com/lamp",
    hook: "I don't know why I bought this but I can't stop watching it.",
    whyItWorks: "Pure impulse. ASMR/satisfying category. But high saturation — margins compressed."
  },
  {
    id: "w16",
    title: "Himalayan Salt Diffuser Lamp",
    niche: "Decor & Lifestyle",
    platform: "Facebook",
    format: "Slideshow",
    thumbnail: "https://images.unsplash.com/photo-1588186526941-07d2a17083c7?auto=format&fit=crop&q=80&w=400",
    metrics: { views: "2.9M", likes: "140k", roas: 3.6, spend: "$18k", ctr: "3.4%", cpm: "$12.80" },
    score: 79,
    saturation: "medium",
    url: "https://example.com/salt-lamp",
    hook: "This $49 lamp changed the vibe of my entire apartment.",
    whyItWorks: "Wellness + decor crossover. FB 35-55 demo perfect. Holiday gift purchase."
  },
];

export async function GET(_req: NextRequest) {
  return NextResponse.json({ ok: true, winners: MOCK_WINNERS });
}
