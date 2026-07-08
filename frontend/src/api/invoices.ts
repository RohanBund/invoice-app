import apiClient from "./client";
import type { CreateInvoiceRequest, Invoice } from "@/types";

export const invoicesApi = {
  getAll: async (): Promise<Invoice[]> => {
    const res = await apiClient.get<Invoice[]>("/invoices");
    return res.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>("/invoices", data);
    return res.data;
  },

  update: async (id: string, data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await apiClient.put<Invoice>(`/invoices/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  send: async (id: string): Promise<void> => {
    await apiClient.post(`/invoices/${id}/send`);
  },

  duplicate: async (id: string): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>(`/invoices/${id}/duplicate`);
    return res.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const res = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return res.data;
  },

  createCheckout: async (id: string): Promise<{ checkoutUrl: string }> => {
    const res = await apiClient.post(`/payments/create-checkout`, {
      invoiceId: id,
    });
    return res.data;
  },
};