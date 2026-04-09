import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegisterMutation } from "@/hooks/useAuth";

const passwordChecks = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
  const passed = passwordChecks.filter((c) => c.test(password)).length;
  if (passed <= 1) return { label: "Weak", color: "bg-destructive", segments: 1 };
  if (passed === 2) return { label: "Fair", color: "bg-warning", segments: 2 };
  if (passed === 3) return { label: "Strong", color: "bg-info", segments: 3 };
  return { label: "Very Strong", color: "bg-success", segments: 4 };
}

function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    orgName: "", password: "", confirmPassword: "",
  });

  const register = useRegisterMutation();
  const strength = getStrength(form.password);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      // Show inline error without toast so the user can fix it
      return;
    }

    const normalizedPhone = normalizeIndianMobile(form.phone);

    register.mutate({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: normalizedPhone || undefined,
      organizationName: form.orgName,
    });
  };

  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-primary-foreground font-bold text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">
            Start managing leads today
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Set up your organization in under 2 minutes.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-1">Create your account</h2>
          <p className="text-muted-foreground mb-8">Set up your organization</p>

          {register.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-6">
              {register.error.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={update("firstName")} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={update("lastName")} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={update("email")} required placeholder="you@company.com" />
            </div>

            <div className="space-y-2">
              <Label>Phone (10-digit Indian mobile)</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="9876543210 or +91 98765 43210"
                inputMode="numeric"
                maxLength={16}
              />
            </div>

            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input value={form.orgName} onChange={update("orgName")} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  required
                  className={passwordMismatch ? "border-destructive" : ""}
                />
                {passwordMismatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
            </div>

            {form.password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i <= strength.segments ? strength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{strength.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {passwordChecks.map((check) => (
                    <span
                      key={check.label}
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        check.test(form.password) ? "text-success" : "text-muted-foreground"
                      )}
                    >
                      {check.test(form.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={register.isPending || passwordMismatch}
            >
              {register.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
