using System;
using System.Collections.Generic;
using System.Text;

namespace InvoiceApp.Domain.Entities;

public class InvoiceItem
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxPercent { get; set; }

    // Navigation
    public Invoice Invoice { get; set; } = null!;
}
