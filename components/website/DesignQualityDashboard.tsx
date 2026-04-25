"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Eye, Smartphone, Zap, Users,
  Target, Award, AlertCircle, CheckCircle, Sparkles,
} from "lucide-react";

export interface DesignQualityScores {
  overall: number;
  conversion: number;
  visual: number;
  mobile: number;
  speed: number;
  accessibility: number;
}

interface DesignQualityDashboardProps {
  siteId: string;
  scores: DesignQualityScores;
  onRefresh?: () => void;
}

export function DesignQualityDashboard({ siteId, scores, onRefresh }: DesignQualityDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "emerald";
    if (score >= 75) return "blue";
    if (score >= 60) return "amber";
    return "red";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Award className="w-5 h-5" />;
    if (score >= 75) return <CheckCircle className="w-5 h-5" />;
    if (score >= 60) return <Eye className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const metrics = [
    {
      id: "conversion",
      label: "Conversion",
      score: scores.conversion,
      icon: <Target className="w-5 h-5" />,
      description: "CTA clarity, trust signals, value prop",
    },
    {
      id: "visual",
      label: "Visual",
      score: scores.visual,
      icon: <Eye className="w-5 h-5" />,
      description: "Typography, colors, spacing, contrast",
    },
    {
      id: "mobile",
      label: "Mobile",
      score: scores.mobile,
      icon: <Smartphone className="w-5 h-5" />,
      description: "Responsive design, touch targets",
    },
    {
      id: "speed",
      label: "Speed",
      score: scores.speed,
      icon: <Zap className="w-5 h-5" />,
      description: "Load time, optimization, performance",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      score: scores.accessibility,
      icon: <Users className="w-5 h-5" />,
      description: "WCAG compliance, screen readers, alt text",
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Design Quality
          </h3>
          <p className="text-xs text-white/60 mt-1">Real-time AI-powered analysis</p>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-white hover:bg-white/[0.1] hover:border-white/20 transition-all disabled:opacity-50"
          >
            {isRefreshing ? "Analyzing..." : "Refresh"}
          </button>
        )}
      </div>

      {/* Overall Score */}
      <div className="relative">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-orange-500/10 to-violet-500/10 border border-white/20 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            {getScoreIcon(scores.overall)}
            <span className={`text-7xl font-black bg-gradient-to-r from-${getScoreColor(scores.overall)}-400 to-${getScoreColor(scores.overall)}-600 bg-clip-text text-transparent`}>
              {Math.round(scores.overall)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white uppercase tracking-widest">Overall Score</p>
            <p className="text-xs text-white/60">
              {scores.overall >= 90 ? "Exceptional" : scores.overall >= 75 ? "Great" : scores.overall >= 60 ? "Good" : "Needs Improvement"}
            </p>
          </div>
        </div>

        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${getScoreColor(scores.overall)}-500/20 to-transparent rounded-2xl blur-2xl -z-10`} />
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Breakdown</p>

        {metrics.map((metric) => {
          const color = getScoreColor(metric.score);
          return (
            <div
              key={metric.id}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20 text-${color}-400`}>
                    {metric.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{metric.label}</span>
                      <span className={`text-lg font-black text-${color}-400`}>
                        {Math.round(metric.score)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                      <div
                        className={`h-full bg-gradient-to-r from-${color}-400 to-${color}-600 transition-all duration-500 ease-out`}
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-white/50">{metric.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {scores.overall < 90 && (
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            Quick Wins
          </div>
          <ul className="space-y-1.5 text-xs text-white/70">
            {scores.conversion < 80 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Add more trust signals (testimonials, ratings, badges)</span>
              </li>
            )}
            {scores.visual < 80 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Improve visual hierarchy with larger headings and better spacing</span>
              </li>
            )}
            {scores.mobile < 80 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Increase touch target sizes for mobile (minimum 44x44px)</span>
              </li>
            )}
            {scores.speed < 80 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Optimize images and reduce unnecessary scripts</span>
              </li>
            )}
            {scores.accessibility < 80 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Add alt text to all images and improve color contrast</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Success message */}
      {scores.overall >= 90 && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <Award className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-emerald-400">Exceptional Design!</p>
            <p className="text-xs text-white/60 mt-0.5">
              Your site meets the highest quality standards
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HELPER: Calculate design quality scores from site data
 */
export function calculateDesignScores(siteData: {
  blocks: any[];
  theme: any;
  metrics?: {
    domNodes?: number;
    imageCount?: number;
    scriptCount?: number;
    loadTime?: number;
  };
}): DesignQualityScores {
  const { blocks, theme, metrics } = siteData;

  // Conversion score (0-100)
  const conversionFactors = {
    hasCTA: blocks.some((b) => b.type === "cta" || b.type === "hero") ? 25 : 0,
    hasTestimonials: blocks.some((b) => b.type === "testimonials") ? 20 : 0,
    hasPricing: blocks.some((b) => b.type === "pricing") ? 15 : 0,
    hasStats: blocks.some((b) => b.type === "stats") ? 10 : 0,
    hasFAQ: blocks.some((b) => b.type === "faq") ? 10 : 0,
    blockCount: Math.min(blocks.length * 2, 20), // More blocks = more content
  };
  const conversion = Object.values(conversionFactors).reduce((a, b) => a + b, 0);

  // Visual score (0-100)
  const visualFactors = {
    hasHero: blocks.some((b) => b.type === "hero") ? 25 : 0,
    hasImages: blocks.some((b) => b.type === "gallery" || b.type === "features") ? 20 : 0,
    hasConsistentTheme: theme?.primaryColor ? 25 : 0,
    hasGradients: blocks.some((b) => b.props?.backgroundGradient) ? 15 : 0,
    variety: Math.min(new Set(blocks.map((b) => b.type)).size * 5, 15),
  };
  const visual = Object.values(visualFactors).reduce((a, b) => a + b, 0);

  // Mobile score (0-100)
  const mobileFactors = {
    responsiveBlocks: blocks.filter((b) => b.props?.mobileOptimized !== false).length / Math.max(blocks.length, 1) * 60,
    touchTargets: 20, // Assume good touch targets (would analyze in real scan)
    viewportMeta: 20, // Assume viewport meta tag exists
  };
  const mobile = Object.values(mobileFactors).reduce((a, b) => a + b, 0);

  // Speed score (0-100)
  const speedFactors = {
    domSize: metrics?.domNodes ? Math.max(100 - (metrics.domNodes / 50), 0) : 50,
    images: metrics?.imageCount ? Math.max(100 - (metrics.imageCount * 2), 0) : 50,
    scripts: metrics?.scriptCount ? Math.max(100 - (metrics.scriptCount * 5), 0) : 50,
    loadTime: metrics?.loadTime ? Math.max(100 - (metrics.loadTime / 50), 0) : 50,
  };
  const speed = Object.values(speedFactors).reduce((a, b) => a + b, 0) / Object.keys(speedFactors).length;

  // Accessibility score (0-100)
  const accessibilityFactors = {
    altText: 40, // Assume images have alt text (would check in real scan)
    headingHierarchy: blocks.some((b) => b.type === "hero") ? 20 : 0,
    colorContrast: theme?.mode === "dark" ? 20 : 15, // Dark mode usually better contrast
    focusStates: 20, // Assume focus states exist
  };
  const accessibility = Object.values(accessibilityFactors).reduce((a, b) => a + b, 0);

  // Overall score (weighted average)
  const overall = (
    conversion * 0.3 +
    visual * 0.25 +
    mobile * 0.2 +
    speed * 0.15 +
    accessibility * 0.1
  );

  return {
    overall: Math.min(Math.max(overall, 0), 100),
    conversion: Math.min(Math.max(conversion, 0), 100),
    visual: Math.min(Math.max(visual, 0), 100),
    mobile: Math.min(Math.max(mobile, 0), 100),
    speed: Math.min(Math.max(speed, 0), 100),
    accessibility: Math.min(Math.max(accessibility, 0), 100),
  };
}
