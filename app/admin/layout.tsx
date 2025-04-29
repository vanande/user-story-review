"use client" // Required for useEffect and localStorage

import type React from "react"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ADMIN_EMAILS = ["admin@admin.com", "v.khatchatrian@groupeonepoint.com"]; // <<<--- @TODO UPDATE THIS LIST, consider moving to environment variables later

export default function AdminLayout({
                                      children,
                                    }: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      setIsAuthorized(true);
    } else {
      console.warn("Unauthorized access attempt to admin area by:", userEmail);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <div className="container mx-auto p-10">Loading admin area...</div>;
  }

  if (!isAuthorized) {
    return (
        <div className="container mx-auto max-w-md p-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unauthorized Access</AlertTitle>
            <AlertDescription>
              You do not have permission to view this page. Please log in with an administrator account.
            </AlertDescription>
          </Alert>
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
            <AdminNav />
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
  )
}