/**
 * 🚀 FUTURE THEME 2060
 * Ultra-modern design system with glassmorphism, bold gradients, and simple interactions
 * So intuitive a 5-year-old could use it
 */

export const FUTURE_THEME = {
  // ═══ GRADIENTS ═══
  gradients: {
    primary: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500",
    success: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500",
    warning: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
    info: "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500",
    neutral: "bg-gradient-to-br from-slate-600 via-gray-700 to-zinc-800",

    // Special effects
    aurora: "bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20",
    shimmer: "bg-gradient-to-r from-transparent via-white/10 to-transparent",
    glow: "shadow-[0_0_60px_rgba(168,85,247,0.4)]",
  },

  // ═══ GLASS EFFECTS ═══
  glass: {
    light: "bg-white/10 backdrop-blur-2xl border border-white/20",
    medium: "bg-white/5 backdrop-blur-3xl border border-white/10",
    dark: "bg-black/20 backdrop-blur-3xl border border-white/5",
    frosted: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border border-white/10",
  },

  // ═══ ANIMATIONS ═══
  animations: {
    float: "animate-[float_6s_ease-in-out_infinite]",
    pulse: "animate-[pulse_3s_ease-in-out_infinite]",
    glow: "animate-[glow_2s_ease-in-out_infinite]",
    slide: "transition-all duration-500 ease-out",
    bounce: "transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
  },

  // ═══ SHADOWS ═══
  shadows: {
    soft: "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
    medium: "shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
    hard: "shadow-[0_30px_90px_rgba(0,0,0,0.5)]",
    glow: "shadow-[0_0_40px_rgba(168,85,247,0.5)]",
    colored: "shadow-[0_20px_60px_rgba(168,85,247,0.3)]",
  },

  // ═══ TYPOGRAPHY ═══
  text: {
    hero: "text-6xl md:text-8xl font-black tracking-tighter",
    title: "text-4xl md:text-6xl font-black tracking-tight",
    subtitle: "text-2xl md:text-4xl font-bold tracking-tight",
    body: "text-base md:text-lg font-medium",
    small: "text-sm font-medium",
    tiny: "text-xs font-bold uppercase tracking-widest",
  },

  // ═══ SPACING ═══
  spacing: {
    tight: "space-y-2",
    normal: "space-y-4",
    relaxed: "space-y-6",
    loose: "space-y-8",
    mega: "space-y-12",
  },

  // ═══ BORDERS ═══
  borders: {
    thin: "border border-white/10",
    medium: "border-2 border-white/20",
    thick: "border-4 border-white/30",
    glow: "border-2 border-violet-500/50",
    rainbow: "border-2 border-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-border",
  },

  // ═══ BUTTONS ═══
  buttons: {
    primary: "px-8 py-4 rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-lg shadow-[0_10px_40px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300",
    secondary: "px-8 py-4 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300",
    success: "px-8 py-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_60px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300",
    danger: "px-8 py-4 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-black text-lg shadow-[0_10px_40px_rgba(239,68,68,0.4)] hover:shadow-[0_15px_60px_rgba(239,68,68,0.6)] hover:scale-105 transition-all duration-300",
    ghost: "px-8 py-4 rounded-3xl text-white/70 font-bold text-lg hover:text-white hover:bg-white/5 transition-all duration-300",

    // Icon-only variants
    fab: "w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_10px_40px_rgba(168,85,247,0.5)] hover:shadow-[0_15px_60px_rgba(168,85,247,0.7)] hover:scale-110 transition-all duration-300",
    icon: "w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-300",
  },

  // ═══ CARDS ═══
  cards: {
    glass: "rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-white/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)] transition-all duration-500",
    solid: "rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:border-white/10 transition-all duration-500",
    glow: "rounded-[32px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-3xl border-2 border-violet-500/30 p-8 shadow-[0_20px_60px_rgba(168,85,247,0.3)] hover:shadow-[0_30px_80px_rgba(168,85,247,0.5)] transition-all duration-500",
    mega: "rounded-[48px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl border-2 border-white/20 p-12 shadow-[0_30px_90px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-500",
  },

  // ═══ INPUTS ═══
  inputs: {
    default: "w-full px-6 py-4 rounded-3xl bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white text-lg placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/10 focus:outline-none transition-all duration-300",
    large: "w-full px-8 py-6 rounded-[32px] bg-white/5 backdrop-blur-xl border-2 border-white/10 text-white text-2xl font-bold placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/10 focus:outline-none transition-all duration-300",
    search: "w-full px-6 py-4 pl-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/40 focus:border-violet-500/50 focus:bg-white/15 focus:outline-none transition-all duration-300",
  },

  // ═══ BADGES ═══
  badges: {
    primary: "px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-black shadow-[0_4px_20px_rgba(168,85,247,0.4)]",
    success: "px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black shadow-[0_4px_20px_rgba(16,185,129,0.4)]",
    warning: "px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow-[0_4px_20px_rgba(245,158,11,0.4)]",
    danger: "px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-black shadow-[0_4px_20px_rgba(239,68,68,0.4)]",
    ghost: "px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-bold",
    mega: "px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-lg font-black shadow-[0_8px_30px_rgba(168,85,247,0.5)]",
  },

  // ═══ EMOJIS FOR NAVIGATION ═══
  emoji: {
    home: "🏠",
    leads: "🎯",
    clients: "👥",
    revenue: "💰",
    calendar: "📅",
    email: "✉️",
    analytics: "📊",
    settings: "⚙️",
    ai: "🤖",
    campaigns: "🚀",
    social: "📱",
    tools: "🛠️",
    success: "✨",
    fire: "🔥",
    rocket: "🚀",
    chart: "📈",
    money: "💸",
    star: "⭐",
    sparkles: "✨",
    zap: "⚡",
  },
};

// ═══ CUSTOM ANIMATIONS (add to tailwind.config.js) ═══
export const CUSTOM_ANIMATIONS = {
  keyframes: {
    float: {
      "0%, 100%": { transform: "translateY(0px)" },
      "50%": { transform: "translateY(-20px)" },
    },
    glow: {
      "0%, 100%": { opacity: "1", filter: "blur(0px)" },
      "50%": { opacity: "0.8", filter: "blur(4px)" },
    },
    shimmer: {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(100%)" },
    },
  },
  animation: {
    float: "float 6s ease-in-out infinite",
    glow: "glow 2s ease-in-out infinite",
    shimmer: "shimmer 2s ease-in-out infinite",
  },
};
