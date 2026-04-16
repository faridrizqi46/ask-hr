"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (email === "emily.nates@company.com" && password === "password123") {
      document.cookie = `admin_token=password123; path=/; max-age=86400`;
      document.cookie = `user_email=emily.nates@company.com; path=/; max-age=86400`;
      document.cookie = `user_name=Emily Nates; path=/; max-age=86400`;
      router.push("/dashboard/cv-analyzer");
    } else {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-6 rounded-lg border bg-card shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">AskHR Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              placeholder="Enter your password"
            />
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
