"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check, Play, Pause, HelpCircle, Sparkles, Target, Zap } from "lucide-react";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  elementSelector?: string; // CSS selector to highlight
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
  videoUrl?: string;
  ctaText?: string;
  ctaHref?: string;
};

type Tutorial = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  steps: TutorialStep[];
};

const TUTORIALS: Tutorial[] = [
  {
    id: "get-started",
    title: "Get Started in 5 Minutes",
    description: "Learn the basics of the platform and create your first business",
    icon: Target,
    estimatedTime: "5 min",
    difficulty: "beginner",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Your Business OS",
        description: "This platform helps you build complete businesses with AI. We'll generate websites, ad campaigns, email flows, and more.",
        position: "bottom",
      },
      {
        id: "navigation",
        title: "Simple Navigation",
        description: "Everything is organized into 4 main sections: Build (create new projects), Market (ads & campaigns), Connect (email & CRM), and Grow (analytics & tools).",
        elementSelector: "header nav",
        position: "bottom",
      },
      {
        id: "himalaya",
        title: "Himalaya: AI Business Builder",
        description: "Click 'Build' to describe your business idea. We'll create everything you need in 60 seconds.",
        elementSelector: "a[href='/himalaya']",
        position: "bottom",
        ctaText: "Try Himalaya",
        ctaHref: "/himalaya",
      },
      {
        id: "campaigns",
        title: "Launch Ad Campaigns",
        description: "Go to 'Market' to create professional ad campaigns with our proven frameworks (2.9x - 4.8x better results).",
        elementSelector: "a[href='/campaigns']",
        position: "bottom",
      },
      {
        id: "emails",
        title: "Automated Email Flows",
        description: "In 'Connect', set up email flows that automatically nurture leads and drive sales.",
        elementSelector: "a[href='/emails']",
        position: "bottom",
      },
      {
        id: "done",
        title: "You're Ready!",
        description: "That's it! You now know the basics. Start with Himalaya to build your first business, or explore the other sections. Need help? Click the '?' button anytime.",
        position: "bottom",
      },
    ],
  },
  {
    id: "create-campaign",
    title: "Create Your First Ad Campaign",
    description: "Launch professional ad campaigns with proven frameworks",
    icon: Zap,
    estimatedTime: "8 min",
    difficulty: "beginner",
    steps: [
      {
        id: "goto-campaigns",
        title: "Go to Campaigns",
        description: "Click on 'Market' in the navigation to access the campaigns section.",
        elementSelector: "a[href='/campaigns']",
        position: "bottom",
        ctaText: "Open Campaigns",
        ctaHref: "/campaigns",
      },
      {
        id: "new-campaign",
        title: "Create New Campaign",
        description: "Click the 'New Campaign' button to start creating your ad campaign.",
        position: "bottom",
      },
      {
        id: "choose-framework",
        title: "Choose a Framework",
        description: "Select from 16 proven ad frameworks. For beginners, we recommend 'Pain Agitation' (4.3x CTR) for Meta ads or 'Pattern Interrupt' (4.8x CTR) for TikTok.",
        position: "bottom",
      },
      {
        id: "generate-creative",
        title: "Generate Creatives",
        description: "Enter your product details, and we'll generate professional ad creatives using the framework you chose.",
        position: "bottom",
      },
      {
        id: "launch",
        title: "Launch Your Campaign",
        description: "Review your ads, set your budget, and launch! The platform will track performance automatically.",
        position: "bottom",
      },
    ],
  },
  {
    id: "email-automation",
    title: "Set Up Email Automation",
    description: "Create automated email flows that convert leads into customers",
    icon: Sparkles,
    estimatedTime: "10 min",
    difficulty: "intermediate",
    steps: [
      {
        id: "goto-emails",
        title: "Open Email Section",
        description: "Click on 'Connect' to access email automation tools.",
        elementSelector: "a[href='/emails']",
        position: "bottom",
        ctaText: "Open Emails",
        ctaHref: "/emails",
      },
      {
        id: "create-flow",
        title: "Create Email Flow",
        description: "Click 'New Flow' and choose a trigger (signup, abandoned cart, purchase, etc.).",
        position: "bottom",
      },
      {
        id: "choose-template",
        title: "Choose Template",
        description: "Select from pre-built templates or start from scratch. Templates are proven to convert.",
        position: "bottom",
      },
      {
        id: "customize",
        title: "Customize Emails",
        description: "Edit the email content, timing, and personalization. Use merge tags like {{firstName}} for dynamic content.",
        position: "bottom",
      },
      {
        id: "activate",
        title: "Activate Flow",
        description: "Turn on the flow to start automatically sending emails based on your trigger.",
        position: "bottom",
      },
    ],
  },
];

