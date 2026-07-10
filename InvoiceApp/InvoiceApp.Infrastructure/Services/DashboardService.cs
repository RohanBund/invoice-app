using InvoiceApp.Application.DTOs.Dashboard;
using InvoiceApp.Application.DTOs.Invoices;
using InvoiceApp.Application.Interfaces;
using InvoiceApp.Domain.Enums;
using InvoiceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid tenantId)
    {
        var invoices = await _db.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .Where(i => i.TenantId == tenantId)
            .ToListAsync();

        var paid = invoices.Where(i => i.Status == InvoiceStatus.Paid).ToList();
        var outstanding = invoices.Where(i => i.Status == InvoiceStatus.Sent).ToList();
        var overdue = invoices.Where(i => i.Status == InvoiceStatus.Overdue).ToList();

        // Monthly revenue for last 6 months
        var monthly = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .OrderBy(d => d)
            .Select(d => new MonthlyRevenueDto
            {
                Month = d.ToString("MMM"),
                Revenue = paid
                    .Where(inv => inv.IssueDate.Month == d.Month
                               && inv.IssueDate.Year == d.Year)
                    .Sum(inv => inv.TotalAmount)
            })
            .ToList();

        var recent = invoices
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                Status = i.Status,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                TotalAmount = i.TotalAmount,
                ClientId = i.ClientId,
                ClientName = i.Client?.Name ?? string.Empty,
                ClientEmail = i.Client?.Email ?? string.Empty,
                CreatedAt = i.CreatedAt,
                Items = new()
            })
            .ToList();

        return new DashboardStatsDto
        {
            TotalRevenue = paid.Sum(i => i.TotalAmount),
            OutstandingAmount = outstanding.Sum(i => i.TotalAmount),
            OverdueCount = overdue.Count,
            PaidInvoicesCount = paid.Count,
            TotalInvoicesCount = invoices.Count,
            MonthlyRevenue = monthly,
            RecentInvoices = recent
        };
    }
}