import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Loader2, Copy, Send, Download, Trash2 } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import type { Invoice, InvoiceStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

const STATUS_FILTERS: (InvoiceStatus | "All")[] = ["All", "Draft", "Sent", "Paid", "Overdue"];

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceStatus | "All">("All");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    invoicesApi.getAll()
      .then(setInvoices)
      .catch(() => toast({ variant: "destructive", title: "Failed to load invoices" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? invoices : invoices.filter((i) => i.status === filter);

  async function handleSend(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setActionId(id);
    try {
      await invoicesApi.send(id);
      setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "Sent" as InvoiceStatus } : i));
      toast({ title: "Invoice sent!" });
    } catch {
      toast({ variant: "destructive", title: "Failed to send" });
    } finally {
      setActionId(null);
    }
  }

  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setActionId(id);
    try {
      const copy = await invoicesApi.duplicate(id);
      setInvoices((prev) => [copy, ...prev]);
      toast({ title: "Invoice duplicated" });
    } catch {
      toast({ variant: "destructive", title: "Failed to duplicate" });
    } finally {
      setActionId(null);
    }
  }

  async function handleDownload(id: string, number: string, e: React.MouseEvent) {
    e.stopPropagation();
    setActionId(id);
    try {
      const blob = await invoicesApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Failed to download PDF" });
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this invoice?")) return;
    try {
      await invoicesApi.delete(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Invoice deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Invoices"
        description="Create and manage your invoices"
        action={
          <button
            onClick={() => navigate("/invoices/new")}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New invoice
          </button>
        }
      />

      <div className="p-8">
        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "border bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-white">
            <FileText className="h-10 w-10 text-gray-300" />
            <div className="text-center">
              <p className="font-medium">{filter === "All" ? "No invoices yet" : `No ${filter} invoices`}</p>
              <p className="text-sm text-gray-500">
                {filter === "All" ? "Create your first invoice to get started" : "Try a different filter"}
              </p>
            </div>
            {filter === "All" && (
              <button
                onClick={() => navigate("/invoices/new")}
                className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> Create invoice
              </button>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Invoice</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Client</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Issue Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Due Date</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="cursor-pointer bg-white hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{invoice.clientName}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(invoice.issueDate)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {invoice.status === "Draft" && (
                            <button
                              title="Send"
                              disabled={actionId === invoice.id}
                              onClick={(e) => handleSend(invoice.id, e)}
                              className="rounded p-1 hover:bg-gray-100"
                            >
                              {actionId === invoice.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-gray-500" />}
                            </button>
                          )}
                          <button title="Download PDF" disabled={actionId === invoice.id} onClick={(e) => handleDownload(invoice.id, invoice.invoiceNumber, e)} className="rounded p-1 hover:bg-gray-100">
                            <Download className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button title="Duplicate" disabled={actionId === invoice.id} onClick={(e) => handleDuplicate(invoice.id, e)} className="rounded p-1 hover:bg-gray-100">
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button title="Delete" onClick={(e) => handleDelete(invoice.id, e)} className="rounded p-1 hover:bg-gray-100">
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}