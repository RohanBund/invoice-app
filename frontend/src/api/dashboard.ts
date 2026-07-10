import apiClient from "./client";
import type { DashboardStats, TenantSettings } from "@/types";

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>("/dashboard");
    return res.data;
  },
};

export const settingsApi = {
  get: async (): Promise<TenantSettings> => {
    const res = await apiClient.get<TenantSettings>("/settings");
    return res.data;
  },

  update: async (data: TenantSettings): Promise<TenantSettings> => {
    const res = await apiClient.put<TenantSettings>("/settings", data);
    return res.data;
  },
};