import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUsersApi, getUserApi, createUserApi, updateUserApi,
  deactivateUserApi, activateUserApi,
  type GetUsersParams, type CreateUserPayload, type UpdateUserPayload,
} from "@/api/users";

export const userKeys = {
  all: ["users"] as const,
  list: (params: GetUsersParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsersApi(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserApi(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUserApi(payload),
    onSuccess: () => {
      toast.success("User created successfully");
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create user"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUserApi(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update user"),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUserApi(id),
    onSuccess: () => {
      toast.success("User deactivated");
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to deactivate user"),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateUserApi(id),
    onSuccess: () => {
      toast.success("User activated");
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to activate user"),
  });
}
