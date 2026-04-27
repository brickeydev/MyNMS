"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowUpRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { NavLink } from "@/lib/types"

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), {
  ssr: false,
  loading: () => <div className="h-5 w-5" />,
})

const LanguageSwitcher = dynamic(
  () => import("@/components/LanguageSwitcher"),
  {
    ssr: false,
    loading: () => <div className="h-5 w-5" />,
  }
)

interface NavbarProps {
  navLinks: NavLink[]
}

export default function Navbar({ navLinks }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="MyNMS"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="font-bold text-[#4A4A4A] dark:text-[#E5E5E5]">
            My<span className="text-primary">NMS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
                <ArrowUpRight className="size-3.5" />
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
