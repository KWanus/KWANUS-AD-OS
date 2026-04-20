export const ANIMATION_STYLES = `
@keyframes hm-fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hm-fadeInUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hm-scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes hm-slideInLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes hm-slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes hm-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--hm-pulse-color, rgba(6,182,212,0.4)); }
  50% { box-shadow: 0 0 0 12px var(--hm-pulse-color, rgba(6,182,212,0)); }
}
@keyframes hm-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes hm-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes hm-gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes hm-countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hm-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes hm-borderRotate {
  0% { --angle: 0deg; }
  100% { --angle: 360deg; }
}
.hm-animate-in { animation: hm-fadeIn 0.6s ease-out both; }
.hm-animate-up { animation: hm-fadeInUp 0.7s ease-out both; }
.hm-animate-scale { animation: hm-scaleIn 0.5s ease-out both; }
.hm-stagger-1 { animation-delay: 0.1s; }
.hm-stagger-2 { animation-delay: 0.2s; }
.hm-stagger-3 { animation-delay: 0.3s; }
.hm-stagger-4 { animation-delay: 0.4s; }
.hm-stagger-5 { animation-delay: 0.5s; }
.hm-stagger-6 { animation-delay: 0.6s; }
.hm-hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hm-hover-lift:hover { transform: translateY(-4px); }
.hm-pulse-btn { animation: hm-pulse 2s infinite; }
.hm-shimmer-bg { animation: hm-shimmer 3s linear infinite; background-size: 200% 100%; }
.hm-float { animation: hm-float 4s ease-in-out infinite; }
.hm-gradient-text { background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
`;

export function staggerDelay(index: number, base = 0.1): string {
  return `${base * index}s`;
}

export function animationStyle(
  name: string,
  duration = "0.6s",
  delay = "0s",
  easing = "ease-out"
): React.CSSProperties {
  return {
    animation: `${name} ${duration} ${easing} ${delay} both`,
  };
}
