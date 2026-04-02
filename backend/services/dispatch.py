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
    solar_hourly: dict[str, float] | None = None,
) -> list[dict]:
    """Dispatch energy sources per hour. Merit order:
    1. Solar (free, 100% renewable, but only during daylight)
    2. Grid (always-on base load, partially renewable)
    3. Hydrogen (on-demand, 100% renewable, expensive)
    4. Battery (peak shaving buffer)
    """
    if nedu_profile and len(nedu_profile) > 0:
        weights = {h: v for h, v in nedu_profile.items() if 10 <= int(h.split(":")[0]) <= 23}
        if not weights:
            weights = DEMAND_WEIGHTS
        total_weight = sum(weights.values())
    else:
        weights = DEMAND_WEIGHTS
        total_weight = DEMAND_TOTAL_WEIGHT

    hours = sorted(weights.keys())
    result = []
    battery_soc = battery_capacity_kwh * 0.5
    solar = solar_hourly or {}

    for hour in hours:
        demand = (weights[hour] / total_weight) * daily_demand_kwh
        price = prices.get(hour, 80)
        solar_available = solar.get(hour, 0)

        # 1. Solar first (free, renewable)
        solar_used = min(solar_available, demand)
        remaining = demand - solar_used

        # 2. Grid covers base
        grid_used = min(remaining, grid_kw)
        remaining -= grid_used

        # High price: shift grid to hydrogen
        h2_used = 0.0
        if price > 100 and hydrogen_kw > 0:
            h2_shift = min(grid_used * 0.5, hydrogen_kw)
            grid_used -= h2_shift
            h2_used += h2_shift

        # 3. Hydrogen covers remaining
        if remaining > 0:
            h2_add = min(remaining, hydrogen_kw - h2_used)
            h2_used += h2_add
            remaining -= h2_add

        # 4. Battery covers peaks
        battery_used = 0.0
        if remaining > 0 and battery_soc > 0:
            battery_used = min(remaining, battery_soc, battery_capacity_kwh * 0.25)
            battery_soc -= battery_used

        # Charge battery from surplus (solar + grid surplus)
        total_supply = solar_available + grid_kw + hydrogen_kw
        surplus = total_supply - demand
        if surplus > 0 and battery_soc < battery_capacity_kwh:
            battery_soc += min(surplus * 0.5, battery_capacity_kwh - battery_soc)

        result.append({
            "hour": hour,
            "demand": round(demand, 1),
            "solar": round(solar_used, 1),
            "grid_renewable": round(grid_used * ren_share, 1),
            "grid_fossil": round(grid_used * (1 - ren_share), 1),
            "hydrogen": round(h2_used, 1),
            "battery": round(battery_used, 1),
            "price": price,
        })

    return result
