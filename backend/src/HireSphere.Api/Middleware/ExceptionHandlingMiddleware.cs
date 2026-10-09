using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using HireSphere.Domain.Exceptions;

namespace HireSphere.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case NotFoundException notFound:
                statusCode = HttpStatusCode.NotFound;
                problemDetails.Title = "Resource Not Found";
                problemDetails.Detail = notFound.Message;
                problemDetails.Status = (int)statusCode;
                break;

            case ConflictException conflict:
                statusCode = HttpStatusCode.Conflict;
                problemDetails.Title = "Conflict";
                problemDetails.Detail = conflict.Message;
                problemDetails.Status = (int)statusCode;
                break;

            case ForbiddenAccessException forbidden:
                statusCode = HttpStatusCode.Forbidden;
                problemDetails.Title = "Forbidden";
                problemDetails.Detail = forbidden.Message;
                problemDetails.Status = (int)statusCode;
                break;

            case UnauthorizedException unauthorized:
                statusCode = HttpStatusCode.Unauthorized;
                problemDetails.Title = "Unauthorized";
                problemDetails.Detail = unauthorized.Message;
                problemDetails.Status = (int)statusCode;
                break;

            case AccountLockedException locked:
                statusCode = HttpStatusCode.Forbidden;
                problemDetails.Title = "Account Inactive";
                problemDetails.Detail = locked.Message;
                problemDetails.Status = (int)statusCode;
                break;

            case FluentValidation.ValidationException validationEx:
                statusCode = HttpStatusCode.BadRequest;
                problemDetails.Title = "Validation Failed";
                problemDetails.Detail = "One or more validation errors occurred.";
                problemDetails.Status = (int)statusCode;
                problemDetails.Extensions["errors"] = validationEx.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
                break;

            case ArgumentException argEx:
                statusCode = HttpStatusCode.BadRequest;
                problemDetails.Title = "Bad Request";
                problemDetails.Detail = argEx.Message;
                problemDetails.Status = (int)statusCode;
                break;

            default:
                _logger.LogError(exception, "Unhandled system exception occurred: {Message}", exception.Message);
                statusCode = HttpStatusCode.InternalServerError;
                problemDetails.Title = "Server Error";
                problemDetails.Detail = "An unexpected error occurred. Please contact support.";
                problemDetails.Status = (int)statusCode;
                break;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(problemDetails);
        await context.Response.WriteAsync(json);
    }
}
