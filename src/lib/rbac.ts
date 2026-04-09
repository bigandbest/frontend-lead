export const ROLE_LEVELS = {
  super_admin: 100,
  admin: 80,
  marketing_manager: 60,
  agent_supervisor: 60,
  marketing_agent: 40,
  field_agent: 40,
} as const;

export type AppRole = keyof typeof ROLE_LEVELS;

export function isAppRole(role: string | null | undefined): role is AppRole {
  return !!role && role in ROLE_LEVELS;
}

export function hasAnyRole(role: string | null | undefined, allowedRoles?: AppRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!isAppRole(role)) return false;
  return allowedRoles.includes(role);
}

export function hasMinRole(role: string | null | undefined, minRole: AppRole): boolean {
  if (!isAppRole(role)) return false;
  return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole];
}

export const MANAGER_PLUS_ROLES: AppRole[] = [
  "marketing_manager",
  "agent_supervisor",
  "admin",
  "super_admin",
];

export const ADMIN_PLUS_ROLES: AppRole[] = ["admin", "super_admin"];
