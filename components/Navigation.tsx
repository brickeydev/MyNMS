"use client"

import { Home, Newspaper, Package, PawPrint, Store } from "lucide-react"
import { useTranslations } from "next-intl"

import BottomNav from "@/components/BottomNav"
import Navbar from "@/components/Navbar"
import type { NavLink } from "@/lib/types"

export default function Navigation() {
  const t = useTranslations("navigation")

  const navLinks: NavLink[] = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/eintraege/tiere", label: t("animals"), icon: PawPrint },
    { href: "/eintraege/gegenstaende", label: t("objects"), icon: Package },
    { href: "/nachrichten", label: t("news"), icon: Newspaper },
    { href: "/vorgestellt", label: t("featured"), icon: Store },
  ]

  return (
    <>
      <Navbar navLinks={navLinks} />
      <BottomNav navLinks={navLinks} />
    </>
  )
}
