import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminWeddings,
  getAdminHealth,
  createAdminWedding,
  deleteAdminWedding,
} from "@/api/admin";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  health: () => [...adminKeys.all, "health"] as const,
  weddings: () => [...adminKeys.all, "weddings"] as const,
};

export function useAdminStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}

export function useAdminHealth(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: getAdminHealth,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    retry: 1,
  });
}

export function useAdminWeddings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.weddings(),
    queryFn: getAdminWeddings,
    enabled: options?.enabled ?? true,
  });
}

export function useAdminCreateWedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; slug: string; date: string }) =>
      createAdminWedding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useAdminDeleteWedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminWedding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
