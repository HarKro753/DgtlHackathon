"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PolygonPoint {
  lat: number;
  lng: number;
}

interface MapProps {
  onAreaSelected: (lat: number, lng: number, area_m2: number, polygon: PolygonPoint[]) => void;
}

const NDSM_CENTER: [number, number] = [52.3984, 4.8932];
const DEFAULT_ZOOM = 16;

// DGTL festival area polygon (actual area from user-drawn polygon)
const DGTL_POLYGON: [number, number][] = [
  [52.402956, 4.894506],
  [52.401024, 4.892017],
  [52.398566, 4.891191],
  [52.398749, 4.895289],
  [52.399837, 4.897585],
  [52.400859, 4.899001],
];

const START_MARKER_ICON = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);cursor:pointer;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function calculatePolygonArea(latlngs: L.LatLng[]): number {
  if (latlngs.length < 3) return 0;
  const ref = latlngs[0];
  const points = latlngs.map((ll) => ({
    x: ref.distanceTo(L.latLng(ref.lat, ll.lng)) * (ll.lng > ref.lng ? 1 : -1),
    y: ref.distanceTo(L.latLng(ll.lat, ref.lng)) * (ll.lat > ref.lat ? 1 : -1),
  }));
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function getPolygonCenter(latlngs: L.LatLng[]): L.LatLng {
  const lat = latlngs.reduce((sum, ll) => sum + ll.lat, 0) / latlngs.length;
  const lng = latlngs.reduce((sum, ll) => sum + ll.lng, 0) / latlngs.length;
  return L.latLng(lat, lng);
}

export function Map({ onAreaSelected }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  const pointsRef = useRef<L.LatLng[]>([]);
  const tempLineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const pointMarkersRef = useRef<L.CircleMarker[]>([]);

  const onAreaSelectedRef = useRef(onAreaSelected);
  onAreaSelectedRef.current = onAreaSelected;

  const clearDrawingLayers = useCallback((map: L.Map) => {
    if (tempLineRef.current) {
      map.removeLayer(tempLineRef.current);
      tempLineRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    pointMarkersRef.current.forEach((m) => map.removeLayer(m));
    pointMarkersRef.current = [];
  }, []);

  const finishPolygon = useCallback(
    (map: L.Map, latlngs: L.LatLng[]) => {
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
      }
      clearDrawingLayers(map);

      polygonRef.current = L.polygon(latlngs, {
        color: "#22c55e",
        weight: 2,
        fillOpacity: 0.2,
      }).addTo(map);

      const center = getPolygonCenter(latlngs);
      const area = calculatePolygonArea(latlngs);
      const points = latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
      onAreaSelectedRef.current(center.lat, center.lng, area, points);
    },
    [clearDrawingLayers],
  );

  const cancelDrawing = useCallback(() => {
    drawingRef.current = false;
    setDrawing(false);
    pointsRef.current = [];
    if (mapRef.current) {
      clearDrawingLayers(mapRef.current);
    }
  }, [clearDrawingLayers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { doubleClickZoom: false }).setView(
      NDSM_CENTER,
      DEFAULT_ZOOM,
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Pre-select DGTL area
    const dgtlLatLngs = DGTL_POLYGON.map(([lat, lng]) => L.latLng(lat, lng));
    finishPolygon(map, dgtlLatLngs);

    // Double-click to start drawing
    map.on("dblclick", (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current) {
        // Start new polygon
        drawingRef.current = true;
        setDrawing(true);
        pointsRef.current = [e.latlng];

        if (polygonRef.current) {
          map.removeLayer(polygonRef.current);
          polygonRef.current = null;
        }

        // Place start marker (clicking it closes the polygon)
        startMarkerRef.current = L.marker(e.latlng, { icon: START_MARKER_ICON })
          .addTo(map)
          .bindTooltip("Click to close polygon", {
            direction: "top",
            offset: [0, -12],
          });

        startMarkerRef.current.on("click", () => {
          if (drawingRef.current && pointsRef.current.length >= 3) {
            drawingRef.current = false;
            setDrawing(false);
            finishPolygon(map, [...pointsRef.current]);
            pointsRef.current = [];
          }
        });
      }
    });

    // Single click to add points while drawing
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return;

      pointsRef.current.push(e.latlng);

      // Add small dot at each point
      const dot = L.circleMarker(e.latlng, {
        radius: 5,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      pointMarkersRef.current.push(dot);

      // Update temp polyline
      if (tempLineRef.current) {
        map.removeLayer(tempLineRef.current);
      }
      tempLineRef.current = L.polyline(pointsRef.current, {
        color: "#22c55e",
        weight: 2,
        dashArray: "5, 10",
      }).addTo(map);
    });

    // ESC to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawingRef.current) {
        cancelDrawing();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      map.remove();
      mapRef.current = null;
    };
  }, [finishPolygon, clearDrawingLayers, cancelDrawing]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      <div className="absolute top-3 left-12 z-[1000] bg-black/70 text-white px-3 py-1.5 rounded text-sm">
        {drawing
          ? "Click to add points · click green start marker to close · ESC to cancel"
          : "Double-click to start drawing a polygon"}
      </div>
    </div>
  );
}
