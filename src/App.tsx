import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import UsersPage from "./pages/UsersPage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import OrganizationPage from "./pages/OrganizationPage";
import CampaignsPage from "./pages/CampaignsPage";
import TemplatesPage from "./pages/TemplatesPage";
import FormsPage from "./pages/FormsPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import TargetsPage from "./pages/TargetsPage";
import RemindersPage from "./pages/RemindersPage";
import AttendancePage from "./pages/AttendancePage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import LeadDetailPage from "./pages/LeadDetailPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import InvoiceTemplatesPage from "./pages/InvoiceTemplatesPage";
import InvoiceBuilderPage from "./pages/InvoiceBuilderPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceFillPage from "./pages/InvoiceFillPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import InvoiceProductsPage from "./pages/InvoiceProductsPage";
import { ADMIN_PLUS_ROLES, MANAGER_PLUS_ROLES, NON_FIELD_AGENT_ROLES } from "@/lib/rbac";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}><UsersPage /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}><TeamsPage /></ProtectedRoute>} />
            <Route path="/teams/:id" element={<ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}><TeamDetailPage /></ProtectedRoute>} />
            <Route path="/organization" element={<ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}><OrganizationPage /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute allowedRoles={NON_FIELD_AGENT_ROLES}><CampaignsPage /></ProtectedRoute>} />
            <Route path="/campaigns/:id" element={<ProtectedRoute allowedRoles={NON_FIELD_AGENT_ROLES}><CampaignDetailPage /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute allowedRoles={NON_FIELD_AGENT_ROLES}><TemplatesPage /></ProtectedRoute>} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/forms" element={<FormsPage />} />
            <Route path="/forms/new" element={<FormBuilderPage />} />
            <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
            <Route path="/targets" element={<TargetsPage />} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={MANAGER_PLUS_ROLES}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/profile" element={<SettingsPage />} />
            <Route path="/settings/password" element={<SettingsPage />} />
            {/* Invoice routes */}
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<InvoiceFillPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/invoice-products" element={<InvoiceProductsPage />} />
            <Route
              path="/invoice-templates"
              element={
                <ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}>
                  <InvoiceTemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-templates/:id/edit"
              element={
                <ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}>
                  <InvoiceBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-templates/new"
              element={
                <ProtectedRoute allowedRoles={ADMIN_PLUS_ROLES}>
                  <InvoiceBuilderPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
