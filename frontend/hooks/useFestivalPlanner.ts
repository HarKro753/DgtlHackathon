"use client";

import { useState, useCallback, useRef } from "react";
import { useFestivalPlan } from "./useFestivalPlan";
import type { PolygonPoint } from "@/components/Map";
import type { Overrides } from "@/types/festival";

export function useFestivalPlanner() {
  const { plan, loading, error, fetchPlan } = useFestivalPlan();
  const [duration, setDuration] = useState(2);
  const [month, setMonth] = useState(4);
  const [mode, setMode] = useState<"visitors" | "renewable">("visitors");
  const [targetRenewable, setTargetRenewable] = useState(50);
  const [targetVisitors, setTargetVisitors] = useState(20000);
  const [selectedArea, setSelectedArea] = useState<{ lat: number; lng: number; area_m2: number } | null>(null);
  const [polygon, setPolygon] = useState<PolygonPoint[]>([]);
  const overridesRef = useRef<Overrides>({
    hydrogen_generators: null,
    battery_units: null,
    solar_panels: null,
    m2_per_person: null,
  });

  const buildRequest = useCallback((
    area: { lat: number; lng: number; area_m2: number },
    dur: number, mon: number, m: "visitors" | "renewable",
    tRen: number, tVis: number, ov: Overrides,
  ) => ({
    ...area,
    duration_days: dur,
    month: mon,
    mode: m,
    target_renewable_percent: m === "visitors" ? tRen : null,
    target_visitors: m === "renewable" ? tVis : null,
    ...ov,
  }), []);

  const refetch = useCallback(() => {
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  const handleAreaSelected = useCallback(
    (lat: number, lng: number, area_m2: number, points: PolygonPoint[]) => {
      const area = { lat, lng, area_m2 };
      setSelectedArea(area);
      setPolygon(points);
      fetchPlan(buildRequest(area, duration, month, mode, targetRenewable, targetVisitors, overridesRef.current));
    },
    [duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]
  );

  const handleTweak = useCallback(
    (ov: Overrides) => {
      overridesRef.current = ov;
      if (selectedArea) {
        fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, targetVisitors, ov));
      }
    },
    [selectedArea, duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]
  );

  const handleApplyNudge = useCallback(
    (action: string, value: number) => {
      if (action === "target_visitors") {
        setTargetVisitors(value);
        if (selectedArea) {
          fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, value, overridesRef.current));
        }
        return;
      }
      if (action === "target_renewable_percent") {
        setTargetRenewable(value);
        if (selectedArea) {
          fetchPlan(buildRequest(selectedArea, duration, month, mode, value, targetVisitors, overridesRef.current));
        }
        return;
      }
      const next = { ...overridesRef.current, [action]: value } as Overrides;
      overridesRef.current = next;
      if (selectedArea) {
        fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, targetVisitors, next));
      }
    },
    [selectedArea, duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]
  );

  const handleDurationChange = useCallback((d: number) => {
    setDuration(d);
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, d, month, mode, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  const handleMonthChange = useCallback((m: number) => {
    setMonth(m);
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, duration, m, mode, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, duration, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  const handleModeChange = useCallback((m: "visitors" | "renewable") => {
    setMode(m);
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, duration, month, m, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, duration, month, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  const handleRenewableTargetChange = useCallback((pct: number) => {
    setTargetRenewable(pct);
  }, []);

  const handleRenewableTargetCommit = useCallback(() => {
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  const handleVisitorTargetChange = useCallback((v: number) => {
    setTargetVisitors(v);
  }, []);

  const handleVisitorTargetCommit = useCallback(() => {
    if (selectedArea) {
      fetchPlan(buildRequest(selectedArea, duration, month, mode, targetRenewable, targetVisitors, overridesRef.current));
    }
  }, [selectedArea, duration, month, mode, targetRenewable, targetVisitors, fetchPlan, buildRequest]);

  return {
    plan, loading, error, polygon,
    duration, month, mode, targetRenewable, targetVisitors,
    handleAreaSelected,
    handleTweak,
    handleApplyNudge,
    handleDurationChange,
    handleMonthChange,
    handleModeChange,
    handleRenewableTargetChange,
    handleRenewableTargetCommit,
    handleVisitorTargetChange,
    handleVisitorTargetCommit,
  };
}
