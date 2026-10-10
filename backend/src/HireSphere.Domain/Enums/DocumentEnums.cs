namespace HireSphere.Domain.Enums;

public enum DocumentExtractionStatus
{
    Pending = 0,
    Processing = 1,
    Success = 2,
    Failed = 3,
    ScannedPdfDetected = 4
}

public enum RequirementMatchStatus
{
    SupportedByEvidence = 0,
    PartiallySupported = 1,
    NotFound = 2,
    RequiresManualReview = 3
}
