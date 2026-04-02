"""Auto-size infrastructure based on area and constraints."""

import math

from utils.energy import (
    HYDROGEN_GENERATOR_KW,
    HOURS_PER_DAY,
    battery_units_needed,
    calc_renewable_percent,
    grid_renewable_share,
)


def auto_h2_generators(area_m2: float) -> int:
    """Default H2 generators based on area. 1 per 150,000 m²."""
    return max(1, math.ceil(area_m2 / 150000))


def auto_battery_count(grid_kw: int, h2_units: int) -> int:
    """Default battery count — 10% buffer of total base supply."""
    grid_kwh = grid_kw * HOURS_PER_DAY
    h2_kwh = h2_units * HYDROGEN_GENERATOR_KW * HOURS_PER_DAY
    return battery_units_needed((grid_kwh + h2_kwh) * 0.10, 13.5)


def h2_for_renewable_target(
    grid_daily_kwh: float, bat_kwh: float, target_pct: float,
) -> int:
    """Find minimum H2 generators to reach a renewable % target (for 'renewable' mode)."""
    for units in range(0, 21):
        h2_kwh = units * HYDROGEN_GENERATOR_KW * HOURS_PER_DAY
        pct = calc_renewable_percent(grid_daily_kwh, h2_kwh, bat_kwh)
        if pct >= target_pct:
            return units
    return 20


def h2_for_visitor_target(
    vis_target: int, stage_daily_kwh: float, grid_daily_kwh: float, bat_kwh: float,
) -> int:
    """Find H2 generators needed to support a visitor target + maximize renewable (for 'renewable' mode)."""
    from utils.energy import ENERGY_PER_VISITOR_PER_DAY_KWH, OCCUPANCY_FACTOR

    energy_needed = vis_target * ENERGY_PER_VISITOR_PER_DAY_KWH * OCCUPANCY_FACTOR + stage_daily_kwh
    remaining = max(0, energy_needed - grid_daily_kwh - bat_kwh)
    units = max(1, math.ceil(remaining / (HYDROGEN_GENERATOR_KW * HOURS_PER_DAY)))

    # Keep adding to push renewable higher
    while units < 20:
        h2_kwh = units * HYDROGEN_GENERATOR_KW * HOURS_PER_DAY
        pct = calc_renewable_percent(grid_daily_kwh, h2_kwh, bat_kwh)
        if pct >= 95:
            break
        units += 1

    return units
