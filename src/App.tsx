import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageCompanies from "./pages/admin/ManageCompanies";
import Reports from "./pages/admin/Reports";
import SystemSettings from "./pages/admin/SystemSettings";
import AddUser from "./pages/admin/AddUser";
import ManagePermissions from "./pages/admin/ManagePermissions";
import SystemBackup from "./pages/admin/SystemBackup";
import NotificationSettings from "./pages/admin/NotificationSettings";
import ApprovePaymentsBatch from "./pages/financeiro/ApprovePaymentsBatch";
import SchedulePayments from "./pages/financeiro/SchedulePayments";
import CashFlowReport from "./pages/financeiro/CashFlowReport";
import PaymentsReport from "./pages/financeiro/PaymentsReport";
import ManageTeam from "./pages/gestor/ManageTeam";
import NewRequest from "./pages/solicitacao/NewRequest";
import MyRequestsPage from "./pages/solicitacao/MyRequestsPage";
import ManageRequestsPage from "./pages/solicitacao/ManageRequestsPage";
import EditRequest from "./pages/solicitacao/EditRequest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/solicitacao/nova" element={<NewRequest />} />
              <Route path="/solicitacao/editar/:id" element={<EditRequest />} />
              <Route path="/minhas-solicitacoes" element={<MyRequestsPage />} />
              <Route path="/gerenciar-solicitacoes" element={<ManageRequestsPage />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/manage-users" element={<ManageUsers />} />
              <Route path="/admin/companies" element={<ManageCompanies />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
              <Route path="/admin/add-user" element={<AddUser />} />
              <Route path="/admin/permissions" element={<ManagePermissions />} />
              <Route path="/admin/backup" element={<SystemBackup />} />
              <Route path="/admin/notifications" element={<NotificationSettings />} />
              <Route path="/financeiro/approve-batch" element={<ApprovePaymentsBatch />} />
              <Route path="/financeiro/schedule-payments" element={<SchedulePayments />} />
              <Route path="/financeiro/cash-flow" element={<CashFlowReport />} />
              <Route path="/financeiro/payments-report" element={<PaymentsReport />} />
              <Route path="/gestor/manage-team" element={<ManageTeam />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
