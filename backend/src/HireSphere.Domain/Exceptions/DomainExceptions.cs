namespace HireSphere.Domain.Exceptions;

public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}

public class NotFoundException : DomainException
{
    public NotFoundException(string message)
        : base(message) { }

    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} with identifier '{key}' was not found.") { }
}

public class ValidationException : DomainException
{
    public ValidationException(string message) : base(message) { }
}

public class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }
}

public class ForbiddenAccessException : DomainException
{
    public ForbiddenAccessException(string message = "You do not have permission to access this resource.")
        : base(message) { }
}

public class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message = "Authentication failed or token is invalid.")
        : base(message) { }
}

public class AccountLockedException : DomainException
{
    public AccountLockedException(string message = "Account is disabled or pending verification.")
        : base(message) { }
}
