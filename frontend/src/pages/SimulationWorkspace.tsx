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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Booting WorkSim interactive environment...</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Simulation Error</h2>
          <p className="text-sm text-slate-300">{error}</p>
          <Link
            to="/candidate/simulations"
            className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header / Status Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                {state.scenarioCategory}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Stage {state.taskIndex} of {state.totalTasks}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
              {state.scenarioTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>State: <span className="font-semibold text-white">{state.status}</span></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Actions: <span className="font-semibold text-white">{state.totalActionsTaken}</span></span>
          </div>

          <Link
            to="/candidate/simulations"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
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
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                ACTIVE TASK
              </span>
              <span className="text-slate-400">Decision Point #{state.taskIndex}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {state.currentTaskTitle}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 rounded-xl p-4 border border-indigo-500/20">
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
                className="rounded-xl bg-emerald-950/70 border border-emerald-500/40 p-4 text-emerald-200 text-xs flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-300">Observation Recorded</p>
                  <p className="mt-0.5">{actionFeedback}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl bg-rose-950/60 border border-rose-500/40 p-3.5 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Execution Blocked</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Available Decision Actions */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Available Actions & Operational Decisions
              </h3>
              <span className="text-xs text-slate-400">{state.availableActions.length} choices</span>
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
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            action.actionType === 'INSPECT'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : action.actionType === 'PRIORITIZE'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : action.actionType === 'REMEDIATE'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {action.actionType}
                          </span>
                          <h4 className="text-sm font-bold text-white">{action.title}</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>
                      </div>

                      <div className="shrink-0 mt-1">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-500'
                            : 'border-slate-600'
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
              className="rounded-2xl bg-slate-900 border border-indigo-500/40 p-5 space-y-4 shadow-2xl"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  Confirm Action Decision: {selectedAction.title}
                </div>
                <p className="text-xs text-slate-400">
                  {selectedAction.requiresRationale
                    ? 'This consequential decision requires an operational rationale to be scored by the evaluation rubric.'
                    : 'Optional: Document your reasoning to add supporting evidence to your evaluation scorecard.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Technical Reasoning / Operational Rationale {selectedAction.requiresRationale && <span className="text-indigo-400">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={candidateRationale}
                  onChange={(e) => setCandidateRationale(e.target.value)}
                  placeholder="Explain why you chose this action, which telemetry or log lines support it, and the expected system outcome..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-100 p-3 outline-none resize-none placeholder-slate-600"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Action Audit Trail ({state.actionHistory.length})
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {state.actionHistory.map((item) => (
                  <div
                    key={item.sequenceNumber}
                    className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">
                        #{item.sequenceNumber} {item.actionTitle}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        +{(item.elapsedMilliseconds / 1000).toFixed(0)}s
                      </span>
                    </div>
                    {item.candidateRationale && (
                      <p className="text-slate-400 italic text-[11px]">
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
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Simulated State Monitor
              </h3>
              <span className="text-[10px] text-slate-500">Authoritative Vector</span>
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
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        : isHealthy
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
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
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Investigation Evidence Vault ({state.unlockedEvidence.length})
              </h3>
              <span className="text-[10px] text-cyan-400">Inspecting Artifacts</span>
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="truncate max-w-[130px]">{ev.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Evidence Document Terminal Viewer */}
            <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-auto max-h-[380px] shadow-inner">
              {currentEvidence ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2">
                    <span className="text-indigo-400 font-semibold">{currentEvidence.category}</span>
                    <span>{currentEvidence.title}</span>
                  </div>
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11.5px]">
                    {currentEvidence.content}
                  </pre>
                </div>
              ) : (
                <p className="text-slate-500 italic">No evidence selected.</p>
              )}
            </div>

            <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              Evidence updates as you progress through tasks and execute diagnostic decisions.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
};
