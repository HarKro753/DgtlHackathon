"use client";

import { useState, useCallback } from "react";
import type { FestivalPlan, PlanRequest } from "@/types/festival";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useFestivalPlan() {
  const [plan, setPlan] = useState<FestivalPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async (request: PlanRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { plan, loading, error, fetchPlan };
}
