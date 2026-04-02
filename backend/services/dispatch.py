"""Hourly energy dispatch — determines which source powers each hour."""

from utils.energy import DEMAND_WEIGHTS, DEMAND_TOTAL_WEIGHT


def compute_hourly_mix(
    daily_demand_kwh: float,
    grid_kw: int,
    hydrogen_kw: float,
    battery_capacity_kwh: float,
    prices: dict[str, float],
    ren_share: float = 0.40,
) -> list[dict]:
    """Dispatch energy sources per hour based on merit order:
    1. Grid is always-on base load
    2. Hydrogen kicks in when demand exceeds grid OR grid price > 100 €/MWh
    3. Battery discharges during peaks, charges during surplus
    """
    hours = sorted(DEMAND_WEIGHTS.keys())
    result = []
    battery_soc = battery_capacity_kwh * 0.5

    for hour in hours:
        demand = (DEMAND_WEIGHTS[hour] / DEMAND_TOTAL_WEIGHT) * daily_demand_kwh
        price = prices.get(hour, 80)

        grid_used = min(demand, grid_kw)
        remaining = demand - grid_used
        h2_used = 0.0

        # High price: shift grid load to hydrogen
        if price > 100 and hydrogen_kw > 0:
            h2_shift = min(grid_used * 0.5, hydrogen_kw)
            grid_used -= h2_shift
            h2_used += h2_shift

        # Hydrogen covers remaining
        if remaining > 0:
            h2_add = min(remaining, hydrogen_kw - h2_used)
            h2_used += h2_add
            remaining -= h2_add

        # Battery covers peaks
        battery_used = 0.0
        if remaining > 0 and battery_soc > 0:
            battery_used = min(remaining, battery_soc, battery_capacity_kwh * 0.25)
            battery_soc -= battery_used

        # Charge battery from surplus
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
