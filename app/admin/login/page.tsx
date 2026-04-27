"use client"

import { useState } from "react"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let res: Response
    try {
      res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
    } catch {
      setLoading(false)
      setError("Verbindungsfehler. Bitte Seite neu laden und erneut versuchen.")
      return
    }

    setLoading(false)

    if (res.ok) {
      window.location.href = "/admin"
    } else if (res.status === 429) {
      setError("Zu viele Versuche. Bitte warte 15 Minuten.")
    } else {
      setError("Ungültige Anmeldedaten.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">MyNMS Adminbereich</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="rounded-2xl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full"
          >
            <LogIn size={16} className="mr-2" />
            {loading ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
      </div>
    </div>
  )
}
