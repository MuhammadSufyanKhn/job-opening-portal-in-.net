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

public interface IWorkSimScoringService
{
    Task<AssessmentResultDto> EvaluateSessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<AssessmentResultDto?> GetSessionResultAsync(Guid sessionId, Guid userId, CancellationToken ct = default);
    Task<AssessmentResultDto?> GetCompanyApplicationAssessmentResultAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default);
}

public class WorkSimScoringService : IWorkSimScoringService
{
    private readonly IApplicationDbContext _context;

    public WorkSimScoringService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssessmentResultDto> EvaluateSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await _context.SimulationSessions
            .Include(s => s.ScenarioVersion)
                .ThenInclude(v => v.SimulationScenario)
            .Include(s => s.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(s => s.AssessmentAssignment)
                .ThenInclude(a => a.JobApplication)
                    .ThenInclude(app => app.JobPosting)
            .Include(s => s.AssessmentResult)
                .ThenInclude(r => r!.CriterionScores)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session == null)
            throw new NotFoundException("SimulationSession", sessionId);

        // Idempotency: if already scored, return existing result
        if (session.AssessmentResult != null && session.AssessmentResult.CriterionScores.Any())
        {
            return MapToDto(session.AssessmentResult, session);
        }

        var actionLogs = await _context.SimulationActionLogs
            .Where(l => l.SimulationSessionId == sessionId)
            .OrderBy(l => l.SequenceNumber)
            .ToListAsync(ct);

        var rubricDef = DeserializeRubricDefinition(session.ScenarioVersion.RubricJson);
        var stateVector = DeserializeStateVector(session.CurrentStateVectorJson);

        var criterionScores = new List<CriterionScore>();
        decimal aggregateScore = 0;

        foreach (var criterion in rubricDef.Criteria)
        {
            decimal criterionPoints = 0;
            var evidencePoints = new List<string>();
            var feedbackList = new List<string>();

            foreach (var rule in criterion.Rules)
            {
                bool ruleSatisfied = false;

                switch (rule.ConditionType)
                {
                    case "ActionTaken":
                        ruleSatisfied = actionLogs.Any(a => a.ActionPayloadJson.Contains(rule.TargetKey));
                        break;

                    case "ActionNotTaken":
                        ruleSatisfied = !actionLogs.Any(a => a.ActionPayloadJson.Contains(rule.TargetKey));
                        break;

                    case "HasRationale":
                        var matchingLog = actionLogs.FirstOrDefault(a => a.ActionPayloadJson.Contains(rule.TargetKey));
                        ruleSatisfied = matchingLog != null &&
                                        !string.IsNullOrWhiteSpace(matchingLog.CandidateRationale) &&
                                        matchingLog.CandidateRationale.Trim().Length >= 10;
                        if (ruleSatisfied && matchingLog?.CandidateRationale != null)
                        {
                            evidencePoints.Add($"Documented Rationale: \"{matchingLog.CandidateRationale.Trim()}\"");
                        }
                        break;

                    case "StateEquals":
                        if (stateVector.StateVariables.TryGetValue(rule.TargetKey, out var actualVal))
                        {
                            ruleSatisfied = string.Equals(actualVal, rule.ExpectedValue, StringComparison.OrdinalIgnoreCase);
                        }
                        break;
                }

                if (ruleSatisfied)
                {
                    criterionPoints += rule.PointsDelta;
                    if (!string.IsNullOrWhiteSpace(rule.Feedback))
                    {
                        evidencePoints.Add(rule.Feedback);
                        feedbackList.Add(rule.Feedback);
                    }
                }
            }

            // Clamp criterion points between 0 and MaxPoints
            criterionPoints = Math.Clamp(criterionPoints, 0, criterion.MaxPoints);
            aggregateScore += criterionPoints;

            var scoreEntity = new CriterionScore
            {
                CriterionName = criterion.Name,
                Score = criterionPoints,
                MaxScore = criterion.MaxPoints,
                SupportingEvidenceJson = JsonSerializer.Serialize(evidencePoints),
                Feedback = feedbackList.Any()
                    ? string.Join(" ", feedbackList)
                    : criterion.Description
            };

            criterionScores.Add(scoreEntity);
        }

        // Aggregate score clamped to 0..100
        aggregateScore = Math.Clamp(aggregateScore, 0, 100);

        string summary = $"WorkSim simulation completed. Score: {aggregateScore:F1} / 100.00 across {criterionScores.Count} criteria. " +
                         $"Evaluated {actionLogs.Count} recorded actions with versioned rubric {rubricDef.RubricVersion}.";

        string candidateFeedback = string.Join(" \n\n", criterionScores.Select(c => $"• {c.CriterionName} ({c.Score:F0}/{c.MaxScore:F0} pts): {c.Feedback}"));

        var assessmentResult = new AssessmentResult
        {
            SimulationSessionId = session.Id,
            ScenarioVersionId = session.ScenarioVersionId,
            TotalScore = aggregateScore,
            EvaluationSummary = summary,
            CandidateFeedback = candidateFeedback,
            EvaluatedAtUtc = DateTimeOffset.UtcNow,
            CriterionScores = criterionScores
        };

        _context.AssessmentResults.Add(assessmentResult);
        await _context.SaveChangesAsync(ct);

