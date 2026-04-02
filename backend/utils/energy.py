"""Pure conversion functions for energy calculations. No I/O, no state."""


def area_to_panel_count(area_m2: float, panel_area_m2: float = 1.95) -> int:
    """How many solar panels fit in a given area. Assumes 70% usable space (spacing, access)."""
    usable = area_m2 * 0.70
    return int(usable / panel_area_m2)


def panels_to_kwh_per_day(
    panel_count: int,
    panel_watt: int = 400,
    kwh_per_kwp_per_day: float = 3.55,
) -> float:
    """Daily kWh output from N panels. Default: April Amsterdam (3.55 kWh/kWp/day)."""
    kwp = (panel_count * panel_watt) / 1000
    return kwp * kwh_per_kwp_per_day


def wind_kwh_per_day(avg_wind_m_s: float, rotor_diameter_m: float = 5.0) -> float:
    """Rough daily wind energy estimate using simplified power curve.
    P = 0.5 * rho * A * v^3 * Cp * eta
    rho=1.225, Cp=0.35, eta=0.9
    """
    import math

    rho = 1.225
    area = math.pi * (rotor_diameter_m / 2) ** 2
    cp = 0.35
    eta = 0.9
    power_w = 0.5 * rho * area * (avg_wind_m_s ** 3) * cp * eta
    return (power_w / 1000) * 24  # kWh per day


def battery_units_needed(evening_demand_kwh: float, unit_capacity_kwh: float = 13.5) -> int:
    """Number of battery units to cover evening/night demand."""
    import math

    return math.ceil(evening_demand_kwh / unit_capacity_kwh)


def visitors_per_kwh(energy_kwh_per_visitor_per_day: float = 2.3) -> float:
    """How many visitors one kWh can support per day."""
    return 1.0 / energy_kwh_per_visitor_per_day


def solar_hourly_profile(daily_total_kwh: float) -> dict[str, float]:
    """Distribute daily solar output across hours using a bell curve peaking at 13:00.
    Returns hour string → kWh.
    """
    weights = {
        "06:00": 0.02, "07:00": 0.04, "08:00": 0.07, "09:00": 0.10,
        "10:00": 0.12, "11:00": 0.14, "12:00": 0.15, "13:00": 0.14,
        "14:00": 0.12, "15:00": 0.10, "16:00": 0.07, "17:00": 0.04,
        "18:00": 0.02,
    }
    total_weight = sum(weights.values())
    return {
        hour: round((w / total_weight) * daily_total_kwh, 1)
        for hour, w in weights.items()
    }
