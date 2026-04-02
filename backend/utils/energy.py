"""Pure energy conversion functions. No I/O, no state, no dataset access."""

import math


HYDROGEN_GENERATOR_KW = 100
ENERGY_PER_VISITOR_PER_DAY_KWH = 0.5
STAGE_KW_PER_1000_M2 = 7
OCCUPANCY_FACTOR = 0.6
HOURS_PER_DAY = 14

# Dutch grid renewable share by month (approximate, based on solar/wind mix)
# Summer months have more solar → higher renewable share
# Winter months have more wind but less solar → lower overall
GRID_RENEWABLE_BY_MONTH = {
    1: 0.30, 2: 0.32, 3: 0.36, 4: 0.40, 5: 0.45, 6: 0.50,
    7: 0.48, 8: 0.45, 9: 0.38, 10: 0.34, 11: 0.30, 12: 0.28,
}

DEMAND_WEIGHTS = {
    "10:00": 0.02, "11:00": 0.03, "12:00": 0.04, "13:00": 0.05,
    "14:00": 0.06, "15:00": 0.07, "16:00": 0.08, "17:00": 0.10,
    "18:00": 0.12, "19:00": 0.13, "20:00": 0.12, "21:00": 0.10,
    "22:00": 0.05, "23:00": 0.03,
}
DEMAND_TOTAL_WEIGHT = sum(DEMAND_WEIGHTS.values())

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def grid_renewable_share(month: int) -> float:
    """Grid renewable fraction for a given month (1-12)."""
    return GRID_RENEWABLE_BY_MONTH.get(month, 0.40)


def battery_units_needed(kwh_needed: float, unit_capacity_kwh: float = 13.5) -> int:
    if kwh_needed <= 0:
        return 0
    return math.ceil(kwh_needed / unit_capacity_kwh)


def calc_renewable_percent(grid_kwh: float, hydrogen_kwh: float, battery_kwh: float, ren_share: float = 0.40) -> float:
    """Calculate renewable % of energy mix.
    ren_share: fraction of grid energy that's renewable (varies by month).
    """
    total = grid_kwh + hydrogen_kwh + battery_kwh
    if total == 0:
        return 0
    non_battery = grid_kwh + hydrogen_kwh
    if non_battery > 0:
        bat_ren = battery_kwh * (hydrogen_kwh + grid_kwh * ren_share) / non_battery
    else:
        bat_ren = 0
    renewable = hydrogen_kwh + grid_kwh * ren_share + bat_ren
    return round(renewable / total * 100, 1)


def stage_energy(area_m2: float) -> float:
    stage_area = area_m2 * 0.30
    return (stage_area / 1000) * STAGE_KW_PER_1000_M2 * 10


def daily_supply(grid_kw: int, h2_units: int, battery_count: int, duration_days: int = 1) -> tuple[float, float, float]:
    """Returns (grid_kwh, h2_kwh, battery_kwh) per day.

    Battery contribution accounts for cycling:
    - Day 1: only discharge (start at 50% SOC) = 50% of capacity
    - Day 2+: full charge overnight from grid + discharge = 90% of capacity (round-trip efficiency)
    - Single day average or multi-day average is weighted accordingly
    """
    grid_kwh = grid_kw * HOURS_PER_DAY
    h2_kwh = h2_units * HYDROGEN_GENERATOR_KW * HOURS_PER_DAY

    raw_capacity = battery_count * 13.5
    if duration_days <= 1:
        # Single day: only initial charge available (50% SOC)
        effective_battery = raw_capacity * 0.50
    else:
        # Multi-day: day 1 = 50%, subsequent days = 90% (overnight charge, round-trip efficiency)
        day1 = raw_capacity * 0.50
        subsequent = raw_capacity * 0.90 * (duration_days - 1)
        effective_battery = (day1 + subsequent) / duration_days

    return (grid_kwh, h2_kwh, effective_battery)


def max_visitors_from_energy(available_kwh: float) -> int:
    if available_kwh <= 0:
        return 0
    return int(available_kwh / (ENERGY_PER_VISITOR_PER_DAY_KWH * OCCUPANCY_FACTOR))


def max_visitors_from_space(area_m2: float, m2_per_person: float) -> int:
    return int(area_m2 * 0.70 / m2_per_person)


def find_max_grid_for_renewable_target(
    grid_kw: int, h2_daily_kwh: float, bat_kwh: float, target_pct: float, ren_share: float = 0.40,
) -> int:
    for candidate_kw in range(grid_kw, -1, -10):
        candidate_kwh = candidate_kw * HOURS_PER_DAY
        if candidate_kwh + h2_daily_kwh + bat_kwh == 0:
            continue
        pct = calc_renewable_percent(candidate_kwh, h2_daily_kwh, bat_kwh, ren_share)
        if pct >= target_pct:
            return candidate_kw
    return 0


def get_wind_speed(month: int, dataset: dict) -> float:
    """Get average wind speed for a month from dataset."""
    wind_data = dataset.get("wind_data_amsterdam", {})
    monthly = wind_data.get("monthly_avg_m_per_s", {})
    name = MONTH_NAMES[month - 1]
    return monthly.get(name, 5.5)


def get_amsterdam_daily_demand_mwh(month: int, day: int, load_profile: dict) -> float:
    """Get Amsterdam daily demand in MWh for a specific date from NEDU data."""
    daily_data = load_profile.get("amsterdam_daily_MWh", [])
    target = f"2025-{month:02d}-{day:02d}"
    for entry in daily_data:
        if entry["date"] == target:
            return entry["MWh"]
    # Fallback: average for the month
    month_entries = [e for e in daily_data if e["date"].startswith(f"2025-{month:02d}")]
    if month_entries:
        return sum(e["MWh"] for e in month_entries) / len(month_entries)
    return 16700  # annual average


def get_amsterdam_monthly_avg_demand_mwh(month: int, load_profile: dict) -> float:
    """Get Amsterdam average daily demand in MWh for a given month."""
    daily_data = load_profile.get("amsterdam_daily_MWh", [])
    month_entries = [e for e in daily_data if e["date"].startswith(f"2025-{month:02d}")]
    if month_entries:
        return sum(e["MWh"] for e in month_entries) / len(month_entries)
    return 16700


def get_nedu_hourly_profile(month: int, load_profile: dict) -> dict[str, float]:
    """Get the NEDU hourly consumption profile for a month (kWh per household).
    Returns hour -> kWh.
    """
    profiles = load_profile.get("monthly_hourly_profiles_kWh_per_household", {})
    return profiles.get(str(month), {})


def get_hourly_prices(month: int, dataset: dict) -> dict[str, float]:
    """Get hourly prices for the appropriate season."""
    prices = dataset.get("electricity_prices_netherlands", {})
    if month in (4, 5, 6, 7, 8, 9):  # April-September = summer profile
        return prices.get("typical_summer_day_hourly_EUR_MWh", {}).get("hours", {})
    return prices.get("typical_winter_day_hourly_EUR_MWh", {}).get("hours", {})
