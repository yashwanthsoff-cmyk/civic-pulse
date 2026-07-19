import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIB = '&copy; OpenStreetMap &copy; CARTO';

export type LeafletMapProps = {
  center: [number, number];
  zoom?: number;
  height?: number | string;
  pin?: { lat: number; lng: number };
  draggablePin?: boolean;
  onPinChange?: (lat: number, lng: number) => void;
  heatPoints?: Array<[number, number, number]>;
  heatGradient?: Record<number, string>;
  interactive?: boolean;
  className?: string;
};

export function LeafletMap({
  center, zoom = 14, height = 240, pin, draggablePin,
  onPinChange, heatPoints, heatGradient, interactive = true, className,
}: LeafletMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const heatRef = useRef<any>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Lmod = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;
      leafletRef.current = Lmod;
      const map = Lmod.map(ref.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        touchZoom: interactive,
        attributionControl: true,
      }).setView(center, zoom);
      Lmod.tileLayer(DARK_TILES, { attribution: ATTRIB, maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const Lmod = leafletRef.current;
    if (!map || !pin || !Lmod) return;
    const icon = Lmod.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #0a0a0a;box-shadow:0 0 0 2px #fff,0 6px 16px rgba(0,0,0,0.6);"></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    if (!markerRef.current) {
      markerRef.current = Lmod.marker([pin.lat, pin.lng], { icon, draggable: !!draggablePin }).addTo(map);
      if (draggablePin) {
        markerRef.current.on("dragend", (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          onPinChange?.(ll.lat, ll.lng);
        });
      }
    } else {
      markerRef.current.setLatLng([pin.lat, pin.lng]);
    }
  }, [pin, draggablePin, onPinChange, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const Lmod = leafletRef.current;
    if (!map || !heatPoints || !Lmod) return;
    (async () => {
      await import("leaflet.heat");
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
      if (heatPoints.length === 0) return;
      heatRef.current = (Lmod as any).heatLayer(heatPoints, {
        radius: 45, blur: 35, maxZoom: 17, minOpacity: 0.55,
        gradient: heatGradient || { 0.1: "#4ade80", 0.4: "#fbbf24", 0.7: "#f87171", 1.0: "#ffffff" },
      }).addTo(map);    })();
  }, [heatPoints, heatGradient, ready]);

  return <div ref={ref} className={className} style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }} />;
}