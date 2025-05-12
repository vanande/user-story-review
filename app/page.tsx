export const metadata = {
  title: "Onestory",
  description: "Annotation de user story",
};

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Plateforme d'annotation de user stories</CardTitle>
          <CardDescription>Connectez-vous avec votre email onepoint pour annoter les user stories selon les principes INVEST</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Créer un compte</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-between text-sm text-muted-foreground">
          <p>Améliorez l'entraînement des modèles de langage grâce à des retours structurés</p>
        </CardFooter>
      </Card>
    </div>
  );
}
