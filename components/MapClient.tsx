"use client"

import dynamic from "next/dynamic"

import MapConsent from "@/components/MapConsent"
import type { MapPickerProps } from "@/components/MapPicker"

const DynamicMapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="map-shell h-[320px] animate-pulse bg-secondary/60" />
  ),
})

export default function MapClient(props: MapPickerProps) {
  return (
    <MapConsent className={props.className}>
      <DynamicMapPicker {...props} />
    </MapConsent>
  )
}
