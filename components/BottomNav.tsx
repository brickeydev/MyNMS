"use client"

import { ArrowUpRight } from "lucide-react"

import { Link, usePathname } from "@/i18n/navigation"
import type { NavLink } from "@/lib/types"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  navLinks: NavLink[]
}

export default function BottomNav({ navLinks }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 mx-4 mb-4 md:hidden">
      <nav className="mx-auto flex max-w-md items-center justify-between rounded-3xl border border-border/70 bg-card/95 px-2 py-2 shadow-bubble backdrop-blur-xl">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive =
            !link.external &&
            (pathname === link.href || pathname.startsWith(`${link.href}/`))

          const className = cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                <div className="relative">
                  <Icon className="size-5" />
                  <ArrowUpRight className="absolute -top-1 -right-2 size-3" />
                </div>
                <span className="truncate">{link.label}</span>
              </a>
            )
          }

          return (
            <Link key={link.href} href={link.href} className={className}>
              <Icon className="size-5" />
              <span className="truncate">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
