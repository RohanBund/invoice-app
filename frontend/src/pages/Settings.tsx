import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2 } from "lucide-react";
import { settingsApi } from "@/api/dashboard";
import type { TenantSettings } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  logo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    settingsApi.get()
      .then((data: TenantSettings) => reset({
        businessName: data.businessName,
        address: data.address ?? "",
        taxNumber: data.taxNumber ?? "",
        logo: data.logo ?? "",
      }))
      .catch(() => toast({ variant: "destructive", title: "Failed to load settings" }))
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await settingsApi.update({
        businessName: values.businessName,
        address: values.address || undefined,
        taxNumber: values.taxNumber || undefined,
        logo: values.logo || undefined,
      });
      toast({ title: "Settings saved", description: "Your business profile has been updated." });
    } catch {
      toast({ variant: "destructive", title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" description="Manage your business profile" />

      <div className="p-8">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <CardTitle className="text-base">Business Profile</CardTitle>
                      <CardDescription>This information appears on your invoices</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Business name *</label>
                    <input
                      placeholder="Acme Design Studio"
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                      {...register("businessName")}
                    />
                    {errors.businessName && <p className="text-xs text-red-500">{errors.businessName.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Business address</label>
                    <input
                      placeholder="123 Main St, City, Country"
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                      {...register("address")}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Tax / VAT number</label>
                    <input
                      placeholder="e.g. GB123456789"
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                      {...register("taxNumber")}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Logo URL</label>
                    <input
                      placeholder="https://yoursite.com/logo.png"
                      className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-blue-500"
                      {...register("logo")}
                    />
                    <p className="text-xs text-gray-400">Used on PDF invoices. Must be a public image URL.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}