import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardStats } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

function StatCard({ title, value, description, icon: Icon, color }: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch(() => toast({ variant: "destructive", title: "Failed to load dashboard" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Dashboard" description="Your business at a glance" />

      <div className="space-y-6 p-8">
        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            description="All paid invoices"
            icon={DollarSign}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(stats?.outstandingAmount ?? 0)}
            description="Sent and unpaid"
            icon={Clock}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Overdue"
            value={String(stats?.overdueCount ?? 0)}
            description="Past due date"
            icon={AlertTriangle}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="Paid Invoices"
            value={String(stats?.paidInvoicesCount ?? 0)}
            description={`of ${stats?.totalInvoicesCount ?? 0} total`}
            icon={CheckCircle}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue collected over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.monthlyRevenue ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <Link to="/invoices" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {(stats?.recentInvoices ?? []).length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">No invoices yet</p>
              )}
              {(stats?.recentInvoices ?? []).map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="truncate text-xs text-gray-500">{inv.clientName}</p>
                    <p className="text-xs text-gray-400">{formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{formatCurrency(inv.totalAmount)}</span>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}