"""Solar energy calculation service. Uses PVGIS dataset coefficients."""

from utils.energy import area_to_panel_count, panels_to_kwh_per_day, solar_hourly_profile


def calculate_solar_potential(
    area_m2: float,
    month: int,
    dataset: dict,
    solar_area_fraction: float = 0.15,
) -> dict:
    """Calculate solar energy potential for a given area and month.

    solar_area_fraction: fraction of total festival area usable for solar panels (rooftops, dedicated zones).
    Default 15% — festival needs most space for stages, crowd, vendors.
    """
    solar_data = dataset["solar_irradiance_amsterdam"]
    monthly = solar_data["monthly"]
    month_data = next(m for m in monthly if m["month"] == month)

    kwh_per_kwp_per_day = month_data["pv_output_kWh_day"]
    panel_specs = dataset["solar_panel_specs"]["residential_panel"]
    panel_area = panel_specs["dimensions_m"]["area_m2"]
    panel_watt = panel_specs["peak_power_W"]
    cost_per_panel = panel_specs["cost_EUR_per_panel"]

    available_solar_area = area_m2 * solar_area_fraction
    panel_count = area_to_panel_count(available_solar_area, panel_area)
    daily_kwh = panels_to_kwh_per_day(panel_count, panel_watt, kwh_per_kwp_per_day)
    hourly = solar_hourly_profile(daily_kwh)

    return {
        "panel_count": panel_count,
        "solar_area_m2": available_solar_area,
        "daily_kwh": round(daily_kwh, 1),
        "hourly_kwh": hourly,
        "cost_eur": panel_count * cost_per_panel,
        "kwh_per_kwp_per_day": kwh_per_kwp_per_day,
    }
