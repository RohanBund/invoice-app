// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  tenantId: string;
}

export interface User {
  email: string;
  fullName: string;
  tenantId: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  totalAmount: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface CreateInvoiceRequest {
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: Omit<InvoiceItem, 'id'>[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  overdueCount: number;
  paidInvoicesCount: number;
  totalInvoicesCount: number;
  monthlyRevenue: MonthlyRevenue[];
  recentInvoices: Invoice[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface TenantSettings {
  businessName: string;
  address?: string;
  taxNumber?: string;
  logo?: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
}