using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Candidate;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface ICandidateDashboardService
{
    Task<CandidateDashboardDto> GetDashboardAsync(Guid userId, CancellationToken ct = default);
    Task<ExtractedCvSuggestionsDto> GetExtractedCvSuggestionsAsync(Guid userId, CancellationToken ct = default);
}

public class CandidateDashboardService : ICandidateDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly ICandidateSavedJobsService _savedJobsService;
    private readonly ILogger<CandidateDashboardService> _logger;

    public CandidateDashboardService(
        IApplicationDbContext context,
        ICandidateSavedJobsService savedJobsService,
        ILogger<CandidateDashboardService> logger)
    {
        _context = context;
        _savedJobsService = savedJobsService;
        _logger = logger;
    }

    public async Task<CandidateDashboardDto> GetDashboardAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles
            .Include(cp => cp.User)
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (profile == null)
        {
            throw new NotFoundException("Candidate profile not found for user.");
        }

        var now = DateTimeOffset.UtcNow;

        // 1. Primary CV Summary
        var primaryCv = await _context.CandidateDocuments
            .Include(d => d.ExtractionJobs)
            .FirstOrDefaultAsync(d => d.CandidateProfileId == profile.Id && !d.IsDeleted && d.IsDefault, ct);

        var latestExtraction = primaryCv?.ExtractionJobs
            .OrderByDescending(j => j.CreatedAtUtc)
            .FirstOrDefault();

        int extractedSkillsCount = 0;
        if (latestExtraction?.StructuredDataJson != null)
        {
            try
            {
                using var doc = JsonDocument.Parse(latestExtraction.StructuredDataJson);
                if (doc.RootElement.TryGetProperty("ExtractedSkills", out var skillsProp) && skillsProp.ValueKind == JsonValueKind.Array)
                {
                    extractedSkillsCount = skillsProp.GetArrayLength();
                }
            }
            catch
            {
                // Ignore parse errors for preview
            }
        }

        // 2. Profile completion calculation
        var (completionPercentage, missingFields) = CandidateProfileService.CalculateProfileCompletion(
            profile.User.FirstName,
            profile.User.LastName,
            profile.Headline,
            profile.Summary,
            profile.Location,
            profile.YearsOfExperience,
            profile.LinkedInUrl,
            profile.GitHubUrl,
            profile.PortfolioUrl,
            hasPrimaryCv: primaryCv != null);

        // 3. Applications tracking
        var applications = await _context.JobApplications
            .AsNoTracking()
            .Include(a => a.JobPosting)
                .ThenInclude(j => j.Company)
            .Where(a => a.CandidateProfileId == profile.Id)
            .OrderByDescending(a => a.SubmittedAtUtc)
            .ToListAsync(ct);

        int totalApplications = applications.Count;
        int completedApplications = applications.Count(a =>
            a.CurrentStage == ApplicationStage.Hired ||
            a.CurrentStage == ApplicationStage.Rejected ||
            a.CurrentStage == ApplicationStage.Withdrawn);
        int activeApplications = totalApplications - completedApplications;

        var applicationsByStage = applications
            .GroupBy(a => a.CurrentStage.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var recentApplications = applications
            .Take(5)
            .Select(a => new CandidateDashboardApplicationDto(
                ApplicationId: a.Id,
                JobPostingId: a.JobPostingId,
                JobTitle: a.JobPosting.Title,
                CompanyName: a.JobPosting.Company.Name,
                CompanyLogoUrl: a.JobPosting.Company.LogoUrl,
                CurrentStage: a.CurrentStage,
                SubmittedAtUtc: a.SubmittedAtUtc,
                StageUpdatedAtUtc: a.StageUpdatedAtUtc
            )).ToList();

        // 4. Pending WorkSim Assessments
        var assignments = await _context.AssessmentAssignments
            .AsNoTracking()
            .Include(aa => aa.JobAssessmentConfiguration)
                .ThenInclude(jac => jac.ScenarioVersion)
                    .ThenInclude(sv => sv.SimulationScenario)
            .Include(aa => aa.Company)
            .Include(aa => aa.JobApplication)
                .ThenInclude(ja => ja.JobPosting)
            .Where(aa => aa.CandidateProfileId == profile.Id
                         && (aa.Status == AssessmentAssignmentStatus.Assigned || aa.Status == AssessmentAssignmentStatus.InProgress))
            .OrderBy(aa => aa.DeadlineUtc)
            .ToListAsync(ct);

        int pendingAssessmentsCount = assignments.Count;
        DateTimeOffset? nextDeadline = assignments.FirstOrDefault()?.DeadlineUtc;

        var pendingAssessmentDtos = assignments.Select(aa => new CandidateDashboardAssessmentDto(
            AssignmentId: aa.Id,
            JobApplicationId: aa.JobApplicationId,
            ScenarioTitle: aa.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario.Title,
            Category: aa.JobAssessmentConfiguration.ScenarioVersion.SimulationScenario.Category,
            CompanyName: aa.Company.Name,
            JobTitle: aa.JobApplication.JobPosting.Title,
            DeadlineUtc: aa.DeadlineUtc,
            Status: aa.Status,
            IsExpired: aa.DeadlineUtc < now
        )).ToList();

        // 5. Saved Jobs
        List<SavedJobSummaryDto> savedJobsList = new();
        try
        {
            savedJobsList = await _savedJobsService.GetSavedJobsAsync(userId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch saved jobs for dashboard.");
        }

        return new CandidateDashboardDto(
            CandidateProfileId: profile.Id,
            FullName: profile.User.FullName,
            ProfileCompletionPercentage: completionPercentage,
            MissingProfileFields: missingFields,
            HasPrimaryCv: primaryCv != null,
            PrimaryCvId: primaryCv?.Id,
            PrimaryCvFileName: primaryCv?.OriginalFileName,
            PrimaryCvUploadedAtUtc: primaryCv?.CreatedAtUtc,
            PrimaryCvExtractionStatus: latestExtraction?.Status,
            ExtractedSkillsCount: extractedSkillsCount,
            TotalApplications: totalApplications,
            ActiveApplications: activeApplications,
            CompletedApplications: completedApplications,
            ApplicationsByStage: applicationsByStage,
            RecentApplications: recentApplications,
            PendingAssessmentsCount: pendingAssessmentsCount,
            NextAssessmentDeadlineUtc: nextDeadline,
            PendingAssessments: pendingAssessmentDtos,
            TotalSavedJobs: savedJobsList.Count,
            SavedJobs: savedJobsList.Take(4).ToList()
        );
    }

    public async Task<ExtractedCvSuggestionsDto> GetExtractedCvSuggestionsAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await _context.CandidateProfiles
            .FirstOrDefaultAsync(cp => cp.UserId == userId, ct);

        if (profile == null)
        {
            throw new NotFoundException("Candidate profile not found for user.");
        }

        // Fetch default CV or most recent CV
        var cv = await _context.CandidateDocuments
            .Include(d => d.ExtractionJobs)
            .Where(d => d.CandidateProfileId == profile.Id && !d.IsDeleted)
            .OrderByDescending(d => d.IsDefault)
            .ThenByDescending(d => d.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (cv == null)
        {
            throw new NotFoundException("No uploaded CV documents found. Please upload a CV first.");
        }

        var latestJob = cv.ExtractionJobs
            .OrderByDescending(j => j.CreatedAtUtc)
            .FirstOrDefault();

        var skills = new List<string>();
        var education = new List<string>();
        var certs = new List<string>();
        int? estimatedExp = null;

        if (latestJob?.StructuredDataJson != null)
        {
            try
            {
                using var jsonDoc = JsonDocument.Parse(latestJob.StructuredDataJson);
                var root = jsonDoc.RootElement;

                if (root.TryGetProperty("ExtractedSkills", out var sProp) && sProp.ValueKind == JsonValueKind.Array)
                {
                    skills = sProp.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
                }

                if (root.TryGetProperty("ExtractedEducation", out var eProp) && eProp.ValueKind == JsonValueKind.Array)
                {
                    education = eProp.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
                }

                if (root.TryGetProperty("ExtractedCertifications", out var cProp) && cProp.ValueKind == JsonValueKind.Array)
                {
                    certs = cProp.EnumerateArray().Select(e => e.GetString() ?? "").Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
                }

                if (root.TryGetProperty("EstimatedYearsOfExperience", out var expProp) && expProp.ValueKind == JsonValueKind.Number)
                {
                    estimatedExp = expProp.GetInt32();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse structured JSON for document {DocumentId}", cv.Id);
            }
        }

        return new ExtractedCvSuggestionsDto(
            DocumentId: cv.Id,
            FileName: cv.OriginalFileName,
            ExtractionStatus: latestJob?.Status ?? DocumentExtractionStatus.Pending,
            ExtractedSkills: skills,
            ExtractedEducation: education,
            ExtractedCertifications: certs,
            EstimatedYearsOfExperience: estimatedExp,
            ErrorMessage: latestJob?.ErrorMessage
        );
    }
}
