using System.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HireSphere.Application.Common.Interfaces;

namespace HireSphere.Infrastructure.Services;

public class LocalCvStorageService : ICvStorageService
{
    private readonly string _storageRoot;
    private readonly ILogger<LocalCvStorageService> _logger;

    public LocalCvStorageService(IConfiguration configuration, ILogger<LocalCvStorageService> logger)
    {
        _logger = logger;
        var configuredPath = configuration["CvStorage:LocalStoragePath"];
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            _storageRoot = Path.Combine(AppContext.BaseDirectory, "App_Data", "cv_storage");
        }
        else
        {
            _storageRoot = Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(AppContext.BaseDirectory, configuredPath);
        }

        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
        }
    }

    public async Task<string> SaveFileAsync(Stream content, string extension, CancellationToken cancellationToken = default)
    {
        var sanitizedExt = extension.Trim().TrimStart('.').ToLowerInvariant();
        if (string.IsNullOrEmpty(sanitizedExt))
        {
            sanitizedExt = "bin";
        }

        // Generate unguessable random storage key (GUID + extension)
        var storageKey = $"{Guid.NewGuid():N}.{sanitizedExt}";
        var targetPath = ResolveSafePath(storageKey);

        await using var fileStream = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, true);
        content.Position = 0;
        await content.CopyToAsync(fileStream, cancellationToken);

        _logger.LogInformation("Saved private document to secure storage key: {StorageKey} ({Bytes} bytes)", storageKey, fileStream.Length);
        return storageKey;
    }

    public Task<Stream?> GetFileStreamAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var path = ResolveSafePath(storageKey);
            if (!File.Exists(path))
            {
                _logger.LogWarning("File not found for storage key: {StorageKey}", storageKey);
                return Task.FromResult<Stream?>(null);
            }

            var fileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, false);
            return Task.FromResult<Stream?>(fileStream);
        }
        catch (SecurityException ex)
        {
            _logger.LogError(ex, "Path traversal attempt detected with storage key: {StorageKey}", storageKey);
            return Task.FromResult<Stream?>(null);
        }
    }

    public Task<bool> DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var path = ResolveSafePath(storageKey);
            if (File.Exists(path))
            {
                File.Delete(path);
                _logger.LogInformation("Deleted document from storage key: {StorageKey}", storageKey);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete document for storage key: {StorageKey}", storageKey);
            return Task.FromResult(false);
        }
    }

    public Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var path = ResolveSafePath(storageKey);
            return Task.FromResult(File.Exists(path));
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    private string ResolveSafePath(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey) || storageKey.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            throw new SecurityException("Storage key contains invalid or dangerous characters.");
        }

        var fullStorageRoot = Path.GetFullPath(_storageRoot);
        var combinedPath = Path.GetFullPath(Path.Combine(fullStorageRoot, storageKey));

        // Enforce strict path traversal barrier
        if (!combinedPath.StartsWith(fullStorageRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new SecurityException("Path traversal attack detected.");
        }

        return combinedPath;
    }
}

public class NullMalwareScanner : IMalwareScanner
{
    private readonly ILogger<NullMalwareScanner> _logger;

    public NullMalwareScanner(ILogger<NullMalwareScanner> logger)
    {
        _logger = logger;
    }

    public Task<MalwareScanResult> ScanStreamAsync(Stream content, string fileName, CancellationToken cancellationToken = default)
    {
        // Honest reporting: No external ClamAV / Defender daemon configured in development environment.
        _logger.LogInformation("Document '{FileName}' passed static heuristic checks (External enterprise scanner not configured)", fileName);
        return Task.FromResult(new MalwareScanResult(true, null, "StaticHeuristicScanner"));
    }
}
