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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Evaluating deterministic scoring rubric...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Results Pending</h2>
          <p className="text-sm text-slate-300">{error || 'Scoring is in progress.'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => sessionId && loadResults(sessionId)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Refresh
            </button>
            <Link
              to="/candidate/simulations"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/candidate/simulations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Simulations
          </Link>
          <span className="text-xs text-slate-500">
            Evaluated on {new Date(result.evaluatedAtUtc).toLocaleString()}
          </span>
        </div>

        {/* Hero Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulation Completed & Validated
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {result.scenarioTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {result.evaluationSummary}
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/40 p-6 text-center shrink-0 min-w-[160px] shadow-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Overall Score
              </span>
              <div className="text-4xl font-extrabold text-white">
                {result.totalScore.toFixed(1)}
                <span className="text-lg font-semibold text-slate-500"> / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, scorePercentage))}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ethical Decision-Support Notice */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-4.5 flex items-start gap-3.5 text-xs text-slate-400">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">HireSphere Decision-Support Policy</p>
            <p>
              WorkSim assessments evaluate job-specific technical and problem-solving behaviors against transparent, predetermined rubrics. These scores serve as structured decision-support evidence for human recruitment teams and are never used as an automated rejection system.
            </p>
          </div>
        </div>

        {/* Criterion Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
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
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {criterion.criterionName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {criterion.feedback}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-base font-extrabold ${
                          isHigh ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {criterion.score.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium"> / {criterion.maxScore.toFixed(1)} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, criterionPct))}%` }}
                    />
                  </div>

                  {/* Supporting Evidence from Candidate Actions */}
                  {criterion.supportingEvidence && criterion.supportingEvidence.length > 0 && (
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        Recorded Evidence & Candidate Rationales
                      </span>
                      <ul className="space-y-1.5 text-slate-300">
                        {criterion.supportingEvidence.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                            <span className="text-indigo-400 mt-0.5">•</span>
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
        <div className="pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800">
          <span>Simulation Session ID: {result.sessionId}</span>
          <Link
            to="/candidate/simulations"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Back to All Simulations
          </Link>
        </div>

      </div>
    </div>
  );
};
