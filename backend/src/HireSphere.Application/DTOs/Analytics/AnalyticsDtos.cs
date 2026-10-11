using HireSphere.Domain.Enums;

namespace HireSphere.Application.DTOs.Analytics;

public class DateRangeFilter
{
    public string Preset { get; set; } = "30d"; // "7d", "30d", "90d", "all", "custom"
    public DateTimeOffset? StartDateUtc { get; set; }
    public DateTimeOffset? EndDateUtc { get; set; }
}

public class CompanyRecruitmentOverviewDto
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string FilterPreset { get; set; } = "30d";
    public DateTimeOffset? StartDateUtc { get; set; }
    public DateTimeOffset? EndDateUtc { get; set; }

    // Summary Metric Cards
    public int TotalJobs { get; set; }
    public int PublishedJobs { get; set; }
    public int DraftJobs { get; set; }
    public int ClosedJobs { get; set; }

    public int TotalApplications { get; set; }
    public int ApplicationsInPeriod { get; set; }
    public int ActiveApplications { get; set; }
    public int HiredCount { get; set; }
    public int RejectedCount { get; set; }
    public int WithdrawnCount { get; set; }
    public double OverallHireRatePercentage { get; set; }

    // Visual Sections
    public RecruitmentFunnelDto Funnel { get; set; } = new();
    public List<StageDistributionItemDto> StageDistribution { get; set; } = new();
    public List<ApplicationTrendPointDto> ActivityTrend { get; set; } = new();
    public CompanyWorkSimMetricsDto WorkSimMetrics { get; set; } = new();
    public List<JobPerformanceSummaryDto> JobPerformance { get; set; } = new();
}

public class RecruitmentFunnelDto
{
    public int TotalApplications { get; set; }
    public List<FunnelStageDto> Stages { get; set; } = new();
    public List<FunnelTerminalOutcomeDto> TerminalOutcomes { get; set; } = new();
}

public class FunnelStageDto
{
    public string StageName { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public int Order { get; set; }
    public int Count { get; set; }
    public double PercentageOfTotal { get; set; }
    public double ConversionRateFromPrevious { get; set; }
    public int DropOffCount { get; set; }
}

public class FunnelTerminalOutcomeDto
{
    public string OutcomeName { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public int Count { get; set; }
    public double PercentageOfTotal { get; set; }
}

public class StageDistributionItemDto
{
    public ApplicationStage Stage { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class ApplicationTrendPointDto
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public int ApplicationsCount { get; set; }
}

public class CompanyWorkSimMetricsDto
{
    public int TotalAssigned { get; set; }
    public int CompletedCount { get; set; }
    public int InProgressCount { get; set; }
    public int PendingCount { get; set; }
    public int ExpiredCount { get; set; }
    public int CancelledCount { get; set; }
    public double CompletionRatePercentage { get; set; }
    public double? AverageCompletionMinutes { get; set; }
    public decimal? AverageScore { get; set; }
    public List<ScoreBucketDto> ScoreBuckets { get; set; } = new();
    public List<CriterionMetricDto> CriteriaPerformance { get; set; } = new();
}

public class ScoreBucketDto
{
    public string BucketLabel { get; set; } = string.Empty;
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class CriterionMetricDto
{
    public string CriterionName { get; set; } = string.Empty;
    public decimal AverageScore { get; set; }
    public decimal MaxScore { get; set; }
    public double AveragePercentage { get; set; }
}

public class JobPerformanceSummaryDto
{
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public JobPostingStatus Status { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public int TotalApplications { get; set; }
    public int ApplicationsInPeriod { get; set; }
    public int ActiveCount { get; set; }
    public int HiredCount { get; set; }
    public int RejectedCount { get; set; }
    public int WorkSimAssignedCount { get; set; }
    public int WorkSimCompletedCount { get; set; }
    public double WorkSimCompletionRate { get; set; }
}

public class JobDetailAnalyticsDto
{
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public JobPostingStatus Status { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public int TotalApplications { get; set; }
    public int ApplicationsInPeriod { get; set; }
    public int ActiveCount { get; set; }
    public int HiredCount { get; set; }
    public int RejectedCount { get; set; }
    public int WithdrawnCount { get; set; }

    public RecruitmentFunnelDto Funnel { get; set; } = new();
    public List<StageDistributionItemDto> StageDistribution { get; set; } = new();
    public List<ApplicationTrendPointDto> ActivityTrend { get; set; } = new();
    public CompanyWorkSimMetricsDto WorkSimMetrics { get; set; } = new();
}

public class PlatformAnalyticsOverviewDto
{
    public DateTimeOffset GeneratedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string FilterPreset { get; set; } = "30d";
    public DateTimeOffset? StartDateUtc { get; set; }
    public DateTimeOffset? EndDateUtc { get; set; }

    public int TotalCandidates { get; set; }
    public int TotalCompanies { get; set; }
    public int ApprovedCompanies { get; set; }
    public int PendingCompanies { get; set; }
    public int SuspendedCompanies { get; set; }

    public int TotalJobs { get; set; }
    public int PublishedJobs { get; set; }
    public int TotalApplications { get; set; }
    public int ApplicationsInPeriod { get; set; }

    public int TotalWorkSimAssignments { get; set; }
    public int TotalWorkSimCompletions { get; set; }
    public double PlatformWorkSimCompletionRate { get; set; }

    public List<ApplicationTrendPointDto> PlatformActivityTrend { get; set; } = new();
    public List<CompanyLeaderboardItemDto> ActiveCompanies { get; set; } = new();
}

public class CompanyLeaderboardItemDto
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int ActiveJobsCount { get; set; }
    public int TotalApplicationsCount { get; set; }
}
