import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false, follow: false },
}

export default function ImprintPage() {
  return (
    <section className="bubble-card space-y-6">
      <h1 className="section-title">Impressum</h1>

      <div className="space-y-1 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>Sandro Hildebrand</p>
        <p>c/o IP-Management #9905</p>
        <p>Ludwig-Erhard-Straße 18</p>
        <p>20459 Hamburg</p>
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Kontakt</h2>
        <p className="text-sm text-muted-foreground">
          E-Mail:{" "}
          <a
            href="mailto:kontakt@mynms.de"
            className="underline underline-offset-2 hover:text-foreground"
          >
            kontakt@mynms.de
          </a>
        </p>
      </div>
    </section>
  )
}
