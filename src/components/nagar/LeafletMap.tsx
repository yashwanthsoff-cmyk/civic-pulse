import { useEffect, useRef } from "react";
import L from "leaflet";
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
  interactive?: boolean;
  className?: string;
};

export function LeafletMap({
  center, zoom = 14, height = 240, pin, draggablePin,
  onPinChange, heatPoints, interactive = true, className,
}: LeafletMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const heatRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      touchZoom: interactive,
      attributionControl: true,
    }).setView(center, zoom);
    L.tileLayer(DARK_TILES, { attribution: ATTRIB, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pin) return;
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #0a0a0a;box-shadow:0 0 0 2px #fff,0 6px 16px rgba(0,0,0,0.6);"></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    if (!markerRef.current) {
      markerRef.current = L.marker([pin.lat, pin.lng], { icon, draggable: !!draggablePin }).addTo(map);
      if (draggablePin) {
        markerRef.current.on("dragend", (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          onPinChange?.(ll.lat, ll.lng);
        });
      }
    } else {
      markerRef.current.setLatLng([pin.lat, pin.lng]);
    }
  }, [pin, draggablePin, onPinChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !heatPoints) return;
    (async () => {
      await import("leaflet.heat");
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
      if (heatPoints.length === 0) return;
      heatRef.current = (L as any).heatLayer(heatPoints, {
        radius: 28, blur: 24, maxZoom: 17,
        gradient: { 0.2: "#4ade80", 0.5: "#fbbf24", 0.8: "#f87171", 1.0: "#ffffff" },
      }).addTo(map);
    })();
  }, [heatPoints]);

  return <div ref={ref} className={className} style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }} />;
}
