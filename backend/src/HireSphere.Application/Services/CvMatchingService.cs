using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HireSphere.Domain.Exceptions;
using HireSphere.Application.Common.Interfaces;
using HireSphere.Application.DTOs.Document;
using HireSphere.Domain.Entities;
using HireSphere.Domain.Enums;

namespace HireSphere.Application.Services;

public interface ICvMatchingService
{
    Task<CvMatchReportDto> GetMatchReportForApplicationAsync(Guid companyId, Guid applicationId, Guid? currentUserId = null, CancellationToken cancellationToken = default);
    Task<CvMatchReportDto> RecalculateMatchReportAsync(Guid companyId, Guid applicationId, Guid? currentUserId = null, CancellationToken cancellationToken = default);
}

public class CvMatchingService : ICvMatchingService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CvMatchingService> _logger;

    public const string CurrentEngineVersion = "1.0-deterministic";

    // Technical term synonyms / normalization aliases
    private static readonly Dictionary<string, List<string>> SynonymGroups = new(StringComparer.OrdinalIgnoreCase)
    {
        { "c#", ["c#", "c-sharp", "csharp", "c sharp"] },
        { ".net", [".net", "dotnet", "dot net", ".net core", "netcore", ".net framework"] },
        { "asp.net core", ["asp.net core", "asp.net", "aspnetcore", "asp net core", "aspnet"] },
        { "react", ["react", "react.js", "reactjs"] },
        { "typescript", ["typescript", "ts"] },
        { "javascript", ["javascript", "js", "ecmascript"] },
        { "sql server", ["sql server", "mssql", "ms sql", "t-sql", "tsql"] },
        { "postgresql", ["postgresql", "postgres", "psql"] },
        { "entity framework", ["entity framework", "ef core", "efcore", "entityframework"] },
        { "docker", ["docker", "container", "containers", "containerization"] },
        { "kubernetes", ["kubernetes", "k8s"] },
        { "azure", ["azure", "microsoft azure"] },
        { "aws", ["aws", "amazon web services"] },
        { "rest api", ["rest api", "restful", "restful api", "rest apis", "web api"] },
        { "xunit", ["xunit", "nunit", "unit testing", "unit tests"] },
        { "git", ["git", "github", "gitlab", "version control"] },
        { "ci/cd", ["ci/cd", "continuous integration", "github actions", "azure devops", "jenkins"] },
        { "microservices", ["microservices", "micro-services", "distributed systems"] },
        { "clean architecture", ["clean architecture", "onion architecture", "hexagonal architecture", "ddd", "domain-driven design"] }
    };

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
        "as", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
        "will", "would", "shall", "should", "may", "might", "must", "can", "could",
        "experience", "experienced", "hands-on", "proven", "strong", "solid", "good", "excellent",
        "knowledge", "skills", "skill", "proficient", "proficiency", "understanding", "familiar", "familiarity",
        "ability", "able", "working", "work", "years", "year", "plus", "minimum", "required", "preferred"
    };

    public CvMatchingService(IApplicationDbContext context, ILogger<CvMatchingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CvMatchReportDto> GetMatchReportForApplicationAsync(Guid companyId, Guid applicationId, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        // Enforce company membership check when caller identity is provided
        if (currentUserId.HasValue)
        {
            var isMember = await _context.CompanyMembers
                .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == currentUserId.Value && cm.MembershipStatus == CompanyMembershipStatus.Active, cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenAccessException("You are not an active member of this company.");
            }
        }

        // Tenant security check
        var application = await _context.JobApplications
            .AsNoTracking()
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile).ThenInclude(p => p.User)
            .Include(a => a.CandidateDocument)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, cancellationToken)
            ?? throw new NotFoundException("Application not found or unauthorized company access.");

        // Check for existing report
        var existingReport = await _context.CvMatchReports
            .AsNoTracking()
            .Include(r => r.Evaluations).ThenInclude(e => e.JobRequirement)
            .FirstOrDefaultAsync(r => r.JobApplicationId == applicationId, cancellationToken);

        if (existingReport != null)
        {
            return MapToDto(existingReport, application.JobPosting.Title, application.CandidateProfile.User.FullName);
        }

        // Generate new report if eligible
        return await GenerateMatchReportAsync(application, cancellationToken);
    }

    public async Task<CvMatchReportDto> RecalculateMatchReportAsync(Guid companyId, Guid applicationId, Guid? currentUserId = null, CancellationToken cancellationToken = default)
    {
        // Enforce company membership check when caller identity is provided
        if (currentUserId.HasValue)
        {
            var isMember = await _context.CompanyMembers
                .AnyAsync(cm => cm.CompanyId == companyId && cm.UserId == currentUserId.Value && cm.MembershipStatus == CompanyMembershipStatus.Active, cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenAccessException("You are not an active member of this company.");
            }
        }

        var application = await _context.JobApplications
            .Include(a => a.JobPosting)
            .Include(a => a.CandidateProfile).ThenInclude(p => p.User)
            .Include(a => a.CandidateDocument)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.CompanyId == companyId, cancellationToken)
            ?? throw new NotFoundException("Application not found or unauthorized company access.");

        // Remove old report if exists
        var existingReport = await _context.CvMatchReports
            .Include(r => r.Evaluations)
            .FirstOrDefaultAsync(r => r.JobApplicationId == applicationId, cancellationToken);

        if (existingReport != null)
        {
            _context.CvRequirementEvaluations.RemoveRange(existingReport.Evaluations);
            _context.CvMatchReports.Remove(existingReport);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return await GenerateMatchReportAsync(application, cancellationToken);
    }

    private async Task<CvMatchReportDto> GenerateMatchReportAsync(JobApplication application, CancellationToken cancellationToken)
    {
        if (application.CandidateDocumentId == null)
        {
            throw new ValidationException("Cannot calculate match report: application does not have an attached CV document.");
        }

        // Fetch document and extraction job
        var extractionJob = await _context.DocumentExtractionJobs
            .AsNoTracking()
            .Where(j => j.CandidateDocumentId == application.CandidateDocumentId)
            .OrderByDescending(j => j.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (extractionJob == null || extractionJob.Status == DocumentExtractionStatus.Pending || extractionJob.Status == DocumentExtractionStatus.Processing)
        {
            throw new ValidationException("CV document text extraction is still in progress. Please retry once processing completes.");
        }

        if (extractionJob.Status == DocumentExtractionStatus.Failed)
        {
            throw new ValidationException($"CV document text extraction failed ({extractionJob.ErrorMessage}). Match report cannot be computed.");
        }

        // Load structured job requirements
        var requirements = await _context.JobRequirements
            .AsNoTracking()
            .Where(r => r.JobPostingId == application.JobPostingId)
            .OrderBy(r => r.DisplayOrder)
            .ToListAsync(cancellationToken);

        if (requirements.Count == 0)
        {
            throw new ValidationException("Vacancy does not have any structured requirements defined.");
        }

        var isScannedPdf = extractionJob.Status == DocumentExtractionStatus.ScannedPdfDetected;
        var cvText = extractionJob.ExtractedText ?? string.Empty;

        // Parse structured qualifications if available
        ExtractedCvData? structuredData = null;
        if (!string.IsNullOrEmpty(extractionJob.StructuredDataJson))
        {
            try
            {
                structuredData = JsonSerializer.Deserialize<ExtractedCvData>(extractionJob.StructuredDataJson);
            }
            catch { }
        }

        var report = new CvMatchReport
        {
            Id = Guid.NewGuid(),
            JobApplicationId = application.Id,
            JobDescriptionVersionId = application.JobDescriptionVersionId,
            DocumentExtractionJobId = extractionJob.Id,
            EngineVersion = CurrentEngineVersion,
            CalculatedAtUtc = DateTimeOffset.UtcNow
        };

        var evaluations = new List<CvRequirementEvaluation>();
        decimal totalPossibleWeight = 0;
        decimal earnedWeight = 0;

        foreach (var req in requirements)
        {
            // Weighting: Mandatory = 2.0, Preferred = 1.0
            decimal weightMultiplier = (req.RequirementType == RequirementType.Mandatory) ? 2.0m : 1.0m;
            totalPossibleWeight += weightMultiplier;

            var evaluation = EvaluateRequirement(req, cvText, structuredData, isScannedPdf, report.Id);
            evaluations.Add(evaluation);

            // Calculate contribution
            decimal statusMultiplier = evaluation.Status switch
            {
                RequirementMatchStatus.SupportedByEvidence => 1.0m,
                RequirementMatchStatus.PartiallySupported => 0.5m,
                RequirementMatchStatus.RequiresManualReview => 0.25m,
                _ => 0.0m
            };

            earnedWeight += (statusMultiplier * weightMultiplier);
        }

        decimal evidenceIndex = totalPossibleWeight > 0
            ? Math.Round((earnedWeight / totalPossibleWeight) * 100m, 2)
            : 0m;

        report.OverallEvidenceIndex = evidenceIndex;

        // Construct calculation summary narrative
        var summarySb = new StringBuilder();
        summarySb.AppendLine($"Deterministic Evidence Index: {evidenceIndex:F2}% (Algorithm v{CurrentEngineVersion}).");
        summarySb.AppendLine($"Evaluated {requirements.Count} structured requirements ({requirements.Count(r => r.RequirementType == RequirementType.Mandatory)} Mandatory weighted 2x, {requirements.Count(r => r.RequirementType == RequirementType.Preferred)} Preferred weighted 1x).");
        summarySb.AppendLine($"Results: {evaluations.Count(e => e.Status == RequirementMatchStatus.SupportedByEvidence)} Supported, {evaluations.Count(e => e.Status == RequirementMatchStatus.PartiallySupported)} Partially Supported, {evaluations.Count(e => e.Status == RequirementMatchStatus.NotFound)} Not Found in text, {evaluations.Count(e => e.Status == RequirementMatchStatus.RequiresManualReview)} Needs Review.");
        
        if (isScannedPdf)
        {
            summarySb.AppendLine("NOTE: Document was detected as an image/scanned PDF without OCR text. Manual review is recommended for all qualifications.");
        }

        report.CalculationSummary = summarySb.ToString();

        _context.CvMatchReports.Add(report);
        foreach (var ev in evaluations)
        {
            _context.CvRequirementEvaluations.Add(ev);
        }

        await _context.SaveChangesAsync(cancellationToken);

        report.Evaluations = evaluations;
        return MapToDto(report, application.JobPosting.Title, application.CandidateProfile.User.FullName);
    }

    private CvRequirementEvaluation EvaluateRequirement(
        JobRequirement req,
        string cvText,
        ExtractedCvData? structuredData,
        bool isScannedPdf,
        Guid reportId)
    {
        if (isScannedPdf || string.IsNullOrWhiteSpace(cvText))
        {
            return new CvRequirementEvaluation
            {
                Id = Guid.NewGuid(),
                CvMatchReportId = reportId,
                JobRequirementId = req.Id,
                Status = RequirementMatchStatus.RequiresManualReview,
                ConfidenceLevel = 20.00m,
                ExtractedExcerpt = null,
                ReviewerNote = "CV appears to be a scanned image or lacks readable text. Recruiter manual verification required.",
                EvaluatedAtUtc = DateTimeOffset.UtcNow
            };
        }

        var reqTokens = TokenizeAndNormalize(req.RequirementText);
        var matchingSynonyms = FindMatchingSynonyms(req.RequirementText, reqTokens);

        // Search text for sentence-level evidence
        var (foundMatch, excerpt, isPartial) = SearchEvidenceInText(cvText, reqTokens, matchingSynonyms);

        if (foundMatch && !isPartial)
        {
            return new CvRequirementEvaluation
            {
                Id = Guid.NewGuid(),
                CvMatchReportId = reportId,
                JobRequirementId = req.Id,
                Status = RequirementMatchStatus.SupportedByEvidence,
                ConfidenceLevel = 92.00m,
                ExtractedExcerpt = excerpt,
                ReviewerNote = $"Direct evidence identified matching qualification keywords: {string.Join(", ", reqTokens.Take(3))}",
                EvaluatedAtUtc = DateTimeOffset.UtcNow
            };
        }

        if (foundMatch && isPartial)
        {
            return new CvRequirementEvaluation
            {
                Id = Guid.NewGuid(),
                CvMatchReportId = reportId,
                JobRequirementId = req.Id,
                Status = RequirementMatchStatus.PartiallySupported,
                ConfidenceLevel = 60.00m,
                ExtractedExcerpt = excerpt,
                ReviewerNote = "Partial keyword presence identified in text; context may require reviewer verification.",
                EvaluatedAtUtc = DateTimeOffset.UtcNow
            };
        }

        // Check structured skills list as secondary confirmation
        if (structuredData != null && reqTokens.Any(t => structuredData.ExtractedSkills.Any(s => s.Equals(t, StringComparison.OrdinalIgnoreCase))))
        {
            var matchedSkill = structuredData.ExtractedSkills.First(s => reqTokens.Any(t => t.Equals(s, StringComparison.OrdinalIgnoreCase)));
            return new CvRequirementEvaluation
            {
                Id = Guid.NewGuid(),
                CvMatchReportId = reportId,
                JobRequirementId = req.Id,
                Status = RequirementMatchStatus.SupportedByEvidence,
                ConfidenceLevel = 85.00m,
                ExtractedExcerpt = $"Identified in candidate skills inventory: {matchedSkill}",
                ReviewerNote = $"Verified matching technical term '{matchedSkill}' in candidate skill profile.",
                EvaluatedAtUtc = DateTimeOffset.UtcNow
            };
        }

        // Not found
        return new CvRequirementEvaluation
        {
            Id = Guid.NewGuid(),
            CvMatchReportId = reportId,
            JobRequirementId = req.Id,
            Status = RequirementMatchStatus.NotFound,
            ConfidenceLevel = 0.00m,
            ExtractedExcerpt = null,
            ReviewerNote = "No explicit matching evidence identified in processed document text. Note: indicates absence of text evidence, not that candidate lacks this qualification.",
            EvaluatedAtUtc = DateTimeOffset.UtcNow
        };
    }

    private static (bool Found, string? Excerpt, bool IsPartial) SearchEvidenceInText(
        string cvText,
        List<string> requirementTokens,
        List<string> synonyms)
    {
        var allTerms = requirementTokens.Concat(synonyms).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (allTerms.Count == 0) return (false, null, false);

        var sentences = cvText.Split(new[] { ".", "\n", "\r", ";" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .Where(s => s.Length > 15)
            .ToList();

        // Pass 1: Sentence matching multiple terms OR recognized technical synonyms
        foreach (var sentence in sentences)
        {
            int matches = 0;
            foreach (var term in allTerms)
            {
                if (ContainsWord(sentence, term))
                {
                    matches++;
                }
            }

            bool hasStrongSkillMatch = synonyms.Count > 0 && synonyms.Any(s => ContainsWord(sentence, s));

            if (matches >= 2 || hasStrongSkillMatch || (allTerms.Count == 1 && matches == 1))
            {
                return (true, CleanExcerpt(sentence), false);
            }
        }

        // Pass 2: Sentence matching at least one non-trivial term (Partial)
        foreach (var sentence in sentences)
        {
            foreach (var term in allTerms)
            {
                if (term.Length >= 3 && ContainsWord(sentence, term))
                {
                    return (true, CleanExcerpt(sentence), true);
                }
            }
        }

        return (false, null, false);
    }

    private static bool ContainsWord(string text, string word)
    {
        var escaped = Regex.Escape(word);
        var pattern = $@"(?<![\w#+]){escaped}(?![\w#+])";
        return Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase);
    }

    private static string CleanExcerpt(string text)
    {
        var clean = Regex.Replace(text.Trim(), @"\s+", " ");
        return clean.Length > 250 ? clean[..247] + "..." : clean;
    }

    private static List<string> TokenizeAndNormalize(string requirementText)
    {
        var words = Regex.Split(requirementText, @"[^\w#+\.]+")
            .Where(w => !string.IsNullOrWhiteSpace(w) && w.Length >= 2)
            .Select(w => w.ToLowerInvariant())
            .Where(w => !StopWords.Contains(w))
            .ToList();

        return words;
    }

    private static List<string> FindMatchingSynonyms(string requirementText, List<string> tokens)
    {
        var results = new List<string>();

        // Check if any alias or canonical term appears in requirement text
        foreach (var (canonical, aliases) in SynonymGroups)
        {
            if (aliases.Any(a => ContainsWord(requirementText, a)))
            {
                results.AddRange(aliases);
            }
        }

        // Also check individual tokens
        foreach (var token in tokens)
        {
            foreach (var (canonical, aliases) in SynonymGroups)
            {
                if (aliases.Any(a => a.Equals(token, StringComparison.OrdinalIgnoreCase)))
                {
                    results.AddRange(aliases);
                }
            }
        }
        return results.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static CvMatchReportDto MapToDto(CvMatchReport report, string jobTitle, string candidateName)
    {
        var evaluationsDto = report.Evaluations.Select(e => new CvRequirementEvaluationDto(
            e.Id,
            e.JobRequirementId,
            e.JobRequirement?.RequirementText ?? "Structured Requirement",
            e.JobRequirement?.RequirementCategory ?? RequirementCategory.Skill,
            e.JobRequirement?.RequirementType ?? RequirementType.Mandatory,
            e.ReviewerOverriddenStatus ?? e.Status,
            e.ConfidenceLevel,
            e.ExtractedExcerpt,
            e.ReviewerNote,
            e.ReviewerOverriddenStatus)).ToList();

        var total = evaluationsDto.Count;
        var supported = evaluationsDto.Count(e => e.Status == RequirementMatchStatus.SupportedByEvidence);
        var partial = evaluationsDto.Count(e => e.Status == RequirementMatchStatus.PartiallySupported);
        var notFound = evaluationsDto.Count(e => e.Status == RequirementMatchStatus.NotFound);
        var review = evaluationsDto.Count(e => e.Status == RequirementMatchStatus.RequiresManualReview);
        var mandatoryTotal = evaluationsDto.Count(e => e.RequirementType == RequirementType.Mandatory);
        var mandatoryFulfilled = evaluationsDto.Count(e => e.RequirementType == RequirementType.Mandatory && (e.Status == RequirementMatchStatus.SupportedByEvidence || e.Status == RequirementMatchStatus.PartiallySupported));

        var summary = new CvMatchSummaryDto(
            total,
            supported,
            partial,
            notFound,
            review,
            mandatoryTotal,
            mandatoryFulfilled);

        return new CvMatchReportDto(
            report.Id,
            report.JobApplicationId,
            jobTitle,
            candidateName,
            report.OverallEvidenceIndex,
            report.EngineVersion,
            report.CalculationSummary,
            report.CalculatedAtUtc,
            evaluationsDto,
            summary);
    }
}
