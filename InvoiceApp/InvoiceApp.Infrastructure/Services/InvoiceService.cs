using InvoiceApp.Application.DTOs.Invoices;
using InvoiceApp.Application.Interfaces;
using InvoiceApp.Domain.Entities;
using InvoiceApp.Domain.Enums;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _db;

    public InvoiceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<InvoiceDto>> GetAllAsync(Guid tenantId)
    {
        return await _db.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => ToDto(i))
            .ToListAsync();
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        return invoice == null ? null : ToDto(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(Guid tenantId, CreateInvoiceDto dto)
    {
        var number = await GenerateInvoiceNumberAsync(tenantId);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClientId = dto.ClientId,
            InvoiceNumber = number,
            Status = InvoiceStatus.Draft,
            IssueDate = dto.IssueDate,
            DueDate = dto.DueDate,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TaxPercent = i.TaxPercent
            }).ToList()
        };

        invoice.TotalAmount = CalculateTotal(invoice.Items);

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(invoice.Id, tenantId) ?? ToDto(invoice);
    }

    public async Task<InvoiceDto?> UpdateAsync(Guid id, Guid tenantId, CreateInvoiceDto dto)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invoice == null) return null;

        invoice.ClientId = dto.ClientId;
        invoice.IssueDate = dto.IssueDate;
        invoice.DueDate = dto.DueDate;
        invoice.Notes = dto.Notes;

        // Replace items
        _db.InvoiceItems.RemoveRange(invoice.Items);
        invoice.Items = dto.Items.Select(i => new InvoiceItem
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoice.Id,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TaxPercent = i.TaxPercent
        }).ToList();

        invoice.TotalAmount = CalculateTotal(invoice.Items);

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id, tenantId);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invoice == null) return false;

        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SendAsync(Guid id, Guid tenantId)
    {
        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invoice == null) return false;

        invoice.Status = InvoiceStatus.Sent;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<InvoiceDto?> DuplicateAsync(Guid id, Guid tenantId)
    {
        var original = await _db.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (original == null) return null;

        var number = await GenerateInvoiceNumberAsync(tenantId);

        var copy = new Invoice
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClientId = original.ClientId,
            InvoiceNumber = number,
            Status = InvoiceStatus.Draft,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Notes = original.Notes,
            TotalAmount = original.TotalAmount,
            CreatedAt = DateTime.UtcNow,
            Items = original.Items.Select(i => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TaxPercent = i.TaxPercent
            }).ToList()
        };

        _db.Invoices.Add(copy);
        await _db.SaveChangesAsync();
        return await GetByIdAsync(copy.Id, tenantId);
    }

    public Task<byte[]?> GeneratePdfAsync(Guid id, Guid tenantId)
    {
        // PDF generation will be wired up in a later step
        throw new NotImplementedException();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string> GenerateInvoiceNumberAsync(Guid tenantId)
    {
        var count = await _db.Invoices.CountAsync(i => i.TenantId == tenantId);
        return $"INV-{(count + 1):D4}";
    }

    private static decimal CalculateTotal(IEnumerable<InvoiceItem> items)
    {
        return items.Sum(i =>
        {
            var subtotal = i.Quantity * i.UnitPrice;
            return subtotal + subtotal * i.TaxPercent / 100;
        });
    }

    private static InvoiceDto ToDto(Invoice i) => new()
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        Status = i.Status,
        IssueDate = i.IssueDate,
        DueDate = i.DueDate,
        Notes = i.Notes,
        TotalAmount = i.TotalAmount,
        ClientId = i.ClientId,
        ClientName = i.Client?.Name ?? string.Empty,
        ClientEmail = i.Client?.Email ?? string.Empty,
        CreatedAt = i.CreatedAt,
        Items = i.Items.Select(item => new InvoiceItemDto
        {
            Id = item.Id,
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            TaxPercent = item.TaxPercent
        }).ToList()
    };
}