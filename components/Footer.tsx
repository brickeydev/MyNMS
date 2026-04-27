import Image from "next/image"
import { Mail } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export default async function Footer() {
  const t = await getTranslations()

  return (
    <footer className="mt-10 border-t border-border/70 bg-card/70 pb-24 md:pb-8">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2 md:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4 md:items-start">
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
          <p className="max-w-sm text-center text-sm leading-6 text-muted-foreground md:text-left">
            {t("footer.description")}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3 md:items-end">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {t("footer.contactTitle")}
          </h2>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a
              href="mailto:kontakt@mynms.de"
              className="rounded-full border border-border p-2 hover:text-foreground"
              aria-label="E-Mail"
            >
              <Mail className="size-4" />
            </a>
            <a
              href="https://github.com/brickeydev/MyNMS"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-2 hover:text-foreground"
              aria-label="GitHub"
            >
              <GitHubIcon className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 border-t border-border/70 px-4 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <span>{t("footer.copyright")}</span>
        <div className="flex items-center gap-4">
          <Link href="/impressum" className="hover:text-foreground">
            {t("footer.imprint")}
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground">
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  )
}
