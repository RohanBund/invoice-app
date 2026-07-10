using InvoiceApp.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Tenant
        builder.Entity<Tenant>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.BusinessName).IsRequired().HasMaxLength(200);
            e.Property(t => t.Logo).HasMaxLength(500);
            e.Property(t => t.Address).HasMaxLength(500);
            e.Property(t => t.TaxNumber).HasMaxLength(100);
        });

        // AppUser
        builder.Entity<AppUser>(e =>
        {
            e.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            e.HasOne(u => u.Tenant)
             .WithMany(t => t.Users)
             .HasForeignKey(u => u.TenantId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Client
        builder.Entity<Client>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).IsRequired().HasMaxLength(200);
            e.Property(c => c.Email).IsRequired().HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.Property(c => c.Address).HasMaxLength(500);
            e.HasOne(c => c.Tenant)
             .WithMany(t => t.Clients)
             .HasForeignKey(c => c.TenantId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice
        builder.Entity<Invoice>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.InvoiceNumber).IsRequired().HasMaxLength(50);
            e.Property(i => i.TotalAmount).HasPrecision(18, 2);
            e.Property(i => i.Notes).HasMaxLength(1000);
            e.HasOne(i => i.Tenant)
             .WithMany(t => t.Invoices)
             .HasForeignKey(i => i.TenantId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Client)
             .WithMany(c => c.Invoices)
             .HasForeignKey(i => i.ClientId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // InvoiceItem
        builder.Entity<InvoiceItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Description).IsRequired().HasMaxLength(500);
            e.Property(i => i.Quantity).HasPrecision(18, 2);
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.TaxPercent).HasPrecision(5, 2);
            e.HasOne(i => i.Invoice)
             .WithMany(inv => inv.Items)
             .HasForeignKey(i => i.InvoiceId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Payment
        builder.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.StripePaymentId).IsRequired().HasMaxLength(200);
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.HasOne(p => p.Invoice)
             .WithMany(i => i.Payments)
             .HasForeignKey(p => p.InvoiceId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}