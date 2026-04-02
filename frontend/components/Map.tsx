"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  onAreaSelected: (lat: number, lng: number, area_m2: number) => void;
}

const NDSM_CENTER: [number, number] = [52.3984, 4.8932];
const DEFAULT_ZOOM = 15;

export function Map({ onAreaSelected }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const [drawing, setDrawing] = useState(false);
  const startPointRef = useRef<L.LatLng | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(NDSM_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Draw rectangle on click+drag
    map.on("mousedown", (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.shiftKey) {
        map.dragging.disable();
        startPointRef.current = e.latlng;
        setDrawing(true);

        if (rectangleRef.current) {
          map.removeLayer(rectangleRef.current);
        }
      }
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      if (!startPointRef.current) return;

      const bounds = L.latLngBounds(startPointRef.current, e.latlng);

      if (rectangleRef.current) {
        rectangleRef.current.setBounds(bounds);
      } else {
        rectangleRef.current = L.rectangle(bounds, {
          color: "#22c55e",
          weight: 2,
          fillOpacity: 0.2,
        }).addTo(map);
      }
    });

    map.on("mouseup", () => {
      if (!startPointRef.current || !rectangleRef.current) {
        map.dragging.enable();
        return;
      }

      map.dragging.enable();
      setDrawing(false);

      const bounds = rectangleRef.current.getBounds();
      const center = bounds.getCenter();

      // Calculate area in m2
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const width = ne.distanceTo(L.latLng(ne.lat, sw.lng));
      const height = ne.distanceTo(L.latLng(sw.lat, ne.lng));
      const area = width * height;

      startPointRef.current = null;
      onAreaSelected(center.lat, center.lng, area);
    });

    // Add NDSM marker
    L.marker(NDSM_CENTER)
      .addTo(map)
      .bindPopup("NDSM Wharf — DGTL Festival")
      .openPopup();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onAreaSelected]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      <div className="absolute top-3 left-12 z-[1000] bg-black/70 text-white px-3 py-1.5 rounded text-sm">
        Hold <kbd className="bg-white/20 px-1 rounded">Shift</kbd> + drag to select area
      </div>
      {drawing && (
        <div className="absolute top-3 right-3 z-[1000] bg-green-500 text-white px-3 py-1.5 rounded text-sm animate-pulse">
          Drawing...
        </div>
      )}
    </div>
  );
}
