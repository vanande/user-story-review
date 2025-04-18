"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  // const [password, setPassword] = useState("") // Removed password state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual backend login/session handling
    // For now, simulate storing email and redirecting
    try {
      // Replace with actual API call when backend is ready
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      // if (!response.ok) {
      //   throw new Error('Login failed');
      // }
      // const data = await response.json();
      // console.log('Login successful:', data);

      // Simulate success for now
      console.log("Logging in with email:", email)
      // Store email in localStorage for simple session persistence (replace with proper session management)
      localStorage.setItem("userEmail", email)

      router.push("/dashboard") // Redirect to dashboard on successful "login"
    } catch (error) {
      console.error("Login error:", error)
      // Handle login errors (e.g., show error message to user)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email to access the review platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {/* Removed password input block */}
            {/* <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div> */}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
        {/* Optional: Add link to register or other actions */}
        {/* <CardFooter>
          <p className="text-center text-sm text-gray-600">
            Don't have an account? <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register</a>
          </p>
        </CardFooter> */}
      </Card>
    </div>
  )
}
