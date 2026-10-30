// src/app/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth.server"; 
import AppLayout from "@/components/layout/AppLayout";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioLogado();

  if (!usuario) {
    redirect("/");
  }

  return (
    <AppLayout usuario={usuario}>
     {children}
    </AppLayout>
  );
}