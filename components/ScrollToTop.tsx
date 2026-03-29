"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white/40 hover:text-white hover:bg-white/[0.15] transition-all shadow-xl backdrop-blur-sm flex items-center justify-center"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
