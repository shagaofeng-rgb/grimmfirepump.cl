import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/admin-frame";
import { CustomerDetail } from "@/components/customer-detail";
import { getAdminSession } from "@/lib/auth";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(); if (!session) redirect("/admin/login"); const { id } = await params;
  return <AdminFrame session={session}><CustomerDetail customerId={id} /></AdminFrame>;
}
