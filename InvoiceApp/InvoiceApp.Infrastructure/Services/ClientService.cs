using InvoiceApp.Application.DTOs.Clients;
using InvoiceApp.Application.Interfaces;
using InvoiceApp.Domain.Entities;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class ClientService : IClientService
{
    private readonly AppDbContext _db;

    public ClientService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ClientDto>> GetAllAsync(Guid tenantId)
    {
        return await _db.Clients
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => ToDto(c))
            .ToListAsync();
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        return client == null ? null : ToDto(client);
    }

    public async Task<ClientDto> CreateAsync(Guid tenantId, CreateClientDto dto)
    {
        var client = new Client
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            CreatedAt = DateTime.UtcNow
        };

        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return ToDto(client);
    }

    public async Task<ClientDto?> UpdateAsync(Guid id, Guid tenantId, CreateClientDto dto)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (client == null) return null;

        client.Name = dto.Name;
        client.Email = dto.Email;
        client.Phone = dto.Phone;
        client.Address = dto.Address;

        await _db.SaveChangesAsync();
        return ToDto(client);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (client == null) return false;

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ClientDto ToDto(Client c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Email = c.Email,
        Phone = c.Phone,
        Address = c.Address,
        CreatedAt = c.CreatedAt
    };
}