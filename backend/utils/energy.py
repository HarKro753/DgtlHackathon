"""Pure energy conversion functions. No I/O, no state, no dataset access."""

import math


HYDROGEN_GENERATOR_KW = 100
ENERGY_PER_VISITOR_PER_DAY_KWH = 0.5
STAGE_KW_PER_1000_M2 = 7
GRID_RENEWABLE_SHARE = 0.40
OCCUPANCY_FACTOR = 0.6
HOURS_PER_DAY = 14  # festival operating hours

DEMAND_WEIGHTS = {
    "10:00": 0.02, "11:00": 0.03, "12:00": 0.04, "13:00": 0.05,
    "14:00": 0.06, "15:00": 0.07, "16:00": 0.08, "17:00": 0.10,
    "18:00": 0.12, "19:00": 0.13, "20:00": 0.12, "21:00": 0.10,
    "22:00": 0.05, "23:00": 0.03,
}
DEMAND_TOTAL_WEIGHT = sum(DEMAND_WEIGHTS.values())


def battery_units_needed(kwh_needed: float, unit_capacity_kwh: float = 13.5) -> int:
    if kwh_needed <= 0:
        return 0
    return math.ceil(kwh_needed / unit_capacity_kwh)


def calc_renewable_percent(grid_kwh: float, hydrogen_kwh: float, battery_kwh: float) -> float:
    total = grid_kwh + hydrogen_kwh + battery_kwh
    if total == 0:
        return 0
    non_battery = grid_kwh + hydrogen_kwh
    if non_battery > 0:
        bat_ren = battery_kwh * (hydrogen_kwh + grid_kwh * GRID_RENEWABLE_SHARE) / non_battery
    else:
        bat_ren = 0
    renewable = hydrogen_kwh + grid_kwh * GRID_RENEWABLE_SHARE + bat_ren
    return round(renewable / total * 100, 1)


def stage_energy(area_m2: float) -> float:
    """Daily stage energy in kWh. Caps stage area at 30% of total."""
    stage_area = area_m2 * 0.30
    return (stage_area / 1000) * STAGE_KW_PER_1000_M2 * 10


def daily_supply(grid_kw: int, h2_units: int, battery_count: int) -> tuple[float, float, float]:
    """Returns (grid_kwh, h2_kwh, battery_kwh) per day."""
    return (
        grid_kw * HOURS_PER_DAY,
        h2_units * HYDROGEN_GENERATOR_KW * HOURS_PER_DAY,
        battery_count * 13.5,
    )


def max_visitors_from_energy(available_kwh: float) -> int:
    if available_kwh <= 0:
        return 0
    return int(available_kwh / (ENERGY_PER_VISITOR_PER_DAY_KWH * OCCUPANCY_FACTOR))


def max_visitors_from_space(area_m2: float, m2_per_person: float) -> int:
    return int(area_m2 * 0.70 / m2_per_person)


def find_max_grid_for_renewable_target(
    grid_kw: int, h2_daily_kwh: float, bat_kwh: float, target_pct: float,
) -> int:
    """Find the maximum grid kW that keeps renewable % >= target.
    Returns the usable grid kW (may be less than available).
    """
    for candidate_kw in range(grid_kw, -1, -10):
        candidate_kwh = candidate_kw * HOURS_PER_DAY
        if candidate_kwh + h2_daily_kwh + bat_kwh == 0:
            continue
        pct = calc_renewable_percent(candidate_kwh, h2_daily_kwh, bat_kwh)
        if pct >= target_pct:
            return candidate_kw
    return 0
