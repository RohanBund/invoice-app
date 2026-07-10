import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Users, Mail, Phone } from "lucide-react";
import { clientsApi } from "@/api/clients";
import type { Client, CreateClientRequest } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    clientsApi.getAll()
      .then(setClients)
      .catch(() => toast({ variant: "destructive", title: "Failed to load clients" }))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingClient(null);
    reset({ name: "", email: "", phone: "", address: "" });
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    reset({ name: client.name, email: client.email, phone: client.phone ?? "", address: client.address ?? "" });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const payload: CreateClientRequest = {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        address: values.address || undefined,
      };
      if (editingClient) {
        const updated = await clientsApi.update(editingClient.id, payload);
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: "Client updated" });
      } else {
        const created = await clientsApi.create(payload);
        setClients((prev) => [created, ...prev]);
        toast({ title: "Client added" });
      }
      setDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to save client" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    setDeletingId(id);
    try {
      await clientsApi.delete(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Client removed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete client" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Clients"
        description="Manage your client relationships"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add client
          </button>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-white">
            <Users className="h-10 w-10 text-gray-300" />
            <div className="text-center">
              <p className="font-medium">No clients yet</p>
              <p className="text-sm text-gray-500">Add your first client to start invoicing</p>
            </div>
            <button
              onClick={openCreate}
              className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" /> Add client
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="group relative">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" /> {client.email}
                      </p>
                      {client.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">Added {formatDate(client.createdAt)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        {deletingId === client.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        }
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit client" : "New client"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <input
                placeholder="Acme Corp"
                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email *</label>
              <input
                type="email"
                placeholder="billing@acme.com"
                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <input
                placeholder="+1 555 0100"
                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                {...register("phone")}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <input
                placeholder="123 Main St, City"
                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                {...register("address")}
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
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
                {editingClient ? "Save changes" : "Add client"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}