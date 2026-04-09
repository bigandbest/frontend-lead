import { AppLayout } from "@/components/layout/AppLayout";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/reminders": "Reminders",
  "/attendance": "Attendance",
  "/campaigns": "Campaigns",
  "/templates": "Templates",
  "/forms": "Forms",
  "/targets": "Targets",
  "/analytics": "Analytics",
  "/organization": "Organization",
  "/teams": "Teams",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/settings/profile": "My Profile",
  "/settings/password": "Change Password",
};

export default function PlaceholderPage() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Page";

  return (
    <AppLayout>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-sm">
          The {title.toLowerCase()} module is under development. Check back soon!
        </p>
      </div>
    </AppLayout>
  );
}
