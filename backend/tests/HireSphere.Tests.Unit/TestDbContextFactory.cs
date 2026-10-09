using Microsoft.EntityFrameworkCore;
using HireSphere.Infrastructure.Persistence;

namespace HireSphere.Tests.Unit;

public static class TestDbContextFactory
{
    public static HireSphereDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<HireSphereDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new HireSphereDbContext(options);
    }
}
