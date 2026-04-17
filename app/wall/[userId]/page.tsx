"use client";

import { useState, useEffect, use } from "react";
import { Star, Loader2, Quote } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  stars: number;
  result: string;
};

export default function TestimonialWallPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/testimonials/approved?userId=${userId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; testimonials?: Testimonial[] }>)
      .then((data) => { if (data.ok && data.testimonials) setTestimonials(data.testimonials); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white mb-2">What People Are Saying</h1>
          <p className="text-sm text-white/40">Real results from real customers</p>
        </div>

        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-white/25">No testimonials yet.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {testimonials.map((t) => (
              <div key={t.id} className="break-inside-avoid rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < t.stars ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="w-6 h-6 text-white/5 absolute -top-1 -left-1" />
                  <p className="text-sm text-white/70 leading-relaxed pl-4">{t.quote}</p>
                </div>

                {/* Result badge */}
                {t.result && (
                  <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400">{t.result}</span>
                  </div>
                )}

                {/* Author */}
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-bold text-white">{t.name}</p>
                  {(t.role || t.company) && (
                    <p className="text-[10px] text-white/30">{[t.role, t.company].filter(Boolean).join(" at ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-[10px] text-white/10">Powered by Himalaya</p>
        </div>
      </div>
    </div>
  );
}