        return MapToDto(assessmentResult, session);
    }

    public async Task<AssessmentResultDto?> GetSessionResultAsync(Guid sessionId, Guid userId, CancellationToken ct = default)
    {
        var session = await _context.SimulationSessions
            .Include(s => s.ScenarioVersion)
                .ThenInclude(v => v.SimulationScenario)
            .Include(s => s.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .Include(s => s.AssessmentAssignment)
                .ThenInclude(a => a.JobApplication)
                    .ThenInclude(app => app.JobPosting)
            .Include(s => s.AssessmentResult)
                .ThenInclude(r => r!.CriterionScores)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session == null)
            throw new NotFoundException("SimulationSession", sessionId);

        var candidateProfile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        // Check if candidate owns session
        bool isCandidateOwner = candidateProfile != null && session.CandidateProfileId == candidateProfile.Id;

        // Check if company member has access
        bool isAuthorizedCompanyMember = false;
        if (!isCandidateOwner)
        {
            var companyMember = await _context.CompanyMembers
                .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == session.AssessmentAssignment.CompanyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

            isAuthorizedCompanyMember = companyMember != null;
        }

        if (!isCandidateOwner && !isAuthorizedCompanyMember)
            throw new ForbiddenAccessException("You are not authorized to view this assessment result.");

        if (session.AssessmentResult == null)
        {
            // If submitted or completed, trigger scoring on-the-fly
            if (session.Status == SimulationSessionStatus.Submitted)
            {
                return await EvaluateSessionAsync(sessionId, ct);
            }

            return null;
        }

        return MapToDto(session.AssessmentResult, session);
    }

    public async Task<AssessmentResultDto?> GetCompanyApplicationAssessmentResultAsync(Guid companyId, Guid applicationId, Guid userId, CancellationToken ct = default)
    {
        var companyMember = await _context.CompanyMembers
            .FirstOrDefaultAsync(cm => cm.UserId == userId && cm.CompanyId == companyId && cm.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (companyMember == null)
            throw new ForbiddenAccessException("You are not an active member of this company.");

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.JobPosting.CompanyId == companyId, ct);

        if (application == null)
            throw new NotFoundException("JobApplication", applicationId);

        var assignment = await _context.AssessmentAssignments
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
                    .ThenInclude(r => r!.CriterionScores)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.ScenarioVersion)
                    .ThenInclude(v => v.SimulationScenario)
            .Include(a => a.CandidateProfile)
                .ThenInclude(cp => cp.User)
            .FirstOrDefaultAsync(a => a.JobApplicationId == applicationId, ct);

        if (assignment == null)
            return null;

        var completedSession = assignment.Sessions
            .OrderByDescending(s => s.StartedAtUtc)
            .FirstOrDefault(s => s.AssessmentResult != null);

        if (completedSession?.AssessmentResult == null)
        {
            // Try to find submitted session without result yet
            var submittedSession = assignment.Sessions
                .FirstOrDefault(s => s.Status == SimulationSessionStatus.Submitted);

            if (submittedSession != null)
            {
                return await EvaluateSessionAsync(submittedSession.Id, ct);
            }

            return null;
        }

        return MapToDto(completedSession.AssessmentResult, completedSession);
    }

    private static SimulationRubricDefinition DeserializeRubricDefinition(string rubricJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(rubricJson))
                return DefaultIncidentScenario.CreateRubricDefinition();

            return JsonSerializer.Deserialize<SimulationRubricDefinition>(rubricJson)
                ?? DefaultIncidentScenario.CreateRubricDefinition();
        }
        catch
        {
            return DefaultIncidentScenario.CreateRubricDefinition();
        }
    }

    private static SessionStateVector DeserializeStateVector(string stateVectorJson)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(stateVectorJson))
                return new SessionStateVector();

            return JsonSerializer.Deserialize<SessionStateVector>(stateVectorJson)
                ?? new SessionStateVector();
        }
        catch
        {
            return new SessionStateVector();
        }
    }

    private static AssessmentResultDto MapToDto(AssessmentResult result, SimulationSession session)
    {
        var criteria = result.CriterionScores.Select(c =>
        {
            List<string> evidence = new();
            try
            {
                if (!string.IsNullOrWhiteSpace(c.SupportingEvidenceJson))
                    evidence = JsonSerializer.Deserialize<List<string>>(c.SupportingEvidenceJson) ?? new();
            }
            catch { }

            return new CriterionScoreDto
            {
                CriterionName = c.CriterionName,
                Score = c.Score,
                MaxScore = c.MaxScore,
                Feedback = c.Feedback,
                SupportingEvidence = evidence
            };
        }).ToList();

        return new AssessmentResultDto
        {
            ResultId = result.Id,
            SessionId = session.Id,
            CandidateProfileId = session.CandidateProfileId,
            CandidateName = session.CandidateProfile?.User?.FullName ?? "Candidate",
            ScenarioTitle = session.ScenarioVersion?.SimulationScenario?.Title ?? "Job Simulation",
            ScenarioCategory = session.ScenarioVersion?.SimulationScenario?.Category ?? "Assessment",
            TotalScore = result.TotalScore,
            EvaluationSummary = result.EvaluationSummary,
            CandidateFeedback = result.CandidateFeedback,
            EvaluatedAtUtc = result.EvaluatedAtUtc,
            CriterionScores = criteria
        };
    }
}
