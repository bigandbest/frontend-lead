import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useMe } from "@/hooks/useOrganization";
import { useChangePassword } from "@/hooks/useOrganization";

export default function SettingsPage() {
  const location = useLocation();
  const isPassword = location.pathname === "/settings/password";

  if (isPassword) return <ChangePasswordPage />;
  return <ProfilePage />;
}

function ProfilePage() {
  const { data, isLoading } = useMe();
  const user = data?.data;

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";

  return (
    <AppLayout>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {user?.role && (
                      <Badge variant="secondary" className="capitalize">{user.role.replace("_", " ")}</Badge>
                    )}
                    {user?.organizationName && (
                      <span className="text-sm text-muted-foreground">{user.organizationName}</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input defaultValue={user?.firstName ?? ""} className="mt-1" readOnly disabled />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input defaultValue={user?.lastName ?? ""} className="mt-1" readOnly disabled />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={user?.email ?? ""} className="mt-1" readOnly disabled />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input defaultValue={user?.phone ?? ""} className="mt-1" readOnly disabled />
                </div>
                <p className="text-xs text-muted-foreground">Contact your administrator to update profile information.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function ChangePasswordPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = useChangePassword();

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const hasLength = newPassword.length >= 8;
  const checks = [hasLength, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const strengthLabel = checks <= 1 ? "Weak" : checks === 2 ? "Fair" : checks === 3 ? "Strong" : "Very Strong";
  const strengthPct = (checks / 4) * 100;

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword && newPassword && confirmPassword && passwordsMatch && checks >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1>Change Password</h1>
      </div>

      <Card className="max-w-md">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label>New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <Progress value={strengthPct} className="h-2 flex-1" />
                  <span className="text-xs font-medium">{strengthLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                  <span className={hasLength ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>{hasLength ? "✓" : "○"} 8+ chars</span>
                  <span className={hasUpper ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>{hasUpper ? "✓" : "○"} Uppercase</span>
                  <span className={hasNumber ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>{hasNumber ? "✓" : "○"} Number</span>
                  <span className={hasSymbol ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>{hasSymbol ? "✓" : "○"} Symbol</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Confirm New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 rounded-lg p-3 text-sm text-muted-foreground">
            ⚠ You will be signed out from all devices after changing password
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
            >
              Clear
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit || changePassword.isPending}
              onClick={handleSubmit}
            >
              {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
