import apiClient from "./client";
import type { Client, CreateClientRequest } from "@/types";

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const res = await apiClient.get<Client[]>("/clients");
    return res.data;
  },

  create: async (data: CreateClientRequest): Promise<Client> => {
    const res = await apiClient.post<Client>("/clients", data);
    return res.data;
  },

  update: async (id: string, data: CreateClientRequest): Promise<Client> => {
    const res = await apiClient.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};