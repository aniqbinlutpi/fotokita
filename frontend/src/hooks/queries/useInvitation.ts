import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvitation, updateInvitation } from "@/api/tenant";
import type { InvitationInput } from "@/types/invitation";

export const invitationKeys = {
  detail: (identifier: string) => ["invitation", identifier] as const,
};

export function useInvitation(identifier?: string | null) {
  return useQuery({
    queryKey: invitationKeys.detail(identifier || ""),
    queryFn: () => getInvitation(identifier!),
    enabled: Boolean(identifier),
    retry: false,
  });
}

export function useUpdateInvitation(identifier: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvitationInput) => updateInvitation(identifier, input),
    onSuccess: (data) => {
      queryClient.setQueryData(invitationKeys.detail(identifier), data);
    },
  });
}
