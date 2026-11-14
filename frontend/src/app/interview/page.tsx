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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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

  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !answerText.trim()) return;

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
    if (!session) return;
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

  if (!selectedCompany) return null;

  const currentQ = session?.current_question || (session?.questions && session.questions[session.questions.length - 1]);
  const progressPercent = session ? Math.min(100, Math.round(((session.current_question_number - 1) / 10) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adaptive Strategic Calibration</h1>
            <Badge variant="info" className="text-[11px] font-mono">
              10-Question Calibration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic founder interview to calibrate Signal Stack priority weights, threat thresholds, and Monday briefing filters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSession(true)}
          className="text-xs text-slate-600 hover:text-slate-900 border-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Restart Interview
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Initializing strategic calibration agent...</span>
        </div>
      ) : session?.status === "COMPLETED" ? (
        /* Completed Interview Screen */
        <Card className="p-8 space-y-6 border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Calibration Completed</h3>
              <p className="text-xs text-slate-600">
                10-question strategic baseline is established. The Monday Morning Brief will prioritize these weighted vectors.
              </p>
            </div>
          </div>

          {/* Calibrated Weights Vector */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              Synthesized Priority Weights Vector
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(session.strategic_priorities).map(([key, val]) => (
                <div key={key} className="p-2.5 rounded bg-slate-50 border border-slate-200/60 flex flex-col">
                  <span className="text-slate-500 font-mono text-[10px] uppercase truncate">{key.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {typeof val === "number" ? val.toFixed(2) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => loadSession(true)}>
              Recalibrate Interview
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/briefs"}>
              Generate Monday Morning Brief
            </Button>
          </div>
        </Card>
      ) : (
        /* Active Interview Question Screen */
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                Question {session?.current_question_number} of 10
              </span>
              <span className="font-mono text-slate-500">{progressPercent}% Calibrated</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              ></div>
            </div>
          </div>

          {/* Active Question Card */}
          <Card className="p-6 border-slate-300 shadow-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="info" className="text-xs font-semibold uppercase tracking-wide">
                  {currentQ?.category || "Strategic Moat"}
                </Badge>
                <span className="text-xs font-mono text-slate-400">Step {session?.current_question_number}/10</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQ?.question_text || "Formulating adaptive question..."}
                </h2>
                {currentQ?.rationale && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-md border border-slate-200/50">
                    <span className="font-semibold text-slate-700 not-italic">Strategic Rationale: </span>
                    {currentQ.rationale}
                  </p>
                )}
              </div>

              {/* Founder Response Form */}
              <form onSubmit={handleAnswerSubmit} className="pt-2 space-y-3">
                <div>
                  <textarea
                    rows={4}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your strategic perspective, metrics, or recent decision context here..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 font-normal text-slate-900 resize-none shadow-sm"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    <SkipForward className="w-3.5 h-3.5 mr-1" />
                    Skip Question
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!answerText.trim() || isSubmitting}
                    isLoading={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
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
            <Card className="p-4">
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <span>Prior Calibration History ({session.answers.length} answered)</span>
                {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isHistoryExpanded && (
                <div className="mt-3 divide-y divide-slate-100 text-xs">
                  {session.answers.map((ans, idx) => {
                    const qObj = session.questions.find((q) => q.id === ans.question_id);
                    return (
                      <div key={ans.id} className="py-2.5 space-y-1">
                        <div className="font-semibold text-slate-800">
                          Q{idx + 1}: {qObj ? qObj.question_text : `Question #${idx + 1}`}
                        </div>
                        <div className="text-slate-600 bg-slate-50 p-2 rounded text-xs font-normal border border-slate-200/40">
                          A: {ans.answer_text}
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
