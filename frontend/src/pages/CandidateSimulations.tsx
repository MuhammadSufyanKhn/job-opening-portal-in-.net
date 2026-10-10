import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  FileText, 
  Layers, 
  ShieldCheck, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { workSimApi } from '../services/api';
import type { AssessmentAssignment, SimulationScenario } from '../types/worksim';

export const CandidateSimulations: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [catalog, setCatalog] = useState<SimulationScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentsData, catalogData] = await Promise.all([
        workSimApi.getMyAssignments().catch(() => []),
        workSimApi.getCatalog().catch(() => [])
      ]);
      setAssignments(assignmentsData);
      setCatalog(catalogData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load simulations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (assignment: AssessmentAssignment) => {
    setStartingAssignmentId(assignment.assignmentId);
    setError(null);
    try {
      if (assignment.activeSessionId && assignment.status === 'InProgress') {
        navigate(`/candidate/simulations/session/${assignment.activeSessionId}`);
        return;
      }
      const state = await workSimApi.startSession(assignment.assignmentId);
      navigate(`/candidate/simulations/session/${state.sessionId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to launch simulation. Please check deadlines or retry.');
      setStartingAssignmentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              HireSphere WorkSim™ Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Interactive Job Simulations
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Step into real-world operational challenges. Investigate synthetic telemetry, inspect code and error traces, make consequential decisions, and demonstrate your authentic problem-solving skills under realistic constraints.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Objective, Rubric-Based Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" /> Safe Synthetic Environments
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Explainable Feedback & Audit Trail
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-4 text-rose-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Assigned Simulations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Your Assigned Job Simulations
              </h2>
              <p className="text-sm text-slate-400">
                Simulations required or recommended by companies for your active job applications.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-56 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">No Pending Simulations Assigned</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                When companies review your job applications and request an interactive simulation, it will appear here with instructions and deadlines.
              </p>
              <div className="pt-2">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Explore Published Jobs <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((assignment) => {
                const isCompleted = assignment.status === 'Completed';
                const isInProgress = assignment.status === 'InProgress';
                const isExpired = assignment.status === 'Expired';

                return (
                  <motion.div
                    key={assignment.assignmentId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all p-6 shadow-xl relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {assignment.scenarioCategory}
                        </span>

                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isInProgress
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : isExpired
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isInProgress && <Clock className="w-3.5 h-3.5" />}
                          {assignment.status}
                        </span>
                      </div>

                      {/* Title & Company */}
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {assignment.scenarioTitle}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {assignment.companyName} • Application for <span className="text-slate-300 font-medium">{assignment.jobTitle}</span>
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>~{assignment.estimatedDurationMinutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-slate-500" />
                          <span>{assignment.isRequired ? 'Required Assessment' : 'Optional Assessment'}</span>
                        </div>
                      </div>

                      {/* Completed Score Snapshot */}
                      {isCompleted && assignment.totalScore !== undefined && assignment.totalScore !== null && (
                        <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-300">Overall Score:</span>
                          <span className="text-sm font-extrabold text-emerald-400">
                            {assignment.totalScore.toFixed(1)} / 100.0
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        Deadline: {new Date(assignment.deadlineUtc).toLocaleDateString()}
                      </div>

                      {isCompleted ? (
                        <Link
                          to={`/candidate/simulations/session/${assignment.activeSessionId}/results`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Scorecard
                        </Link>
                      ) : isExpired ? (
                        <span className="text-xs text-rose-400 font-medium">Session Expired</span>
                      ) : (
                        <button
                          onClick={() => handleStartSession(assignment)}
                          disabled={startingAssignmentId === assignment.assignmentId}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {startingAssignmentId === assignment.assignmentId
                            ? 'Initializing...'
                            : isInProgress
                            ? 'Resume Simulation'
                            : 'Start Simulation'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Simulation Catalog & Architecture */}
        <div className="space-y-6 pt-6">
          <div className="border-t border-slate-800 pt-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              WorkSim Scenario Catalog & Engineering Sandbox
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              HireSphere's deterministic simulation engine powers multi-domain scenarios without hardcoded quiz scripts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalog.map((scenario) => (
              <div
                key={scenario.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {scenario.category}
                    </span>
                    <span className="text-slate-500">v{scenario.latestVersionNumber}.0</span>
                  </div>
                  <h4 className="text-base font-semibold text-white">{scenario.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-3">{scenario.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {scenario.estimatedDurationMinutes} mins
                  </span>
                  <span className="text-indigo-400 font-medium">Assigned via Job</span>
                </div>
              </div>
            ))}

            {/* Future Architecture Extensibility Teasers */}
            <div className="rounded-2xl bg-slate-900/30 border border-slate-800/60 p-5 space-y-3 flex flex-col justify-between opacity-70">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Finance & Operations
                  </span>
                  <span className="text-slate-500">Engine Compatible</span>
                </div>
                <h4 className="text-base font-semibold text-slate-300">Fictional Cash-Flow & Liquidity Triage</h4>
                <p className="text-xs text-slate-400">
                  Inspect quarterly balance sheets, prioritize vendor payables under capital constraints, and remediate liquidity variance.
                </p>
              </div>
              <div className="text-xs text-slate-500 pt-3 border-t border-slate-800/60">
                <span>Deterministic State Machine Engine</span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/30 border border-slate-800/60 p-5 space-y-3 flex flex-col justify-between opacity-70">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Customer Experience
                  </span>
                  <span className="text-slate-500">Engine Compatible</span>
                </div>
                <h4 className="text-base font-semibold text-slate-300">Critical Enterprise Incident Escalation</h4>
                <p className="text-xs text-slate-400">
                  Review SLA breach complaint, cross-examine ticketing logs, formulate resolution proposals, and manage customer expectations.
                </p>
              </div>
              <div className="text-xs text-slate-500 pt-3 border-t border-slate-800/60">
                <span>Deterministic State Machine Engine</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
