"use client"

import { divIcon, type LatLngExpression } from "leaflet"
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import type { MapMarker } from "@/lib/types"
import { cn } from "@/lib/utils"

const defaultCenter: [number, number] = [54.0733, 9.9833]

const markerIcon = divIcon({
  className: "",
  html: '<span style="display:block;height:18px;width:18px;border-radius:9999px;background:#5BA55B;border:3px solid rgba(255,255,255,0.9);box-shadow:0 8px 24px rgba(0,0,0,0.28)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function ClickHandler({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange?: (value: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event) {
      if (!enabled || !onChange) {
        return
      }

      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    },
  })

  return null
}

export interface MapPickerProps {
  center?: [number, number]
  zoom?: number
  value?: { lat: number; lng: number } | null
  onChange?: (value: { lat: number; lng: number }) => void
  markers?: MapMarker[]
  interactive?: boolean
  className?: string
}

export default function MapPicker({
  center = defaultCenter,
  zoom = 13,
  value,
  onChange,
  markers = [],
  interactive = false,
  className,
}: MapPickerProps) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations("common")
  const mounted = typeof window !== "undefined"

  const tileUrl =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

  const mapCenter = value
    ? ([value.lat, value.lng] as LatLngExpression)
    : markers[0]
      ? ([markers[0].lat, markers[0].lng] as LatLngExpression)
      : (center as LatLngExpression)

  if (!mounted) {
    return (
      <div
        className={cn(
          "map-shell flex h-[320px] items-center justify-center text-sm text-muted-foreground",
          className
        )}
      >
        {t("loadingMap")}…
      </div>
    )
  }

  return (
    <div className={cn("map-shell h-[320px]", className)}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap-Mitwirkende"
          url={tileUrl}
        />
        <ClickHandler enabled={interactive} onChange={onChange} />

        {value ? (
          <Marker position={[value.lat, value.lng]} icon={markerIcon} />
        ) : null}

        {!value
          ? markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={markerIcon}
              >
                <Tooltip>{marker.title}</Tooltip>
              </Marker>
            ))
          : null}
      </MapContainer>
    </div>
  )
}
