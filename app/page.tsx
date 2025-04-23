export const metadata = {
  title: "Onestory",
  description: "Log in with your corporate email to review user stories",
};

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">User Story Review Platform</CardTitle>
          <CardDescription>Log in to review user stories against INVEST principles</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-between text-sm text-muted-foreground">
          <p>Improve language model training through structured feedback</p>
        </CardFooter>
      </Card>
    </div>
  )
}
