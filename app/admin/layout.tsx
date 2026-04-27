"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart2, Cat, LayoutDashboard, LogOut, Package, Star } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" })
    router.replace("/admin/login")
    router.refresh()
  }

  const isLogin = pathname === "/admin/login"

  if (isLogin) {
    return <>{children}</>
  }

  const navItems = [
    { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
    { href: "/admin/fundtiere", label: "Fundtiere", icon: Cat },
    { href: "/admin/fundsachen", label: "Fundsachen", icon: Package },
    { href: "/admin/vorgestellt", label: "Vorgestellt", icon: Star },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card p-4 md:flex md:flex-col md:gap-1">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            MyNMS Admin
          </p>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut size={16} className="mr-2" />
            Abmelden
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <p className="font-semibold">MyNMS Admin</p>
          <div className="flex gap-2">
            {navItems.map(({ href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg p-2 ${
                  (
                    href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(href)
                  )
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon size={18} />
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
