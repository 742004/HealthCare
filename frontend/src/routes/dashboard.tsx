import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Emergency Healthcare Connector" }] }),
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});
