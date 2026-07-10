using InvoiceApp.Application.DTOs.Dashboard;
using InvoiceApp.Application.Interfaces;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly AppDbContext _db;

    public SettingsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TenantSettingsDto> GetAsync(Guid tenantId)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new Exception("Tenant not found.");

        return new TenantSettingsDto
        {
            BusinessName = tenant.BusinessName,
            Address = tenant.Address,
            TaxNumber = tenant.TaxNumber,
            Logo = tenant.Logo
        };
    }

    public async Task<TenantSettingsDto> UpdateAsync(Guid tenantId, TenantSettingsDto dto)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new Exception("Tenant not found.");

        tenant.BusinessName = dto.BusinessName;
        tenant.Address = dto.Address;
        tenant.TaxNumber = dto.TaxNumber;
        tenant.Logo = dto.Logo;

        await _db.SaveChangesAsync();

        return new TenantSettingsDto
        {
            BusinessName = tenant.BusinessName,
            Address = tenant.Address,
            TaxNumber = tenant.TaxNumber,
            Logo = tenant.Logo
        };
    }
}