export default function TutorialSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [showHelpButton, setShowHelpButton] = useState(true);

  // Check localStorage for completed tutorials
  useEffect(() => {
    const completed = localStorage.getItem("tutorial-completed");
    if (completed) {
      setCompletedTutorials(JSON.parse(completed));
    }

    // Check if user has seen tutorials before
    const hasSeenTutorials = localStorage.getItem("tutorial-seen");
    if (!hasSeenTutorials) {
      // Auto-open tutorial system for first-time users
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("tutorial-seen", "true");
      }, 1000); // Delay 1 second so user can see the page first
    }

    // Listen for tutorial open event
    const handleOpenTutorial = () => setIsOpen(true);
    window.addEventListener("open-tutorial", handleOpenTutorial);
    return () => window.removeEventListener("open-tutorial", handleOpenTutorial);
  }, []);

  // Highlight element when step changes
  useEffect(() => {
    if (!currentTutorial) return;
    const step = currentTutorial.steps[currentStep];
    if (!step?.elementSelector) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(step.elementSelector) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTutorial, currentStep]);

  const startTutorial = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (!currentTutorial) return;
    if (currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (!currentTutorial) return;
    const newCompleted = [...completedTutorials, currentTutorial.id];
    setCompletedTutorials(newCompleted);
    localStorage.setItem("tutorial-completed", JSON.stringify(newCompleted));
    setCurrentTutorial(null);
    setCurrentStep(0);
    setHighlightedElement(null);
  };

  const skipTutorial = () => {
    setCurrentTutorial(null);
    setCurrentStep(0);
    setHighlightedElement(null);
  };

  if (!showHelpButton && !isOpen) return null;

  return (
    <>
      {/* Floating Help Button */}
      {showHelpButton && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#f5a623] to-[#e07850] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          title="Tutorial & Help"
        >
          <HelpCircle className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Highlight Overlay */}
      {highlightedElement && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            className="absolute pointer-events-auto"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
              border: "3px solid #f5a623",
              borderRadius: "12px",
              boxShadow: "0 0 0 4px rgba(245, 166, 35, 0.2), 0 0 40px rgba(245, 166, 35, 0.4)",
              animation: "pulse 2s infinite",
            }}
          />
        </div>
      )}

      {/* Tutorial Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c0a08] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-[#f5a623] via-[#e07850] to-[#f5a623] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-1">
                  {currentTutorial ? currentTutorial.title : "Tutorial Center"}
                </h2>
                <p className="text-sm text-white/80">
                  {currentTutorial
                    ? `Step ${currentStep + 1} of ${currentTutorial.steps.length}`
                    : "Learn how to use the platform"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  skipTutorial();
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!currentTutorial ? (
                // Tutorial List
                <div className="space-y-4">
                  <p className="text-sm text-white/60 mb-6">
                    Choose a tutorial to get started. We'll guide you step-by-step.
                  </p>

                  {TUTORIALS.map((tutorial) => {
                    const Icon = tutorial.icon;
                    const isCompleted = completedTutorials.includes(tutorial.id);

                    return (
                      <button
                        key={tutorial.id}
                        onClick={() => startTutorial(tutorial)}
                        className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#f5a623]/50 transition text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-[#f5a623]/10 text-[#f5a623]"
                          }`}>
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white">{tutorial.title}</h3>
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  COMPLETED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/50 mb-2">{tutorial.description}</p>
                            <div className="flex items-center gap-3 text-xs text-white/30">
                              <span>{tutorial.estimatedTime}</span>
                              <span>•</span>
                              <span className="capitalize">{tutorial.difficulty}</span>
                              <span>•</span>
                              <span>{tutorial.steps.length} steps</span>
                            </div>
                          </div>

                          <Play className="w-5 h-5 text-white/20 group-hover:text-[#f5a623] transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Active Tutorial Step
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {currentTutorial.steps[currentStep].title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {currentTutorial.steps[currentStep].description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#f5a623] to-[#e07850] transition-all duration-300"
                        style={{
                          width: `${((currentStep + 1) / currentTutorial.steps.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-white/40">
                      <span>Step {currentStep + 1} of {currentTutorial.steps.length}</span>
                      <span>{Math.round(((currentStep + 1) / currentTutorial.steps.length) * 100)}% complete</span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={skipTutorial}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white/40 hover:text-white/70 transition"
                    >
                      Skip Tutorial
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="px-4 py-2 rounded-lg border border-white/10 text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {currentTutorial.steps[currentStep].ctaHref ? (
                        <a
                          href={currentTutorial.steps[currentStep].ctaHref}
                          onClick={() => nextStep()}
                          className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-white hover:shadow-lg hover:shadow-[#f5a623]/20 transition"
                        >
                          {currentTutorial.steps[currentStep].ctaText || "Next"}
                        </a>
                      ) : (
                        <button
                          onClick={nextStep}
                          className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-white hover:shadow-lg hover:shadow-[#f5a623]/20 transition"
                        >
                          {currentStep === currentTutorial.steps.length - 1 ? (
                            <>
                              <Check className="w-4 h-4 inline mr-1" />
                              Finish
                            </>
                          ) : (
                            <>
                              Next
                              <ChevronRight className="w-4 h-4 inline ml-1" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(245, 166, 35, 0.2), 0 0 40px rgba(245, 166, 35, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(245, 166, 35, 0.3), 0 0 60px rgba(245, 166, 35, 0.6);
          }
        }
      `}</style>
    </>
  );
}
