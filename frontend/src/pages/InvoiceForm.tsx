import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { clientsApi } from "@/api/clients";
import { invoicesApi } from "@/api/invoices";
import type { Client } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, calculateItemTotal, calculateInvoiceTotal } from "@/lib/utils";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  taxPercent: z.coerce.number().min(0).max(100),
});

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  issueDate: z.string().min(1, "Required"),
  dueDate: z.string().min(1, "Required"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "",
      issueDate: today,
      dueDate: in30days,
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, taxPercent: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  useEffect(() => {
    async function load() {
      try {
        const cs = await clientsApi.getAll();
        setClients(cs);
        if (isEdit && id) {
          const inv = await invoicesApi.getById(id);
          reset({
            clientId: inv.clientId,
            issueDate: inv.issueDate.slice(0, 10),
            dueDate: inv.dueDate.slice(0, 10),
            notes: inv.notes ?? "",
            items: inv.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxPercent: i.taxPercent,
            })),
          });
        }
      } catch {
        toast({ variant: "destructive", title: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit, reset]);

  const total = calculateInvoiceTotal(watchedItems ?? []);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (isEdit && id) {
        await invoicesApi.update(id, values);
        toast({ title: "Invoice updated" });
      } else {
        const created = await invoicesApi.create(values);
        toast({ title: "Invoice created", description: `${created.invoiceNumber} saved as draft.` });
      }
      navigate("/invoices");
    } catch {
      toast({ variant: "destructive", title: "Failed to save invoice" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={isEdit ? "Edit Invoice" : "New Invoice"}
        description={isEdit ? "Update invoice details" : "Create a new invoice for a client"}
        action={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* Client */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-medium">Client *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                  {...register("clientId")}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.clientId && <p className="text-xs text-red-500">{errors.clientId.message}</p>}
              </div>

              {/* Issue Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Issue Date *</label>
                <input
                  type="date"
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                  {...register("issueDate")}
                />
                {errors.issueDate && <p className="text-xs text-red-500">{errors.issueDate.message}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Due Date *</label>
                <input
                  type="date"
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                  {...register("dueDate")}
                />
                {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Payment terms, bank details, thank you note..."
                  className="flex w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <button
                type="button"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxPercent: 0 })}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Tax %</div>
                <div className="col-span-1" />
              </div>

              {fields.map((field, index) => {
                const item = watchedItems?.[index];
                const lineTotal = item ? calculateItemTotal(item.quantity, item.unitPrice, item.taxPercent) : 0;
                return (
                  <div key={field.id} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          placeholder="e.g. Web design"
                          className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          {...register(`items.${index}.description`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                          {...register(`items.${index}.quantity`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                          {...register(`items.${index}.unitPrice`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-blue-500"
                          {...register(`items.${index}.taxPercent`)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-right text-xs text-gray-400 pr-8">
                      Subtotal: {formatCurrency(lineTotal)}
                    </p>
                  </div>
                );
              })}

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-end">
                  <div className="w-48 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}