using System;
using System.Collections.Generic;
using System.Text;

namespace InvoiceApp.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? Logo { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
