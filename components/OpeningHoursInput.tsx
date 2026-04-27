"use client"

import { useTranslations } from "next-intl"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DAYS_OF_WEEK, type DayOfWeek, type OpeningHours, type OpeningHoursDay } from "@/lib/types"
import { parseOpeningHours, formatOpeningHoursDisplay } from "@/lib/opening-hours"

export { parseOpeningHours, formatOpeningHoursDisplay }

interface Props {
  value: OpeningHours
  onChange: (value: OpeningHours) => void
}

export default function OpeningHoursInput({ value, onChange }: Props) {
  const t = useTranslations("openingHours")

  function updateDay(day: DayOfWeek, patch: Partial<OpeningHoursDay>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } })
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <div className="grid grid-cols-[6rem_1fr_1fr_1fr] items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>{t("day")}</span>
        <span>{t("open")}</span>
        <span>{t("from")}</span>
        <span>{t("to")}</span>
      </div>
      {DAYS_OF_WEEK.map((day) => {
        const d = value[day]
        return (
          <div
            key={day}
            className="grid grid-cols-[6rem_1fr_1fr_1fr] items-center gap-2"
          >
            <Label className="text-sm">{t(day)}</Label>

            <div className="flex items-center">
              <Checkbox
                id={`oh-open-${day}`}
                checked={d.open}
                onCheckedChange={(checked) =>
                  updateDay(day, { open: Boolean(checked) })
                }
              />
            </div>

            <Input
              type="time"
              value={d.from}
              disabled={!d.open}
              onChange={(e) => updateDay(day, { from: e.target.value })}
              className="h-8 rounded-xl text-sm"
            />

            <Input
              type="time"
              value={d.to}
              disabled={!d.open}
              onChange={(e) => updateDay(day, { to: e.target.value })}
              className="h-8 rounded-xl text-sm"
            />
          </div>
        )
      })}
    </div>
  )
}
