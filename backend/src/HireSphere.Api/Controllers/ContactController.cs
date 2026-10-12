using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireSphere.Api.Controllers;

public record ContactMessageRequest(
    [Required, MaxLength(100)] string Name,
    [Required, EmailAddress, MaxLength(255)] string Email,
    [Required, MaxLength(150)] string Subject,
    [Required, MinLength(10), MaxLength(4000)] string Message);

public record ContactResponse(
    bool Success,
    string Message,
    DateTimeOffset ReceivedAtUtc);

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly ILogger<ContactController> _logger;

    public ContactController(ILogger<ContactController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ContactResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult SubmitContactMessage([FromBody] ContactMessageRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var sanitizedName = request.Name.Trim();
        var sanitizedEmail = request.Email.Trim().ToLowerInvariant();
        var sanitizedSubject = request.Subject.Trim();
        var sanitizedMessage = request.Message.Trim();

        _logger.LogInformation(
            "Contact inquiry received from {Name} ({Email}): {Subject}. Message length: {Length} characters.",
            sanitizedName,
            sanitizedEmail,
            sanitizedSubject,
            sanitizedMessage.Length);

        return Ok(new ContactResponse(
            Success: true,
            Message: "Thank you for reaching out. Your inquiry has been received by the HireSphere team.",
            ReceivedAtUtc: DateTimeOffset.UtcNow));
    }
}
