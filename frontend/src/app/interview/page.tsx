"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { InterviewSession, InterviewQuestion, InterviewAnswer } from "@/types/api";
import {
  MessagesSquare,
  Sparkles,
  CheckCircle2,
  SkipForward,
  Send,
  RefreshCw,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AIInterviewPage() {
  const { selectedCompany } = useCompany();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  useEffect(() => {
    if (!selectedCompany) return;
    loadSession();
  }, [selectedCompany]);

  async function loadSession(restart = false) {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const s = await api.startInterview(selectedCompany.id, restart);
      setSession(s);
      setAnswerText("");
    } catch (err) {
      console.error("Failed to load interview session:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswerSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!session || !answerText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const updated = await api.submitAnswer(session.id, answerText.trim());
      setSession(updated);
      setAnswerText("");
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSkip() {
    if (!session || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const updated = await api.skipQuestion(session.id, "Skipped by founder");
      setSession(updated);
      setAnswerText("");
    } catch (err: any) {
      alert(`Skip error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnswerSubmit();
    }
  };

  if (!selectedCompany) return null;

  const currentQ = session?.current_question || (session?.questions && session.questions[session.questions.length - 1]);
  const currentStep = session?.current_question_number || 1;
  const progressPercent = session ? Math.min(100, Math.round(((currentStep - 1) / 10) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adaptive Strategic Calibration</h1>
            <Badge variant="info" className="text-[11px] font-mono font-semibold">
              10-Question Session
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic founder interview to calibrate Signal Stack ranking weights, priority vectors, and executive filters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSession(true)}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Restart Interview
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </Card>
      ) : session?.status === "COMPLETED" ? (
        /* Completed Interview Screen */
        <Card className="p-8 space-y-6 border-emerald-200/80 bg-emerald-50/20 shadow-card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Strategic Calibration Complete</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All 10 questions have established your custom intelligence profile. The ranking engine and Monday Morning Brief will prioritize these calibrated vectors.
              </p>
            </div>
          </div>

          {/* Calibrated Weights Vector */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Synthesized Strategic Priority Weights
              </span>
              <span className="text-[11px] font-mono text-slate-400">Scale 0.00 – 1.00</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(session.strategic_priorities || {}).map(([key, val]) => {
                const numericVal = typeof val === "number" ? val : parseFloat(String(val)) || 0.5;
                const percent = Math.min(100, Math.round(numericVal * 100));

                return (
                  <div key={key} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold text-[11px] uppercase tracking-wide truncate max-w-[130px]">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {numericVal.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={() => loadSession(true)}>
              Recalibrate Interview
            </Button>
            <Button size="sm" variant="brand" onClick={() => (window.location.href = "/briefs")}>
              Generate Monday Morning Brief
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      ) : (
        /* Active Interview Question Screen */
        <div className="space-y-6">
          {/* Progress Bar & Step Dots */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                Question {currentStep} of 10
              </span>
              <span className="font-mono text-slate-500 font-semibold">{progressPercent}% Calibrated</span>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;

                return (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-blue-600"
                        : "bg-slate-200"
                    }`}
                    title={`Question ${stepNum}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Active Question Terminal */}
          <Card className="p-6 md:p-8 border-slate-200/90 shadow-card">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Badge variant="info" className="text-[11px] font-semibold uppercase tracking-wide">
                  {currentQ?.category || "Strategic Moat"}
                </Badge>
                <span className="text-xs font-mono text-slate-400">Step {currentStep}/10</span>
              </div>

              <div className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
                  {currentQ?.question_text || "Formulating adaptive question..."}
                </h2>
                {currentQ?.rationale && (
                  <p className="text-xs text-slate-600 italic bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                    <span className="font-semibold text-slate-800 not-italic font-sans">Strategic Context: </span>
                    {currentQ.rationale}
                  </p>
                )}
              </div>

              {/* Founder Response Form */}
              <form onSubmit={handleAnswerSubmit} className="pt-2 space-y-3">
                <div className="space-y-1">
                  <textarea
                    rows={4}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your strategic perspective, metrics, or internal decisions here..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3.5 text-xs rounded-xl border border-slate-300/80 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-slate-50 text-slate-900 resize-none shadow-subtle leading-relaxed font-sans transition-all"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Press <kbd className="px-1 py-0.5 text-[10px] bg-slate-100 border border-slate-300 rounded font-mono text-slate-600">Ctrl</kbd> + <kbd className="px-1 py-0.5 text-[10px] bg-slate-100 border border-slate-300 rounded font-mono text-slate-600">Enter</kbd> to submit</span>
                    <span>{answerText.length} characters</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-800 text-xs"
                  >
                    <SkipForward className="w-3.5 h-3.5 mr-1" />
                    Skip Confidential Question
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    variant="brand"
                    disabled={!answerText.trim() || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Submit & Adapt Next
                    <Send className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Previous Questions & Answers Accordion */}
          {session?.answers && session.answers.length > 0 && (
            <Card className="p-4 shadow-subtle">
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span>Prior Calibration History ({session.answers.length} answered)</span>
                {isHistoryExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isHistoryExpanded && (
                <div className="mt-3 divide-y divide-slate-100 text-xs pt-1">
                  {session.answers.map((ans, idx) => {
                    const qObj = session.questions.find((q) => q.id === ans.question_id);
                    return (
                      <div key={ans.id} className="py-3 space-y-1.5">
                        <div className="font-semibold text-slate-900">
                          Q{idx + 1}: {qObj ? qObj.question_text : `Question #${idx + 1}`}
                        </div>
                        <div className="text-slate-700 bg-slate-50/80 p-2.5 rounded-lg text-xs leading-relaxed border border-slate-200/50">
                          {ans.answer_text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
