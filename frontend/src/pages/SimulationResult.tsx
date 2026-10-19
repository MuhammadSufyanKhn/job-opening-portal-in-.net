import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { workSimApi } from '../services/api';
import type { AssessmentResult } from '../types/worksim';

export const SimulationResult: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadResults(sessionId);
    }
  }, [sessionId]);

  const loadResults = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workSimApi.getSessionResult(id);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Assessment result is not yet available or failed to load.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Evaluating skills challenge results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Results Pending</h2>
          <p className="text-sm text-slate-600">{error || 'Scoring is in progress.'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => sessionId && loadResults(sessionId)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200"
            >
              Refresh
            </button>
            <Link
              to="/candidate/simulations"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm"
            >
              Back to Simulations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round((result.totalScore / 100) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/candidate/simulations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Simulations
          </Link>
          <span className="text-xs text-slate-400">
            Evaluated on {new Date(result.evaluatedAtUtc).toLocaleString()}
          </span>
        </div>

        {/* Hero Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white border border-amber-200 p-8 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-50/60 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulation Completed & Validated
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {result.scenarioTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {result.evaluationSummary}
              </p>
            </div>

            {/* Score Ring / Box */}
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-6 text-center shrink-0 min-w-[160px] shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Overall Score
              </span>
              <div className="text-4xl font-extrabold text-amber-600">
                {result.totalScore.toFixed(1)}
                <span className="text-lg font-semibold text-slate-400"> / 100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, scorePercentage))}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ethical Decision-Support Notice */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4.5 flex items-start gap-3.5 text-xs text-slate-600 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">HireSphere Decision-Support Policy</p>
            <p>
              Skills challenges evaluate job-specific problem-solving through practical scenarios. These scores help hiring teams understand your abilities, and a real person always makes the hiring decision.
            </p>
          </div>
        </div>

        {/* Criterion Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Criterion-Level Evaluation Breakdown
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {result.criterionScores.map((criterion, idx) => {
              const criterionPct = criterion.maxScore > 0 ? (criterion.score / criterion.maxScore) * 100 : 0;
              const isHigh = criterionPct >= 80;
              const isMedium = criterionPct >= 50 && criterionPct < 80;

              return (
                <motion.div
                  key={criterion.criterionName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm hover:border-amber-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {criterion.criterionName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {criterion.feedback}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-base font-extrabold ${
                          isHigh ? 'text-emerald-600' : isMedium ? 'text-amber-600' : 'text-slate-700'
                        }`}>
                          {criterion.score.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium"> / {criterion.maxScore.toFixed(1)} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, criterionPct))}%` }}
                    />
                  </div>

                  {/* Supporting Evidence from Candidate Actions */}
                  {criterion.supportingEvidence && criterion.supportingEvidence.length > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-amber-500" />
                        Recorded Evidence & Candidate Rationales
                      </span>
                      <ul className="space-y-1.5 text-slate-700">
                        {criterion.supportingEvidence.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 flex justify-between items-center text-xs text-slate-400 border-t border-slate-200">
          <span>Simulation Session ID: {result.sessionId}</span>
          <Link
            to="/candidate/simulations"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors shadow-sm"
          >
            Back to All Simulations
          </Link>
        </div>

      </div>
    </div>
  );
};
