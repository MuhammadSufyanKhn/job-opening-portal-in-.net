using System.Text;
using Microsoft.EntityFrameworkCore;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Analytics;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Application.Services;

public interface IAnalyticsService
{
    Task<CompanyRecruitmentOverviewDto> GetCompanyAnalyticsAsync(
        Guid companyId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default);

    Task<JobDetailAnalyticsDto> GetJobAnalyticsAsync(
        Guid companyId,
        Guid jobId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default);

    Task<(byte[] CsvBytes, string FileName)> ExportCompanyAnalyticsCsvAsync(
        Guid companyId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default);

    Task<PlatformAnalyticsOverviewDto> GetPlatformAnalyticsAsync(
        DateRangeFilter? filter = null,
        CancellationToken ct = default);
}

public class AnalyticsService : IAnalyticsService
{
    private readonly IApplicationDbContext _context;

    public AnalyticsService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CompanyRecruitmentOverviewDto> GetCompanyAnalyticsAsync(
        Guid companyId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default)
    {
        await EnsureUserBelongsToCompanyAsync(companyId, currentUserId, ct);

        var company = await _context.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId && !c.IsDeleted, ct)
            ?? throw new NotFoundException(nameof(Company), companyId);

        var (startUtc, endUtc, preset) = ResolveDateRange(filter);

        var overview = new CompanyRecruitmentOverviewDto
        {
            CompanyId = companyId,
            CompanyName = company.Name,
            FilterPreset = preset,
            StartDateUtc = startUtc,
            EndDateUtc = endUtc
        };

        // 1. Company Jobs Summary
        var jobs = await _context.JobPostings
            .AsNoTracking()
            .Where(j => j.CompanyId == companyId && !j.IsDeleted)
            .ToListAsync(ct);

        overview.TotalJobs = jobs.Count;
        overview.PublishedJobs = jobs.Count(j => j.Status == JobPostingStatus.Published);
        overview.DraftJobs = jobs.Count(j => j.Status == JobPostingStatus.Draft);
        overview.ClosedJobs = jobs.Count(j => j.Status == JobPostingStatus.Closed || j.Status == JobPostingStatus.Archived);

        // 2. Applications Retrieval (Company Scoped)
        var allCompanyApplications = await _context.JobApplications
            .AsNoTracking()
            .Include(a => a.JobPosting)
            .Include(a => a.StatusHistories)
            .Where(a => a.CompanyId == companyId && !a.JobPosting.IsDeleted)
            .ToListAsync(ct);

        overview.TotalApplications = allCompanyApplications.Count;

        // Apply Date Range Filter to Applications
        var periodApplications = allCompanyApplications.Where(a =>
            (!startUtc.HasValue || a.SubmittedAtUtc >= startUtc.Value) &&
            (!endUtc.HasValue || a.SubmittedAtUtc <= endUtc.Value)).ToList();

        overview.ApplicationsInPeriod = periodApplications.Count;

        // Stage Counts
        overview.ActiveApplications = periodApplications.Count(a =>
            a.CurrentStage != ApplicationStage.Hired &&
            a.CurrentStage != ApplicationStage.Rejected &&
            a.CurrentStage != ApplicationStage.Withdrawn);

