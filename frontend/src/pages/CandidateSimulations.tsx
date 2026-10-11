import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight,
  Info,
  Calendar,
  X
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
  const [selectedInstructionAssignment, setSelectedInstructionAssignment] = useState<AssessmentAssignment | null>(null);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* White and Light-Blue Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-blue-100 p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              HireSphere WorkSim™ Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Interactive Job Simulations
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Step into real-world operational challenges. Investigate realistic telemetry, inspect code and logs, make consequential decisions, and demonstrate your authentic problem-solving skills under realistic constraints.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Objective, Rubric-Based Scoring
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Terminal className="w-4 h-4 text-blue-600" /> Realistic Synthetic Environments
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-blue-700" /> Explainable Feedback & Audit Trail
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Assigned Simulations Dashboard */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                Your Assessment Invitations
              </h2>
              <p className="text-sm text-slate-500">
                Job simulations assigned for your active applications.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-sm" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No Assessment Invitations</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                When companies review your job applications and request an interactive simulation, it will appear here with instructions and deadlines.
              </p>
              <div className="pt-2">
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
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
                const isCancelled = assignment.status === 'Cancelled';
                
                const deadlineDate = new Date(assignment.deadlineUtc);
                const now = new Date();
                const msUntilDeadline = deadlineDate.getTime() - now.getTime();
                const hoursUntilDeadline = msUntilDeadline / (1000 * 60 * 60);
                const isApproachingDeadline = !isCompleted && !isExpired && !isCancelled && hoursUntilDeadline > 0 && hoursUntilDeadline <= 48;

                return (
                  <motion.div
                    key={assignment.assignmentId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all p-6 shadow-sm hover:shadow-md relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {assignment.scenarioCategory}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            assignment.isRequired
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {assignment.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>

                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isExpired
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isCancelled
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isInProgress && <Clock className="w-3.5 h-3.5" />}
                          {isExpired && <AlertCircle className="w-3.5 h-3.5" />}
                          {assignment.status}
                        </span>
                      </div>

                      {/* Title & Company */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {assignment.scenarioTitle}
                        </h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {assignment.companyName} • Application for <span className="text-slate-800 font-semibold">{assignment.jobTitle}</span>
                        </p>
                      </div>

                      {/* Approaching deadline warning */}
                      {isApproachingDeadline && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-xs text-amber-800">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span><strong>Deadline Approaching:</strong> Due within {Math.round(hoursUntilDeadline)} hours!</span>
                        </div>
                      )}

                      {/* Cancellation reason if cancelled */}
                      {isCancelled && assignment.cancellationReason && (
                        <div className="rounded-lg bg-slate-100 border border-slate-200 p-2.5 text-xs text-slate-600">
                          <strong>Cancellation Reason:</strong> {assignment.cancellationReason}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>~{assignment.estimatedDurationMinutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Due: {deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Score Snapshot if completed */}
                      {isCompleted && assignment.totalScore !== undefined && assignment.totalScore !== null && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">Evaluation Score:</span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            {assignment.totalScore.toFixed(1)} / 100.0
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setSelectedInstructionAssignment(assignment)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
                      >
                        <Info size={14} /> View Instructions
                      </button>

                      {isCompleted ? (
                        <Link
                          to={`/candidate/simulations/session/${assignment.activeSessionId}/results`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          View Scorecard
                        </Link>
                      ) : isExpired ? (
                        <span className="text-xs text-rose-600 font-medium">Deadline Expired</span>
                      ) : isCancelled ? (
                        <span className="text-xs text-slate-500 font-medium">Invitation Cancelled</span>
                      ) : (
                        <button
                          onClick={() => handleStartSession(assignment)}
                          disabled={startingAssignmentId === assignment.assignmentId}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
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

        {/* Instructions Modal */}
        <AnimatePresence>
          {selectedInstructionAssignment && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-slate-900">Assessment Instructions</h3>
                  </div>
                  <button
                    onClick={() => setSelectedInstructionAssignment(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      {selectedInstructionAssignment.scenarioTitle}
                    </h4>
                    <p className="text-slate-500 mt-0.5">
                      {selectedInstructionAssignment.companyName} • {selectedInstructionAssignment.jobTitle}
                    </p>
                  </div>

                  {selectedInstructionAssignment.scenarioDescription && (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                      {selectedInstructionAssignment.scenarioDescription}
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-700">Assessment Type:</span>
                      <span className="font-semibold text-blue-700">
                        {selectedInstructionAssignment.isRequired ? 'Required by Employer' : 'Optional / Recommended'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-700">Estimated Duration:</span>
                      <span className="font-semibold text-slate-800">
                        ~{selectedInstructionAssignment.estimatedDurationMinutes} minutes
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-700">Deadline:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedInstructionAssignment.deadlineUtc).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-700">Attempt Limit:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedInstructionAssignment.maxAllowedAttempts} {selectedInstructionAssignment.maxAllowedAttempts === 1 ? 'Attempt' : 'Attempts'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-800">What to expect:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>You will investigate an operational scenario and review synthetic telemetry.</li>
                      <li>Actions and evidence discovery update your progress automatically.</li>
                      <li>Upon completion, objective rubric feedback is generated for employer review.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedInstructionAssignment(null)}
                    className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-medium"
                  >
                    Close
                  </button>
                  {selectedInstructionAssignment.status !== 'Completed' &&
                   selectedInstructionAssignment.status !== 'Expired' &&
                   selectedInstructionAssignment.status !== 'Cancelled' && (
                    <button
                      onClick={() => {
                        const target = selectedInstructionAssignment;
                        setSelectedInstructionAssignment(null);
                        handleStartSession(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                    >
                      {selectedInstructionAssignment.status === 'InProgress' ? 'Resume Simulation' : 'Begin Simulation'}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Available Simulation Catalog */}
        <div className="space-y-6 pt-6">
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              WorkSim Scenario Catalog & Capabilities
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Deterministic job simulation scenarios available across recruitment campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalog.map((scenario) => (
              <div
                key={scenario.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 flex flex-col justify-between shadow-sm hover:border-blue-200 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      {scenario.category}
                    </span>
                    <span className="text-slate-400">v{scenario.latestVersionNumber}.0</span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">{scenario.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3">{scenario.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> ~{scenario.estimatedDurationMinutes} mins
                  </span>
                  <span className="text-blue-600 font-medium">Assigned via Job</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
