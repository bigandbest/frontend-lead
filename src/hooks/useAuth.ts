import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { loginApi, registerApi, logoutApi, type LoginPayload, type RegisterPayload } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

export function useLoginMutation() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Login failed");
    },
  });
}

export function useRegisterMutation() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast.success("Account created successfully!");
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Registration failed");
    },
  });
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => logoutApi(refreshToken ?? ""),
    onSettled: () => {
      // Always clear local state regardless of server response
      clearAuth();
      navigate("/login");
    },
  });
}
