"""Core optimizer: given supply constraints, calculate maximum sustainable festival."""

import math

from models.festival import (
    CostEstimate,
    EnergyBreakdown,
    EnergySource,
    FestivalPlan,
    ResourceBreakdown,
)
from services.solar import calculate_solar_potential
from services.wind import calculate_wind_potential
from services.grid import check_grid_capacity
from utils.energy import battery_units_needed


def compute_festival_plan(
    lat: float,
    lng: float,
    area_m2: float,
    duration_days: int,
    month: int,
    dataset: dict,
) -> FestivalPlan:
    """Compute the maximum sustainable festival for a given location and area.

    The hard constraint is 100% renewable energy. Everything else is derived.
    """
    # --- Supply side ---
    solar = calculate_solar_potential(area_m2, month, dataset)
    wind = calculate_wind_potential(month, dataset)
    grid = check_grid_capacity(lat, lng, dataset)

    # Grid contribution (renewable portion from grid, limited by congestion)
    grid_daily_kwh = grid["grid_available_kw"] * 12  # assume 12 useful hours/day

    total_daily_supply_kwh = solar["daily_kwh"] + wind["daily_kwh"] + grid_daily_kwh

    # --- Demand side (from DGTL measured data) ---
    consumption = dataset.get("festival_resource_consumption", {})
    energy_data = dataset.get("festival_energy_consumption", {})

    # Energy per visitor per day — all-inclusive (their share of stages, vendors, infrastructure)
    # Derived from DGTL: total energy / visitors. Using diesel-era baseline as upper bound.
    # 0.7L diesel/person/day = ~2.3 kWh (Powerful Thinking benchmark for large festivals)
    # DGTL optimized runs much lower. We use 0.5 kWh as a realistic optimized-but-not-extreme value.
    energy_per_visitor_day = 0.5

    # Max visitors from energy = total supply / per-visitor demand
    max_visitors = int(total_daily_supply_kwh / energy_per_visitor_day)

    # Also constrain by physical space: ~2 m2 per person for crowd comfort
    space_for_crowd = area_m2 * 0.60  # 60% of area for crowd (rest is infrastructure)
    max_by_space = int(space_for_crowd / 2.0)
    max_visitors = min(max_visitors, max_by_space)

    # --- Resource calculations ---
    water_per_person = consumption.get("water_per_person_per_day_liters", {}).get(
        "total_incl_sanitation_mid", 13
    )
    food_per_person = consumption.get("food_per_person_per_day", {}).get("mid_kg", 1.5)
    drinks_per_person = consumption.get("drinks_per_person_per_day", {}).get(
        "dgtl_drinks_per_visitor_kg", 2.25
    )
    waste_per_person = consumption.get("waste_per_person_per_day_kg", {}).get(
        "dgtl_visitor_waste_per_person_kg", 0.08
    )
    toilets_per_100 = consumption.get("sanitation", {}).get(
        "toilets_per_100_people_festival", 3
    )

    total_demand_kwh = (max_visitors * energy_per_visitor_day) * duration_days

    # --- Batteries for evening/night ---
    # Assume 40% of daily energy is needed after sunset (no solar)
    evening_demand = total_daily_supply_kwh * 0.40
    battery_count = battery_units_needed(evening_demand, 13.5)
    battery_capacity = battery_count * 13.5
    battery_cost = battery_count * 11000  # avg EUR per Powerwall

    # --- Energy sources breakdown ---
    total_supply_kwh = total_daily_supply_kwh * duration_days
    sources = [
        EnergySource(
            name="Solar",
            capacity_kWh=round(solar["daily_kwh"] * duration_days, 1),
            share_percent=round(solar["daily_kwh"] / total_daily_supply_kwh * 100, 1),
        ),
        EnergySource(
            name="Wind",
            capacity_kWh=round(wind["daily_kwh"] * duration_days, 1),
            share_percent=round(wind["daily_kwh"] / total_daily_supply_kwh * 100, 1),
        ),
        EnergySource(
            name="Grid (renewable)",
            capacity_kWh=round(grid_daily_kwh * duration_days, 1),
            share_percent=round(grid_daily_kwh / total_daily_supply_kwh * 100, 1),
        ),
    ]

    # --- Hourly pricing ---
    prices = dataset.get("electricity_prices_netherlands", {})
    summer_prices = prices.get("typical_summer_day_hourly_EUR_MWh", {}).get("hours", {})

    # --- Location name ---
    is_ndsm = (52.3 < lat < 52.5) and (4.8 < lng < 5.0)
    location_name = "NDSM Wharf, Amsterdam-Noord" if is_ndsm else f"{lat:.4f}, {lng:.4f}"

    return FestivalPlan(
        max_visitors=max_visitors,
        location_name=location_name,
        area_m2=area_m2,
        duration_days=duration_days,
        month=month,
        energy=EnergyBreakdown(
            total_supply_kWh=round(total_supply_kwh, 1),
            total_demand_kWh=round(total_demand_kwh, 1),
            sources=sources,
            solar_panels_count=solar["panel_count"],
            solar_area_m2=solar["solar_area_m2"],
            battery_units=battery_count,
            battery_capacity_kWh=round(battery_capacity, 1),
            hourly_solar_kWh=solar["hourly_kwh"],
            hourly_prices_eur_mwh=summer_prices,
        ),
        resources=ResourceBreakdown(
            water_liters_total=round(max_visitors * water_per_person * duration_days, 0),
            water_liters_per_person=water_per_person,
            food_kg_total=round(max_visitors * food_per_person * duration_days, 0),
            food_kg_per_person=food_per_person,
            drinks_kg_total=round(max_visitors * drinks_per_person * duration_days, 0),
            drinks_kg_per_person=drinks_per_person,
            waste_kg_total=round(max_visitors * waste_per_person * duration_days, 0),
            waste_kg_per_person=waste_per_person,
            toilets_required=math.ceil(max_visitors / 100 * toilets_per_100),
            human_waste_kg=round(max_visitors * 2.835 * duration_days, 0),  # 113400kg / 40000 visitors
        ),
        cost=CostEstimate(
            solar_panels_eur=solar["cost_eur"],
            batteries_eur=battery_cost,
            total_eur=solar["cost_eur"] + battery_cost,
        ),
        grid_congested=grid["congested"],
        renewable_percent=100.0,
    )
