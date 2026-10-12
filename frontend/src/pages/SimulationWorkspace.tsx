import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Activity, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Layers, 
  Info, 
  ShieldAlert,
  RefreshCw, 
  Eye
} from 'lucide-react';
import { workSimApi } from '../services/api';
import type { 
  CandidateSimulationRuntimeState, 
  AvailableAction
} from '../types/worksim';

export const SimulationWorkspace: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<CandidateSimulationRuntimeState | null>(null);
  const [selectedEvidenceKey, setSelectedEvidenceKey] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<AvailableAction | null>(null);
  const [candidateRationale, setCandidateRationale] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (sessionId) {
      loadState(sessionId);
    }
  }, [sessionId]);

  const loadState = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workSimApi.getSessionState(id);
      setState(data);
      if (data.unlockedEvidence.length > 0 && !selectedEvidenceKey) {
        setSelectedEvidenceKey(data.unlockedEvidence[0].evidenceKey);
      }
      if (data.isCompleted) {
        navigate(`/candidate/simulations/session/${id}/results`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load simulation session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!sessionId || !selectedAction) return;

    if (selectedAction.requiresRationale && (!candidateRationale || candidateRationale.trim().length < 5)) {
      setError('Please provide a meaningful operational rationale before executing this consequential decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionFeedback(null);

    try {
      const result = await workSimApi.submitAction(sessionId, {
        actionKey: selectedAction.actionKey,
        candidateRationale: candidateRationale.trim() || undefined
      });

      setState(result.updatedState);
      setActionFeedback(result.message);
      setSelectedAction(null);
      setCandidateRationale('');

      // Auto select newly unlocked evidence if any
      if (result.updatedState.unlockedEvidence.length > 0) {
        setSelectedEvidenceKey(result.updatedState.unlockedEvidence[result.updatedState.unlockedEvidence.length - 1].evidenceKey);
      }

      if (result.isCompleted) {
        setTimeout(() => {
          navigate(`/candidate/simulations/session/${sessionId}/results`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Action could not be executed. Please verify instructions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Booting WorkSim interactive environment...</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Simulation Error</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <Link
            to="/candidate/simulations"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
          >
            Return to Simulations
          </Link>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const currentEvidence = state.unlockedEvidence.find(e => e.evidenceKey === selectedEvidenceKey) 
    || state.unlockedEvidence[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header / Status Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                {state.scenarioCategory}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Stage {state.taskIndex} of {state.totalTasks}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md sm:max-w-xl">
              {state.scenarioTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>State: <span className="font-semibold text-slate-900">{state.status}</span></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Actions: <span className="font-semibold text-slate-900">{state.totalActionsTaken}</span></span>
          </div>

          <Link
            to="/candidate/simulations"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors border border-slate-200"
          >
            Exit Workspace
          </Link>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Context, Task Instructions & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Current Task Banner */}
          <div className="rounded-2xl bg-white border border-blue-200 p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                ACTIVE TASK
              </span>
              <span className="text-slate-500 font-medium">Decision Point #{state.taskIndex}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {state.currentTaskTitle}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              {state.currentTaskInstructions}
            </p>
          </div>

          {/* Action Feedback Toast */}
          <AnimatePresence>
            {actionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs flex items-start gap-3 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Observation Recorded</p>
                  <p className="mt-0.5">{actionFeedback}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Execution Blocked</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Available Decision Actions */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Available Actions & Operational Decisions
              </h3>
              <span className="text-xs text-slate-500">{state.availableActions.length} choices</span>
            </div>

            <div className="space-y-3">
              {state.availableActions.map((action) => {
                const isSelected = selectedAction?.actionKey === action.actionKey;

                return (
                  <div
                    key={action.actionKey}
                    onClick={() => {
                      setSelectedAction(action);
                      setError(null);
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            action.actionType === 'INSPECT'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : action.actionType === 'PRIORITIZE'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : action.actionType === 'REMEDIATE'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {action.actionType}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{action.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                      </div>

                      <div className="shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consequential Rationale & Confirmation Form */}
          {selectedAction && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-blue-300 p-5 space-y-4 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Confirm Action Decision: {selectedAction.title}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedAction.requiresRationale
                    ? 'This key decision requires a brief explanation for the hiring team to review.'
                    : 'Optional: Document your reasoning to provide more context to the hiring team.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Your Reasoning & Explanation {selectedAction.requiresRationale && <span className="text-blue-600">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={candidateRationale}
                  onChange={(e) => setCandidateRationale(e.target.value)}
                  placeholder="Explain why you chose this action, which telemetry or log lines support it, and the expected system outcome..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white text-xs text-slate-900 p-3 outline-none resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating State Transition...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Execute Simulated Decision
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Action History Audit Trail */}
          {state.actionHistory.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Action Audit Trail ({state.actionHistory.length})
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {state.actionHistory.map((item) => (
                  <div
                    key={item.sequenceNumber}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-700">
                        #{item.sequenceNumber} {item.actionTitle}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        +{(item.elapsedMilliseconds / 1000).toFixed(0)}s
                      </span>
                    </div>
                    {item.candidateRationale && (
                      <p className="text-slate-600 italic text-[11px]">
                        Rationale: "{item.candidateRationale}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Simulated Telemetry & Evidence Explorer (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Simulated System State Monitor */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live Simulated State Monitor
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Authoritative Vector</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(state.stateVariables).map(([key, value]) => {
                const isStatus = key === 'service_status';
                const isDegraded = isStatus && (value.includes('Degraded') || value.includes('P1') || value.includes('Disabled'));
                const isHealthy = isStatus && (value.includes('Healthy') || value.includes('Recovering'));

                return (
                  <div
                    key={key}
                    className={`rounded-xl p-3 border ${
                      isDegraded
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : isHealthy
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono font-bold text-xs truncate block mt-0.5">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unlocked Evidence Explorer */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Scenario Clues & Documents ({state.unlockedEvidence.length})
              </h3>
              <span className="text-[10px] text-blue-600 font-semibold">Inspecting Artifacts</span>
            </div>

            {/* Evidence Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {state.unlockedEvidence.map((ev) => {
                const key = ev.evidenceKey;
                const isSelected = selectedEvidenceKey === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEvidenceKey(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="truncate max-w-[130px]">{ev.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Evidence Document Viewer */}
            <div className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs overflow-auto max-h-[380px] shadow-inner text-slate-200">
              {currentEvidence ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="text-blue-400 font-semibold">{currentEvidence.category}</span>
                    <span>{currentEvidence.title}</span>
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11.5px]">
                    {currentEvidence.content}
                  </pre>
                </div>
              ) : (
                <p className="text-slate-400 italic">No evidence selected.</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Evidence updates as you progress through tasks and execute diagnostic decisions.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
};