        overview.HiredCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Hired);
        overview.RejectedCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Rejected);
        overview.WithdrawnCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Withdrawn);

        overview.OverallHireRatePercentage = SafePercentage(overview.HiredCount, overview.ApplicationsInPeriod);

        // 3. Current Stage Distribution
        overview.StageDistribution = CalculateStageDistribution(periodApplications);

        // 4. Recruitment Funnel (Progressive Conversion)
        overview.Funnel = CalculateRecruitmentFunnel(periodApplications);

        // 5. Activity Timeline Trend
        overview.ActivityTrend = CalculateActivityTrend(periodApplications, startUtc, endUtc);

        // 6. WorkSim Assessment Metrics (Company Scoped)
        overview.WorkSimMetrics = await CalculateWorkSimMetricsAsync(companyId, null, startUtc, endUtc, ct);

        // 7. Per-Job Performance Breakdown
        overview.JobPerformance = await CalculateJobPerformanceSummariesAsync(companyId, jobs, allCompanyApplications, startUtc, endUtc, ct);

        return overview;
    }

    public async Task<JobDetailAnalyticsDto> GetJobAnalyticsAsync(
        Guid companyId,
        Guid jobId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default)
    {
        await EnsureUserBelongsToCompanyAsync(companyId, currentUserId, ct);

        var job = await _context.JobPostings
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == companyId && !j.IsDeleted, ct)
            ?? throw new NotFoundException(nameof(JobPosting), jobId);

        var (startUtc, endUtc, _) = ResolveDateRange(filter);

        var allJobApplications = await _context.JobApplications
            .AsNoTracking()
            .Include(a => a.StatusHistories)
            .Where(a => a.JobPostingId == jobId)
            .ToListAsync(ct);

        var periodApplications = allJobApplications.Where(a =>
            (!startUtc.HasValue || a.SubmittedAtUtc >= startUtc.Value) &&
            (!endUtc.HasValue || a.SubmittedAtUtc <= endUtc.Value)).ToList();

        var dto = new JobDetailAnalyticsDto
        {
            JobId = job.Id,
            JobTitle = job.Title,
            CompanyId = companyId,
            Status = job.Status,
            PublishedAtUtc = job.PublishedAtUtc,
            TotalApplications = allJobApplications.Count,
            ApplicationsInPeriod = periodApplications.Count,
            ActiveCount = periodApplications.Count(a =>
                a.CurrentStage != ApplicationStage.Hired &&
                a.CurrentStage != ApplicationStage.Rejected &&
                a.CurrentStage != ApplicationStage.Withdrawn),
            HiredCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Hired),
            RejectedCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Rejected),
            WithdrawnCount = periodApplications.Count(a => a.CurrentStage == ApplicationStage.Withdrawn),
            StageDistribution = CalculateStageDistribution(periodApplications),
            Funnel = CalculateRecruitmentFunnel(periodApplications),
            ActivityTrend = CalculateActivityTrend(periodApplications, startUtc, endUtc),
            WorkSimMetrics = await CalculateWorkSimMetricsAsync(companyId, jobId, startUtc, endUtc, ct)
        };

        return dto;
    }

    public async Task<(byte[] CsvBytes, string FileName)> ExportCompanyAnalyticsCsvAsync(
        Guid companyId,
        Guid currentUserId,
        DateRangeFilter? filter = null,
        CancellationToken ct = default)
    {
        await EnsureUserBelongsToCompanyAsync(companyId, currentUserId, ct);

        var overview = await GetCompanyAnalyticsAsync(companyId, currentUserId, filter, ct);

        var sb = new StringBuilder();

        // 1. Overview Summary Header
        sb.AppendLine("HireSphere Recruitment Analytics Export");
        sb.AppendLine($"Company,{EscapeCsv(overview.CompanyName)}");
        sb.AppendLine($"Filter Range,{overview.FilterPreset}");
        sb.AppendLine($"Export Date (UTC),{DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Total Jobs,{overview.TotalJobs}");
        sb.AppendLine($"Published Jobs,{overview.PublishedJobs}");
        sb.AppendLine($"Total Applications,{overview.TotalApplications}");
        sb.AppendLine($"Applications In Period,{overview.ApplicationsInPeriod}");
        sb.AppendLine($"Active Candidates,{overview.ActiveApplications}");
        sb.AppendLine($"Total Hires,{overview.HiredCount}");
        sb.AppendLine($"Hire Rate,{overview.OverallHireRatePercentage:F1}%");
        sb.AppendLine($"WorkSim Assignments,{overview.WorkSimMetrics.TotalAssigned}");
        sb.AppendLine($"WorkSim Completion Rate,{overview.WorkSimMetrics.CompletionRatePercentage:F1}%");
        sb.AppendLine();

        // 2. Recruitment Funnel Breakdown
        sb.AppendLine("Recruitment Funnel Progression");
        sb.AppendLine("Stage,Display Label,Candidate Count,Share of Total,Conversion From Previous");
        foreach (var stage in overview.Funnel.Stages)
        {
            sb.AppendLine($"{EscapeCsv(stage.StageName)},{EscapeCsv(stage.DisplayLabel)},{stage.Count},{stage.PercentageOfTotal:F1}%,{stage.ConversionRateFromPrevious:F1}%");
        }
        foreach (var terminal in overview.Funnel.TerminalOutcomes)
        {
            sb.AppendLine($"{EscapeCsv(terminal.OutcomeName)},{EscapeCsv(terminal.DisplayLabel)},{terminal.Count},{terminal.PercentageOfTotal:F1}%,N/A");
        }
        sb.AppendLine();

        // 3. Job Performance Table
        sb.AppendLine("Job Vacancy Performance Breakdown");
        sb.AppendLine("Job Title,Status,Published Date (UTC),Total Applications,Applications in Period,Active Candidates,Hires,Rejections,WorkSim Assigned,WorkSim Completed,WorkSim Completion Rate");

        foreach (var job in overview.JobPerformance)
        {
            var publishedStr = job.PublishedAtUtc?.ToString("yyyy-MM-dd") ?? "Unpublished";
            sb.AppendLine(
                $"{EscapeCsv(job.JobTitle)}," +
                $"{job.Status}," +
                $"{publishedStr}," +
                $"{job.TotalApplications}," +
                $"{job.ApplicationsInPeriod}," +
                $"{job.ActiveCount}," +
                $"{job.HiredCount}," +
                $"{job.RejectedCount}," +
                $"{job.WorkSimAssignedCount}," +
                $"{job.WorkSimCompletedCount}," +
                $"{job.WorkSimCompletionRate:F1}%");
        }

        var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        var sanitizedSlug = string.Concat(overview.CompanyName.ToLowerInvariant().Where(char.IsLetterOrDigit));
        var fileName = $"hiresphere_recruitment_report_{sanitizedSlug}_{DateTime.UtcNow:yyyyMMdd}.csv";

        return (csvBytes, fileName);
    }

    public async Task<PlatformAnalyticsOverviewDto> GetPlatformAnalyticsAsync(
        DateRangeFilter? filter = null,
        CancellationToken ct = default)
    {
        var (startUtc, endUtc, preset) = ResolveDateRange(filter);

        var dto = new PlatformAnalyticsOverviewDto
        {
            FilterPreset = preset,
            StartDateUtc = startUtc,
            EndDateUtc = endUtc,
            TotalCandidates = await _context.CandidateProfiles.CountAsync(ct),
            TotalCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted, ct),
            ApprovedCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Approved, ct),
            PendingCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.PendingApproval, ct),
            SuspendedCompanies = await _context.Companies.CountAsync(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Suspended, ct),
            TotalJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted, ct),
            PublishedJobs = await _context.JobPostings.CountAsync(j => !j.IsDeleted && j.Status == JobPostingStatus.Published, ct),
            TotalApplications = await _context.JobApplications.CountAsync(ct),
            TotalWorkSimAssignments = await _context.AssessmentAssignments.CountAsync(ct),
            TotalWorkSimCompletions = await _context.AssessmentAssignments.CountAsync(a => a.Status == AssessmentAssignmentStatus.Completed, ct)
        };

        dto.PlatformWorkSimCompletionRate = SafePercentage(dto.TotalWorkSimCompletions, dto.TotalWorkSimAssignments);

        // Platform Applications in Period
        var periodApplications = await _context.JobApplications
            .AsNoTracking()
            .Where(a =>
                (!startUtc.HasValue || a.SubmittedAtUtc >= startUtc.Value) &&
                (!endUtc.HasValue || a.SubmittedAtUtc <= endUtc.Value))
            .Select(a => new { a.SubmittedAtUtc })
            .ToListAsync(ct);

        dto.ApplicationsInPeriod = periodApplications.Count;

        // Trend
        var groupedTrend = periodApplications
            .GroupBy(a => a.SubmittedAtUtc.ToString("yyyy-MM-dd"))
            .OrderBy(g => g.Key)
            .Select(g => new ApplicationTrendPointDto
            {
                Date = g.Key,
                ApplicationsCount = g.Count()
            })
            .ToList();

        dto.PlatformActivityTrend = groupedTrend;

        // Active Companies Leaderboard
        var activeCompanies = await _context.Companies
            .AsNoTracking()
            .Where(c => !c.IsDeleted && c.ApprovalStatus == CompanyApprovalStatus.Approved)
            .Select(c => new CompanyLeaderboardItemDto
            {
                CompanyId = c.Id,
                CompanyName = c.Name,
                ActiveJobsCount = c.JobPostings.Count(j => !j.IsDeleted && j.Status == JobPostingStatus.Published),
                TotalApplicationsCount = c.JobApplications.Count()
            })
            .OrderByDescending(c => c.TotalApplicationsCount)
            .Take(10)
            .ToListAsync(ct);

        dto.ActiveCompanies = activeCompanies;

        return dto;
    }

    #region Helper Calculation Methods

    private async Task EnsureUserBelongsToCompanyAsync(Guid companyId, Guid userId, CancellationToken ct)
    {
        var isMember = await _context.CompanyMembers
            .AnyAsync(m => m.CompanyId == companyId && m.UserId == userId && m.MembershipStatus == CompanyMembershipStatus.Active, ct);

        if (!isMember)
        {
            throw new ForbiddenAccessException("You are not an active member of this company organization.");
        }
    }

    private static (DateTimeOffset? StartUtc, DateTimeOffset? EndUtc, string Preset) ResolveDateRange(DateRangeFilter? filter)
    {
        var preset = filter?.Preset?.ToLowerInvariant() ?? "30d";
        var now = DateTimeOffset.UtcNow;

        return preset switch
        {
            "7d" => (now.AddDays(-7), now, "7d"),
            "30d" => (now.AddDays(-30), now, "30d"),
            "90d" => (now.AddDays(-90), now, "90d"),
            "all" => (null, null, "all"),
            "custom" => ValidateCustomDateRange(filter?.StartDateUtc, filter?.EndDateUtc),
            _ => (now.AddDays(-30), now, "30d")
        };
    }

    private static (DateTimeOffset? StartUtc, DateTimeOffset? EndUtc, string Preset) ValidateCustomDateRange(DateTimeOffset? start, DateTimeOffset? end)
    {
        if (start.HasValue && end.HasValue && start.Value > end.Value)
        {
            throw new ValidationException("Start date cannot be later than end date in custom range.");
        }

        return (start, end, "custom");
    }

    private static List<StageDistributionItemDto> CalculateStageDistribution(List<JobApplication> applications)
    {
        var total = applications.Count;
        var stages = Enum.GetValues<ApplicationStage>();

        return stages.Select(stage =>
        {
            var count = applications.Count(a => a.CurrentStage == stage);
            return new StageDistributionItemDto
            {
                Stage = stage,
                StageName = stage.ToString(),
                DisplayLabel = FormatStageLabel(stage),
                Count = count,
                Percentage = SafePercentage(count, total)
            };
        }).ToList();
    }

    private static RecruitmentFunnelDto CalculateRecruitmentFunnel(List<JobApplication> applications)
    {
        var total = applications.Count;

        // Funnel stages in natural hiring sequence:
        // 1. Applications Received (Submitted or higher)
        // 2. Under Review (or higher)
        // 3. Shortlisted (or higher)
        // 4. Assessment (Pending, Completed, or higher)
        // 5. Interview (Scheduled, Offered, Hired)
        // 6. Offered (Offered, Hired)
        // 7. Hired

        // We determine how many applications ever reached stage >= target stage
        // An application reached a stage if its CurrentStage >= target OR any history shows it reached it.
        bool EverReached(JobApplication app, int minStageRank)
        {
            var currentRank = GetStageRank(app.CurrentStage);
            if (currentRank >= minStageRank) return true;

            return app.StatusHistories.Any(h => GetStageRank(h.NewStage) >= minStageRank);
        }

        var funnelDefinitions = new[]
        {
            (Rank: 1, Name: "Applied", Label: "Applications Received"),
            (Rank: 2, Name: "UnderReview", Label: "Under Review"),
            (Rank: 3, Name: "Shortlisted", Label: "Candidates Shortlisted"),
            (Rank: 4, Name: "Assessment", Label: "WorkSim Assessments"),
            (Rank: 5, Name: "Interview", Label: "Interviews Scheduled"),
            (Rank: 6, Name: "Offered", Label: "Job Offers Extended"),
            (Rank: 7, Name: "Hired", Label: "Candidates Hired")
        };

        var funnelStages = new List<FunnelStageDto>();
        int previousCount = total;

        for (int i = 0; i < funnelDefinitions.Length; i++)
        {
            var def = funnelDefinitions[i];
            int count = i == 0 ? total : applications.Count(a => EverReached(a, def.Rank));

            double conversionFromPrevious = i == 0 ? (total > 0 ? 100.0 : 0.0) : SafePercentage(count, previousCount);
            int dropOff = i == 0 ? 0 : Math.Max(0, previousCount - count);

            funnelStages.Add(new FunnelStageDto
            {
                StageName = def.Name,
                DisplayLabel = def.Label,
                Order = i + 1,
                Count = count,
                PercentageOfTotal = SafePercentage(count, total),
                ConversionRateFromPrevious = conversionFromPrevious,
                DropOffCount = dropOff
            });

            previousCount = count;
        }

        var terminalOutcomes = new List<FunnelTerminalOutcomeDto>
        {
            new()
            {
                OutcomeName = "Rejected",
                DisplayLabel = "Rejected Candidates",
                Count = applications.Count(a => a.CurrentStage == ApplicationStage.Rejected),
                PercentageOfTotal = SafePercentage(applications.Count(a => a.CurrentStage == ApplicationStage.Rejected), total)
            },
            new()
            {
                OutcomeName = "Withdrawn",
                DisplayLabel = "Withdrawn by Candidate",
                Count = applications.Count(a => a.CurrentStage == ApplicationStage.Withdrawn),
                PercentageOfTotal = SafePercentage(applications.Count(a => a.CurrentStage == ApplicationStage.Withdrawn), total)
            }
        };

        return new RecruitmentFunnelDto
        {
            TotalApplications = total,
            Stages = funnelStages,
            TerminalOutcomes = terminalOutcomes
        };
    }

    private static int GetStageRank(ApplicationStage stage) => stage switch
    {
        ApplicationStage.Submitted => 1,
        ApplicationStage.UnderReview => 2,
        ApplicationStage.Shortlisted => 3,
        ApplicationStage.AssessmentPending => 4,
        ApplicationStage.AssessmentCompleted => 4,
        ApplicationStage.InterviewScheduled => 5,
        ApplicationStage.Offered => 6,
        ApplicationStage.Hired => 7,
        _ => 0 // Rejected, Withdrawn
    };

    private static string FormatStageLabel(ApplicationStage stage) => stage switch
    {
        ApplicationStage.Submitted => "Submitted",
        ApplicationStage.UnderReview => "Under Review",
        ApplicationStage.Shortlisted => "Shortlisted",
        ApplicationStage.AssessmentPending => "Assessment Pending",
        ApplicationStage.AssessmentCompleted => "Assessment Completed",
        ApplicationStage.InterviewScheduled => "Interview Scheduled",
        ApplicationStage.Offered => "Job Offered",
        ApplicationStage.Hired => "Hired",
        ApplicationStage.Rejected => "Rejected",
        ApplicationStage.Withdrawn => "Withdrawn",
        _ => stage.ToString()
    };

    private static List<ApplicationTrendPointDto> CalculateActivityTrend(
        List<JobApplication> applications,
        DateTimeOffset? startUtc,
        DateTimeOffset? endUtc)
    {
        return applications
            .GroupBy(a => a.SubmittedAtUtc.ToString("yyyy-MM-dd"))
            .OrderBy(g => g.Key)
            .Select(g => new ApplicationTrendPointDto
            {
                Date = g.Key,
                ApplicationsCount = g.Count()
            })
            .ToList();
    }

    private async Task<CompanyWorkSimMetricsDto> CalculateWorkSimMetricsAsync(
        Guid companyId,
        Guid? jobId,
        DateTimeOffset? startUtc,
        DateTimeOffset? endUtc,
        CancellationToken ct)
    {
        var query = _context.AssessmentAssignments
            .AsNoTracking()
            .Include(a => a.JobApplication)
            .Include(a => a.Sessions)
                .ThenInclude(s => s.AssessmentResult)
                    .ThenInclude(r => r!.CriterionScores)
            .Where(a => a.CompanyId == companyId);

        if (jobId.HasValue)
        {
            query = query.Where(a => a.JobApplication.JobPostingId == jobId.Value);
        }

        if (startUtc.HasValue)
        {
            query = query.Where(a => a.AssignedAtUtc >= startUtc.Value);
        }

        if (endUtc.HasValue)
        {
            query = query.Where(a => a.AssignedAtUtc <= endUtc.Value);
        }

        var assignments = await query.ToListAsync(ct);

        var metrics = new CompanyWorkSimMetricsDto
        {
            TotalAssigned = assignments.Count,
            CompletedCount = assignments.Count(a => a.Status == AssessmentAssignmentStatus.Completed),
            InProgressCount = assignments.Count(a => a.Status == AssessmentAssignmentStatus.InProgress),
            PendingCount = assignments.Count(a => a.Status == AssessmentAssignmentStatus.Assigned),
            ExpiredCount = assignments.Count(a => a.Status == AssessmentAssignmentStatus.Expired),
            CancelledCount = assignments.Count(a => a.Status == AssessmentAssignmentStatus.Cancelled)
        };

        metrics.CompletionRatePercentage = SafePercentage(metrics.CompletedCount, metrics.TotalAssigned);

        // Average Completion Time (in minutes)
        var completedWithDuration = assignments
            .Where(a => a.Status == AssessmentAssignmentStatus.Completed && a.CompletedAtUtc.HasValue)
            .Select(a => (a.CompletedAtUtc!.Value - a.AssignedAtUtc).TotalMinutes)
            .Where(mins => mins > 0 && mins < 10080) // filter out outliers > 7 days
            .ToList();

        if (completedWithDuration.Count > 0)
        {
            metrics.AverageCompletionMinutes = Math.Round(completedWithDuration.Average(), 1);
        }

        // Collect Assessment Results
        var results = assignments
            .SelectMany(a => a.Sessions)
            .Where(s => s.AssessmentResult != null)
            .Select(s => s.AssessmentResult!)
            .ToList();

        if (results.Count > 0)
        {
            metrics.AverageScore = Math.Round(results.Average(r => r.TotalScore), 1);

            // Score Distribution Buckets: [0-50], [51-70], [71-85], [86-100]
            var bucketDefinitions = new (string Label, decimal Min, decimal Max)[]
            {
                ("Foundational (0-50)", 0m, 50m),
                ("Developing (51-70)", 50.01m, 70m),
                ("Proficient (71-85)", 70.01m, 85m),
                ("Advanced (86-100)", 85.01m, 100m)
            };

            metrics.ScoreBuckets = bucketDefinitions.Select(b =>
            {
                var count = results.Count(r => r.TotalScore >= b.Min && r.TotalScore <= b.Max);
                return new ScoreBucketDto
                {
                    BucketLabel = b.Label,
                    MinScore = b.Min,
                    MaxScore = b.Max,
                    Count = count,
                    Percentage = SafePercentage(count, results.Count)
                };
            }).ToList();

            // Rubric Criteria Performance
            var allCriteriaScores = results
                .SelectMany(r => r.CriterionScores)
                .GroupBy(c => c.CriterionName)
                .Select(g =>
                {
                    var avgScore = g.Average(c => c.Score);
                    var maxScore = g.Max(c => c.MaxScore);
                    if (maxScore <= 0) maxScore = 100m;
                    return new CriterionMetricDto
                    {
                        CriterionName = g.Key,
                        AverageScore = Math.Round(avgScore, 1),
                        MaxScore = maxScore,
                        AveragePercentage = SafePercentage((double)avgScore, (double)maxScore)
                    };
                })
                .OrderByDescending(c => c.AveragePercentage)
                .ToList();

            metrics.CriteriaPerformance = allCriteriaScores;
        }

        return metrics;
    }

    private async Task<List<JobPerformanceSummaryDto>> CalculateJobPerformanceSummariesAsync(
        Guid companyId,
        List<JobPosting> jobs,
        List<JobApplication> allCompanyApplications,
        DateTimeOffset? startUtc,
        DateTimeOffset? endUtc,
        CancellationToken ct)
    {
        // Pre-fetch WorkSim counts per JobId
        var jobAssessmentCounts = await _context.AssessmentAssignments
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId)
            .GroupBy(a => a.JobApplication.JobPostingId)
            .Select(g => new
            {
                JobId = g.Key,
                Assigned = g.Count(),
                Completed = g.Count(a => a.Status == AssessmentAssignmentStatus.Completed)
            })
            .ToListAsync(ct);

        var assessmentDict = jobAssessmentCounts.ToDictionary(a => a.JobId, a => a);

        var list = new List<JobPerformanceSummaryDto>();

        foreach (var job in jobs.OrderByDescending(j => j.CreatedAtUtc))
        {
            var jobApps = allCompanyApplications.Where(a => a.JobPostingId == job.Id).ToList();
            var periodApps = jobApps.Where(a =>
                (!startUtc.HasValue || a.SubmittedAtUtc >= startUtc.Value) &&
                (!endUtc.HasValue || a.SubmittedAtUtc <= endUtc.Value)).ToList();

            assessmentDict.TryGetValue(job.Id, out var assessmentStats);

            int assigned = assessmentStats?.Assigned ?? 0;
            int completed = assessmentStats?.Completed ?? 0;

            list.Add(new JobPerformanceSummaryDto
            {
                JobId = job.Id,
                JobTitle = job.Title,
                Status = job.Status,
                PublishedAtUtc = job.PublishedAtUtc,
                TotalApplications = jobApps.Count,
                ApplicationsInPeriod = periodApps.Count,
                ActiveCount = periodApps.Count(a =>
                    a.CurrentStage != ApplicationStage.Hired &&
                    a.CurrentStage != ApplicationStage.Rejected &&
                    a.CurrentStage != ApplicationStage.Withdrawn),
                HiredCount = periodApps.Count(a => a.CurrentStage == ApplicationStage.Hired),
                RejectedCount = periodApps.Count(a => a.CurrentStage == ApplicationStage.Rejected),
                WorkSimAssignedCount = assigned,
                WorkSimCompletedCount = completed,
                WorkSimCompletionRate = SafePercentage(completed, assigned)
            });
        }

        return list;
    }

    private static double SafePercentage(double numerator, double denominator)
    {
        if (denominator <= 0.0) return 0.0;
        return Math.Round((numerator / denominator) * 100.0, 1);
    }

    private static string EscapeCsv(string? field)
    {
        if (string.IsNullOrEmpty(field)) return "\"\"";

        var sanitized = field;

        // Formula injection protection: prepend apostrophe if leading character is dangerous
        if (sanitized.StartsWith('=') || sanitized.StartsWith('+') || sanitized.StartsWith('-') || sanitized.StartsWith('@'))
        {
            sanitized = "'" + sanitized;
        }

        if (sanitized.Contains(',') || sanitized.Contains('"') || sanitized.Contains('\n') || sanitized.Contains('\r'))
        {
            sanitized = "\"" + sanitized.Replace("\"", "\"\"") + "\"";
        }

        return sanitized;
    }

    #endregion
}
