import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Send, Download, Copy, CreditCard, Loader2 } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import type { Invoice } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getStatusColor, calculateItemTotal } from "@/lib/utils";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    invoicesApi.getById(id)
      .then(setInvoice)
      .catch(() => toast({ variant: "destructive", title: "Invoice not found" }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    if (!id) return;
    setActionLoading("send");
    try {
      await invoicesApi.send(id);
      setInvoice((prev) => prev ? { ...prev, status: "Sent" } : prev);
      toast({ title: "Invoice sent!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to send" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownload() {
    if (!id || !invoice) return;
    setActionLoading("pdf");
    try {
      const blob = await invoicesApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Failed to download PDF" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDuplicate() {
    if (!id) return;
    setActionLoading("duplicate");
    try {
      const copy = await invoicesApi.duplicate(id);
      toast({ title: "Invoice duplicated", description: `${copy.invoiceNumber} created.` });
      navigate(`/invoices/${copy.id}`);
    } catch {
      toast({ variant: "destructive", title: "Failed to duplicate" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePayNow() {
    if (!id) return;
    setActionLoading("pay");
    try {
      const { checkoutUrl } = await invoicesApi.createCheckout(id);
      window.open(checkoutUrl, "_blank");
    } catch {
      toast({ variant: "destructive", title: "Failed to create payment link" });
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Invoice not found</p>
        <button onClick={() => navigate("/invoices")} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
          Back to invoices
        </button>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = invoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.taxPercent) / 100, 0);

  return (
    <div className="flex flex-col">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => navigate(`/invoices/${id}/edit`)} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={handleDuplicate} disabled={!!actionLoading} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              {actionLoading === "duplicate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Duplicate
            </button>
            <button onClick={handleDownload} disabled={!!actionLoading} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              {actionLoading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </button>
            {invoice.status === "Draft" && (
              <button onClick={handleSend} disabled={!!actionLoading} className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {actionLoading === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            )}
            {(invoice.status === "Sent" || invoice.status === "Overdue") && (
              <button onClick={handlePayNow} disabled={!!actionLoading} className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {actionLoading === "pay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pay now
              </button>
            )}
          </div>
        }
      />

      <div className="p-8">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Summary */}
          <Card>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
                <span className={`mt-1 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Client</p>
                <p className="mt-1 font-medium">{invoice.clientName}</p>
                <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount Due</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-6 py-2.5 font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Unit Price</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Tax</th>
                    <th className="px-6 py-2.5 text-right font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.taxPercent}%</td>
                      <td className="px-6 py-3 text-right font-medium">
                        {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice, item.taxPercent))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t px-6 py-4">
                <div className="ml-auto w-48 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-semibold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}