using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.WorkSim;
using HireSphere.Application.WorkSim.Models;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;
using HireSphere.Application.WorkSim;

namespace HireSphere.Application.Services;

public interface IWorkSimRuntimeService
{
    Task<CandidateSimulationRuntimeStateDto> StartSessionAsync(Guid userId, Guid assignmentId, CancellationToken ct = default);
    Task<CandidateSimulationRuntimeStateDto> GetSessionStateAsync(Guid userId, Guid sessionId, CancellationToken ct = default);
    Task<SubmitSimulationActionResult> SubmitActionAsync(Guid userId, Guid sessionId, SubmitSimulationActionRequest request, CancellationToken ct = default);
}

public class WorkSimRuntimeService : IWorkSimRuntimeService
{
    private readonly IApplicationDbContext _context;
    private readonly IWorkSimScoringService _scoringService;
    private readonly IAuditService _auditService;

    public WorkSimRuntimeService(
        IApplicationDbContext context,
        IWorkSimScoringService scoringService,
        IAuditService auditService)
    {
        _context = context;
        _scoringService = scoringService;
        _auditService = auditService;
    }

    public async Task<CandidateSimulationRuntimeStateDto> StartSessionAsync(Guid userId, Guid assignmentId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new ForbiddenAccessException("You must have a candidate profile to launch job simulations.");

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.JobAssessmentConfiguration)
                .ThenInclude(c => c.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.Sessions)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, ct);

        if (assignment == null)
            throw new NotFoundException("AssessmentAssignment", assignmentId);

        if (assignment.CandidateProfileId != candidateProfile.Id)
            throw new ForbiddenAccessException("You are not authorized to access this assessment assignment.");

        if (assignment.Status == AssessmentAssignmentStatus.Cancelled)
        {
            throw new ConflictException("This assessment invitation has been cancelled.");
        }

        if (assignment.DeadlineUtc <= DateTimeOffset.UtcNow)
        {
            assignment.Status = AssessmentAssignmentStatus.Expired;
            await _context.SaveChangesAsync(ct);
            throw new ConflictException("The deadline for this assessment assignment has expired.");
        }

        if (assignment.Status == AssessmentAssignmentStatus.Completed)
        {
            var existingSession = assignment.Sessions
                .OrderByDescending(s => s.StartedAtUtc)
                .FirstOrDefault();

            if (existingSession != null)
                return await GetSessionStateAsync(userId, existingSession.Id, ct);

            throw new ConflictException("This assessment assignment has already been completed.");
        }

        // Check if an active session already exists for this assignment
        var activeSession = assignment.Sessions
            .FirstOrDefault(s => s.Status == SimulationSessionStatus.Active && s.ExpiresAtUtc > DateTimeOffset.UtcNow);

        if (activeSession != null)
        {
            return await GetSessionStateAsync(userId, activeSession.Id, ct);
        }

        // Check attempt limits
        int existingAttemptCount = assignment.Sessions.Count;
        if (existingAttemptCount >= assignment.JobAssessmentConfiguration.MaxAllowedAttempts)
        {
            throw new ConflictException($"Maximum allowed attempts ({assignment.JobAssessmentConfiguration.MaxAllowedAttempts}) reached for this simulation.");
        }

        var scenarioVersion = assignment.JobAssessmentConfiguration.ScenarioVersion;
        var scenarioDef = DeserializeScenarioDefinition(scenarioVersion.DefinitionJson);

        // Initialize state vector
        var stateVector = new SessionStateVector
        {
            CurrentTaskKey = scenarioDef.InitialTaskKey,
            StateVariables = new Dictionary<string, string>(scenarioDef.InitialState),
            UnlockedEvidenceKeys = new HashSet<string>(
                scenarioDef.EvidenceItems.Where(e => e.InitiallyVisible).Select(e => e.EvidenceKey)),
            CompletedTaskKeys = new List<string>(),
            IsCompleted = false
        };

        // Unlock evidence for initial task
        var initialTask = scenarioDef.Tasks.FirstOrDefault(t => t.TaskKey == scenarioDef.InitialTaskKey);
        if (initialTask != null)
        {
            foreach (var key in initialTask.UnlockedEvidenceKeys)
            {
                stateVector.UnlockedEvidenceKeys.Add(key);
            }
        }

        var durationMinutes = scenarioDef.EstimatedDurationMinutes > 0 ? scenarioDef.EstimatedDurationMinutes : 30;
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(durationMinutes + 15); // 15 min buffer for reading instructions

        var session = new SimulationSession
        {
            AssessmentAssignmentId = assignment.Id,
            CandidateProfileId = candidateProfile.Id,
            ScenarioVersionId = scenarioVersion.Id,
            CurrentStateVectorJson = JsonSerializer.Serialize(stateVector),
            Status = SimulationSessionStatus.Active,
            StartedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = expiresAtUtc,
            TotalActionsTaken = 0
        };

        assignment.Status = AssessmentAssignmentStatus.InProgress;
        _context.SimulationSessions.Add(session);
        await _context.SaveChangesAsync(ct);

        await _auditService.LogAsync(
            action: "WorkSimSessionStarted",
            targetResource: "SimulationSession",
            targetResourceId: session.Id.ToString(),
            companyId: assignment.CompanyId,
            metadata: new { AssignmentId = assignment.Id, ScenarioId = scenarioVersion.SimulationScenarioId, VersionNumber = scenarioVersion.VersionNumber },
            cancellationToken: ct);

        return BuildRuntimeStateDto(session, assignment, scenarioDef, stateVector, new List<SimulationActionLog>());
    }

    public async Task<CandidateSimulationRuntimeStateDto> GetSessionStateAsync(Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new ForbiddenAccessException("You must have a candidate profile to view session state.");

        var session = await _context.SimulationSessions
            .Include(s => s.AssessmentAssignment)
                .ThenInclude(a => a.JobAssessmentConfiguration)
                    .ThenInclude(c => c.ScenarioVersion)
                        .ThenInclude(v => v.SimulationScenario)
            .Include(s => s.AssessmentResult)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session == null)
            throw new NotFoundException("SimulationSession", sessionId);

        if (session.CandidateProfileId != candidateProfile.Id)
            throw new ForbiddenAccessException("You are not authorized to access this simulation session.");

        // Check if session has timed out
        if (session.Status == SimulationSessionStatus.Active && session.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            session.Status = SimulationSessionStatus.TimedOut;
            session.AssessmentAssignment.Status = AssessmentAssignmentStatus.Expired;
            await _context.SaveChangesAsync(ct);
        }

        var scenarioDef = DeserializeScenarioDefinition(session.ScenarioVersion.DefinitionJson);
        var stateVector = JsonSerializer.Deserialize<SessionStateVector>(session.CurrentStateVectorJson)
            ?? new SessionStateVector();

        var actionLogs = await _context.SimulationActionLogs
            .Where(l => l.SimulationSessionId == session.Id)
            .OrderBy(l => l.SequenceNumber)
            .ToListAsync(ct);

        return BuildRuntimeStateDto(session, session.AssessmentAssignment, scenarioDef, stateVector, actionLogs);
    }

    public async Task<SubmitSimulationActionResult> SubmitActionAsync(Guid userId, Guid sessionId, SubmitSimulationActionRequest request, CancellationToken ct = default)
    {
        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (candidateProfile == null)
            throw new ForbiddenAccessException("You must have a candidate profile to take simulation actions.");

        var session = await _context.SimulationSessions
            .Include(s => s.AssessmentAssignment)
                .ThenInclude(a => a.JobAssessmentConfiguration)
                    .ThenInclude(c => c.ScenarioVersion)
                        .ThenInclude(v => v.SimulationScenario)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session == null)
            throw new NotFoundException("SimulationSession", sessionId);

        if (session.CandidateProfileId != candidateProfile.Id)
            throw new ForbiddenAccessException("You are not authorized to interact with this simulation session.");

        if (session.Status != SimulationSessionStatus.Active)
            throw new ConflictException($"This simulation session is in status '{session.Status}' and cannot accept further actions.");

        if (session.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            session.Status = SimulationSessionStatus.TimedOut;
            session.AssessmentAssignment.Status = AssessmentAssignmentStatus.Expired;
            await _context.SaveChangesAsync(ct);
            throw new ConflictException("The time limit for this simulation session has expired.");
        }

        var scenarioDef = DeserializeScenarioDefinition(session.ScenarioVersion.DefinitionJson);
        var stateVector = JsonSerializer.Deserialize<SessionStateVector>(session.CurrentStateVectorJson)
            ?? new SessionStateVector();

        var currentTask = scenarioDef.Tasks.FirstOrDefault(t => t.TaskKey == stateVector.CurrentTaskKey)
            ?? scenarioDef.Tasks.First();

        var selectedAction = currentTask.AvailableActions.FirstOrDefault(a => a.ActionKey == request.ActionKey);
        if (selectedAction == null)
        {
            throw new ValidationException($"Action '{request.ActionKey}' is not an available action for the current task '{currentTask.Title}'.");
        }

        if (selectedAction.RequiresRationale && string.IsNullOrWhiteSpace(request.CandidateRationale))
        {
            throw new ValidationException("This action requires a written operational rationale before it can be submitted.");
        }

        // Apply state updates from action definition
        if (selectedAction.StateUpdates != null)
        {
            foreach (var kvp in selectedAction.StateUpdates)
            {
                stateVector.StateVariables[kvp.Key] = kvp.Value;
            }
        }

        // Unlock evidence
        if (selectedAction.EvidenceKeysToUnlock != null)
        {
            foreach (var key in selectedAction.EvidenceKeysToUnlock)
            {
                stateVector.UnlockedEvidenceKeys.Add(key);
            }
        }

        // Determine next task or completion
        string nextTaskKey = !string.IsNullOrWhiteSpace(selectedAction.TargetTaskKey)
            ? selectedAction.TargetTaskKey
            : currentTask.TaskKey;

        var nextTask = scenarioDef.Tasks.FirstOrDefault(t => t.TaskKey == nextTaskKey);
        if (nextTask != null && nextTask.UnlockedEvidenceKeys != null)
        {
            foreach (var key in nextTask.UnlockedEvidenceKeys)
            {
                stateVector.UnlockedEvidenceKeys.Add(key);
            }
        }

        if (!stateVector.CompletedTaskKeys.Contains(currentTask.TaskKey))
        {
            stateVector.CompletedTaskKeys.Add(currentTask.TaskKey);
        }

        stateVector.CurrentTaskKey = nextTaskKey;

        // Check completion condition: terminal task executed or final verification step taken
        bool isCompleted = currentTask.IsTerminalTask ||
                           (nextTask != null && nextTask.IsTerminalTask && selectedAction.ActionType == "VERIFY") ||
                           selectedAction.ActionKey.Contains("verify_telemetry") ||
                           selectedAction.ActionKey.Contains("verify_abrupt_close");

        if (isCompleted)
        {
            stateVector.IsCompleted = true;
            session.Status = SimulationSessionStatus.Submitted;
            session.SubmittedAtUtc = DateTimeOffset.UtcNow;
            session.AssessmentAssignment.Status = AssessmentAssignmentStatus.Completed;
            session.AssessmentAssignment.CompletedAtUtc = DateTimeOffset.UtcNow;
        }

        // Record Action Log
        long elapsedMs = (long)(DateTimeOffset.UtcNow - session.StartedAtUtc).TotalMilliseconds;
        var actionLog = new SimulationActionLog
        {
            SimulationSessionId = session.Id,
            SequenceNumber = session.TotalActionsTaken + 1,
            ActionType = selectedAction.ActionType,
            ActionPayloadJson = JsonSerializer.Serialize(new
            {
                ActionKey = selectedAction.ActionKey,
                Title = selectedAction.Title,
                FeedbackMessage = selectedAction.FeedbackMessage
            }),
            CandidateRationale = string.IsNullOrWhiteSpace(request.CandidateRationale) ? null : request.CandidateRationale.Trim(),
            ElapsedMillisecondsFromStart = elapsedMs,
            TimestampUtc = DateTimeOffset.UtcNow
        };

        session.TotalActionsTaken++;
        session.CurrentStateVectorJson = JsonSerializer.Serialize(stateVector);

        _context.SimulationActionLogs.Add(actionLog);
        await _context.SaveChangesAsync(ct);

        Guid? resultId = null;
        if (isCompleted)
        {
            var evaluation = await _scoringService.EvaluateSessionAsync(session.Id, ct);
            resultId = evaluation.ResultId;

            await _auditService.LogAsync(
                action: "WorkSimSessionCompleted",
                targetResource: "SimulationSession",
                targetResourceId: session.Id.ToString(),
                companyId: session.AssessmentAssignment.CompanyId,
                metadata: new { TotalScore = evaluation.TotalScore, TotalActions = session.TotalActionsTaken },
                cancellationToken: ct);
        }

        var allActionLogs = await _context.SimulationActionLogs
            .Where(l => l.SimulationSessionId == session.Id)
            .OrderBy(l => l.SequenceNumber)
            .ToListAsync(ct);

        var updatedState = BuildRuntimeStateDto(session, session.AssessmentAssignment, scenarioDef, stateVector, allActionLogs);
        updatedState.ResultId = resultId;

        return new SubmitSimulationActionResult
        {
            Success = true,
            Message = selectedAction.FeedbackMessage ?? "Action recorded successfully.",
            UpdatedState = updatedState,
            IsCompleted = isCompleted,
            ResultId = resultId
        };
    }

    private static ScenarioDefinition DeserializeScenarioDefinition(string definitionJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(definitionJson))
                return DefaultIncidentScenario.CreateScenarioDefinition();

            return JsonSerializer.Deserialize<ScenarioDefinition>(definitionJson)
                ?? DefaultIncidentScenario.CreateScenarioDefinition();
        }
        catch
        {
            return DefaultIncidentScenario.CreateScenarioDefinition();
        }
    }

    private static CandidateSimulationRuntimeStateDto BuildRuntimeStateDto(
        SimulationSession session,
        AssessmentAssignment assignment,
        ScenarioDefinition scenarioDef,
        SessionStateVector stateVector,
        List<SimulationActionLog> actionLogs)
    {
        var currentTask = scenarioDef.Tasks.FirstOrDefault(t => t.TaskKey == stateVector.CurrentTaskKey)
            ?? scenarioDef.Tasks.FirstOrDefault()
            ?? new SimulationTaskDefinition();

        var unlockedEvidenceList = scenarioDef.EvidenceItems
            .Where(e => stateVector.UnlockedEvidenceKeys.Contains(e.EvidenceKey))
            .Select(e => new SimulationEvidenceItemDto
            {
                EvidenceKey = e.EvidenceKey,
                Title = e.Title,
                Category = e.Category,
                Content = e.Content
            })
            .ToList();

        // Project only available actions for current task
        var availableActions = session.Status == SimulationSessionStatus.Active && !stateVector.IsCompleted
            ? currentTask.AvailableActions.Select(a => new AvailableActionDto
            {
                ActionKey = a.ActionKey,
                ActionType = a.ActionType,
                Title = a.Title,
                Description = a.Description,
                RequiresRationale = a.RequiresRationale
            }).ToList()
            : new List<AvailableActionDto>();

        var historyItems = actionLogs.Select(l =>
        {
            string title = l.ActionType;
            string? feedback = null;
            try
            {
                using var doc = JsonDocument.Parse(l.ActionPayloadJson);
                if (doc.RootElement.TryGetProperty("Title", out var tProp))
                    title = tProp.GetString() ?? l.ActionType;
                if (doc.RootElement.TryGetProperty("FeedbackMessage", out var fProp))
                    feedback = fProp.GetString();
            }
            catch { }

            return new SimulationActionHistoryItemDto
            {
                SequenceNumber = l.SequenceNumber,
                ActionType = l.ActionType,
                ActionKey = l.ActionPayloadJson,
                ActionTitle = title,
                CandidateRationale = l.CandidateRationale,
                ElapsedMilliseconds = l.ElapsedMillisecondsFromStart,
                TimestampUtc = l.TimestampUtc,
                FeedbackMessage = feedback
            };
        }).ToList();

        int taskIndex = scenarioDef.Tasks.FindIndex(t => t.TaskKey == currentTask.TaskKey) + 1;
        if (taskIndex <= 0) taskIndex = 1;

        return new CandidateSimulationRuntimeStateDto
        {
            SessionId = session.Id,
            AssignmentId = assignment.Id,
            ScenarioTitle = scenarioDef.Title,
            ScenarioCategory = scenarioDef.Category,
            InitialContext = scenarioDef.InitialContext,
            CurrentTaskKey = currentTask.TaskKey,
            CurrentTaskTitle = currentTask.Title,
            CurrentTaskInstructions = currentTask.Instructions,
            TaskIndex = taskIndex,
            TotalTasks = scenarioDef.Tasks.Count,
            StateVariables = stateVector.StateVariables,
            UnlockedEvidence = unlockedEvidenceList,
            AvailableActions = availableActions,
            ActionHistory = historyItems,
            TotalActionsTaken = session.TotalActionsTaken,
            StartedAtUtc = session.StartedAtUtc,
            ExpiresAtUtc = session.ExpiresAtUtc,
            IsCompleted = session.Status == SimulationSessionStatus.Submitted || stateVector.IsCompleted,
            Status = session.Status.ToString(),
            ResultId = session.AssessmentResult?.Id
        };
    }
}

public class SubmitSimulationActionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public CandidateSimulationRuntimeStateDto UpdatedState { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public Guid? ResultId { get; set; }
}
