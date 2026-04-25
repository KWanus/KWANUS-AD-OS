"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { FUTURE_THEME as FT } from "@/lib/theme/futureTheme";

/**
 * 🎯 CONVERSATIONAL WIZARD
 * Step-by-step wizard so simple a 5-year-old could use it
 * Chat-like interface with emojis and big buttons
 */

interface Step {
  id: string;
  emoji: string;
  question: string;
  subtitle?: string;
  type: "text" | "choice" | "multiChoice";
  choices?: Array<{ emoji: string; label: string; value: string }>;
  placeholder?: string;
}

interface WizardProps {
  title: string;
  steps: Step[];
  onComplete: (data: Record<string, string | string[]>) => Promise<void>;
  onCancel?: () => void;
}

export default function ConversationalWizard({ title, steps, onComplete, onCancel }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  // ═══ HANDLE TEXT ANSWER ═══
  async function handleTextAnswer() {
    if (!textInput.trim()) return;

    const newAnswers = { ...answers, [step.id]: textInput };
    setAnswers(newAnswers);
    setTextInput("");

    if (isLastStep) {
      await finishWizard(newAnswers);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  // ═══ HANDLE CHOICE ANSWER ═══
  async function handleChoice(value: string) {
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isLastStep) {
      await finishWizard(newAnswers);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  // ═══ HANDLE MULTI-CHOICE ANSWER ═══
  function toggleMultiChoice(value: string) {
    const current = (answers[step.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [step.id]: updated });
  }

  async function handleMultiChoiceNext() {
    const selected = answers[step.id] as string[];
    if (!selected || selected.length === 0) return;

    if (isLastStep) {
      await finishWizard(answers);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  // ═══ FINISH WIZARD ═══
  async function finishWizard(finalAnswers: Record<string, string | string[]>) {
    setLoading(true);
    await onComplete(finalAnswers);
    setLoading(false);
    setCompleted(true);
  }

  // ═══ GO BACK ═══
  function goBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTextInput("");
    }
  }

  // ═══ COMPLETION STATE ═══
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-fuchsia-950/20 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_20px_80px_rgba(16,185,129,0.6)] animate-bounce">
            <Check className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-6xl font-black text-white mb-4">All Done! ✨</h2>
          <p className="text-2xl text-white/60 font-medium">We're working on it right now</p>
        </div>
      </div>
    );
  }

  // ═══ WIZARD UI ═══
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-fuchsia-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* ═══ HEADER ═══ */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-bold text-white/80">{title}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-white/50 font-bold">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* ═══ CHAT BUBBLES (Previous Steps) ═══ */}
        <div className="space-y-6 mb-12">
          {steps.slice(0, currentStep).map((s, i) => (
            <div key={s.id} className="space-y-3">
              {/* Question Bubble (Left) */}
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{s.emoji}</div>
                <div className="flex-1 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <p className="text-lg font-bold text-white">{s.question}</p>
                </div>
              </div>

              {/* Answer Bubble (Right) */}
              <div className="flex justify-end">
                <div className="rounded-[32px] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 backdrop-blur-xl border-2 border-violet-500/30 p-6 max-w-md">
                  <p className="text-lg font-bold text-white">
                    {Array.isArray(answers[s.id])
                      ? (answers[s.id] as string[]).join(", ")
                      : answers[s.id]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ CURRENT QUESTION ═══ */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="text-6xl animate-float">{step.emoji}</div>
            <div>
              <h2 className="text-4xl font-black text-white mb-3">{step.question}</h2>
              {step.subtitle && (
                <p className="text-xl text-white/60 font-medium">{step.subtitle}</p>
              )}
            </div>
          </div>

          {/* ═══ TEXT INPUT ═══ */}
          {step.type === "text" && (
            <div className="space-y-4">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleTextAnswer()}
                placeholder={step.placeholder || "Type your answer..."}
                className={FT.inputs.large}
                autoFocus
              />
              <button
                onClick={() => void handleTextAnswer()}
                disabled={!textInput.trim()}
                className={`${FT.buttons.primary} w-full disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span className="flex items-center justify-center gap-3">
                  {isLastStep ? "Finish" : "Next"}
                  <ArrowRight className="w-6 h-6" />
                </span>
              </button>
            </div>
          )}

          {/* ═══ SINGLE CHOICE ═══ */}
          {step.type === "choice" && step.choices && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {step.choices.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => void handleChoice(choice.value)}
                  className="group relative rounded-[32px] bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-violet-500/50 p-8 transition-all duration-300 hover:scale-105 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {choice.emoji}
                    </div>
                    <p className="text-2xl font-black text-white">{choice.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ═══ MULTI CHOICE ═══ */}
          {step.type === "multiChoice" && step.choices && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {step.choices.map((choice) => {
                  const isSelected = ((answers[step.id] as string[]) || []).includes(choice.value);
                  return (
                    <button
                      key={choice.value}
                      onClick={() => toggleMultiChoice(choice.value)}
                      className={`group relative rounded-[32px] backdrop-blur-xl border-2 p-8 transition-all duration-300 hover:scale-105 text-left ${
                        isSelected
                          ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-500/50"
                          : "bg-white/5 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                            {choice.emoji}
                          </div>
                          <p className="text-2xl font-black text-white">{choice.label}</p>
                        </div>
                        {isSelected && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => void handleMultiChoiceNext()}
                disabled={!answers[step.id] || (answers[step.id] as string[]).length === 0}
                className={`${FT.buttons.primary} w-full disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span className="flex items-center justify-center gap-3">
                  {isLastStep ? "Finish" : "Next"}
                  <ArrowRight className="w-6 h-6" />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ═══ FOOTER BUTTONS ═══ */}
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-full text-white/40 hover:text-white/60 transition-all duration-300 font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin" />
            <p className="text-2xl font-black text-white">Creating magic... ✨</p>
          </div>
        </div>
      )}
    </div>
  );
}
