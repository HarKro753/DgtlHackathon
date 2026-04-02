"""Wind energy calculation service."""

from utils.energy import wind_kwh_per_day


MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def calculate_wind_potential(month: int, dataset: dict, num_turbines: int = 2) -> dict:
    """Estimate wind energy from small turbines at the location.

    Default: 2 small turbines with 5m rotor diameter (realistic for a festival site).
    """
    wind_data = dataset["wind_data_amsterdam"]
    month_name = MONTH_NAMES[month - 1]
    avg_wind = wind_data["monthly_avg_m_per_s"][month_name]

    daily_kwh_per_turbine = wind_kwh_per_day(avg_wind, rotor_diameter_m=5.0)
    total_daily_kwh = daily_kwh_per_turbine * num_turbines

    return {
        "avg_wind_m_s": avg_wind,
        "num_turbines": num_turbines,
        "daily_kwh": round(total_daily_kwh, 1),
    }
