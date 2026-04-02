"""Hourly energy dispatch — determines which source powers each hour."""

from utils.energy import DEMAND_WEIGHTS, DEMAND_TOTAL_WEIGHT


def compute_hourly_mix(
    daily_demand_kwh: float,
    grid_kw: int,
    hydrogen_kw: float,
    battery_capacity_kwh: float,
    prices: dict[str, float],
    ren_share: float = 0.40,
    nedu_profile: dict[str, float] | None = None,
) -> list[dict]:
    """Dispatch energy sources per hour based on merit order.

    If nedu_profile is provided, uses the NEDU consumption shape for the month
    instead of the hardcoded demand weights. This gives a real-data-backed
    demand curve that varies by month.
    """
    # Use NEDU profile shape if available, otherwise fall back to hardcoded weights
    if nedu_profile and len(nedu_profile) > 0:
        # NEDU profile is kWh per household per hour — use as relative weights
        weights = {}
        for hour_str, kwh in nedu_profile.items():
            # Only include festival operating hours (10:00-23:00)
            h = int(hour_str.split(":")[0])
            if 10 <= h <= 23:
                weights[hour_str] = kwh
        if not weights:
            weights = DEMAND_WEIGHTS
        total_weight = sum(weights.values())
    else:
        weights = DEMAND_WEIGHTS
        total_weight = DEMAND_TOTAL_WEIGHT

    hours = sorted(weights.keys())
    result = []
    battery_soc = battery_capacity_kwh * 0.5

    for hour in hours:
        demand = (weights[hour] / total_weight) * daily_demand_kwh
        price = prices.get(hour, 80)

        grid_used = min(demand, grid_kw)
        remaining = demand - grid_used
        h2_used = 0.0

        if price > 100 and hydrogen_kw > 0:
            h2_shift = min(grid_used * 0.5, hydrogen_kw)
            grid_used -= h2_shift
            h2_used += h2_shift

        if remaining > 0:
            h2_add = min(remaining, hydrogen_kw - h2_used)
            h2_used += h2_add
            remaining -= h2_add

        battery_used = 0.0
        if remaining > 0 and battery_soc > 0:
            battery_used = min(remaining, battery_soc, battery_capacity_kwh * 0.25)
            battery_soc -= battery_used

        surplus = (grid_kw + hydrogen_kw) - demand
        if surplus > 0 and battery_soc < battery_capacity_kwh:
            battery_soc += min(surplus * 0.5, battery_capacity_kwh - battery_soc)

        result.append({
            "hour": hour,
            "demand": round(demand, 1),
            "grid_renewable": round(grid_used * ren_share, 1),
            "grid_fossil": round(grid_used * (1 - ren_share), 1),
            "hydrogen": round(h2_used, 1),
            "battery": round(battery_used, 1),
            "price": price,
        })

    return result
