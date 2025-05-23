"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_EMAILS = [
  "v.khatchatrian@groupeonepoint.com",
  "m.ortega@groupeonepoint.com",
  "h.imhah@groupeonepoint.com",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    return <div className="container mx-auto p-10">Chargement de la zone administrateur...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto max-w-md p-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès non autorisé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas la permission de voir cette page. Veuillez vous connecter avec un compte administrateur.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/login")} className="mt-4">
          Aller à la connexion
        </Button>{" "}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          {/* Navigation Section */}
          <div className="flex flex-col space-y-4">
            <AdminNav />
            {/* Button to go back to User Dashboard */}
            <Button variant="outline" size="sm" asChild className="justify-start">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" /> Tableau de bord utilisateur
              </Link>
            </Button>
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
