"""Orchestrator — wires infrastructure, energy, dispatch, and nudges together."""

import math

from models.festival import (
    CostEstimate,
    EnergyBreakdown,
    EnergySource,
    FestivalPlan,
    ResourceBreakdown,
)
from services.grid import check_grid_capacity
from services.dispatch import compute_hourly_mix
from services.infrastructure import auto_h2_generators, auto_battery_count, h2_for_visitor_target
from services.nudges import generate_nudges
from services.dataset import load_load_profile
from utils.energy import (
    HYDROGEN_GENERATOR_KW,
    HOURS_PER_DAY,
    ENERGY_PER_VISITOR_PER_DAY_KWH,
    calc_renewable_percent,
    daily_supply,
    stage_energy,
    max_visitors_from_energy,
    max_visitors_from_space,
    find_max_grid_for_renewable_target,
    grid_renewable_share,
    get_hourly_prices,
    get_amsterdam_monthly_avg_demand_mwh,
    get_nedu_hourly_profile,
)

HYDROGEN_GENERATOR_COST_EUR = 50000


def compute_festival_plan(
    lat: float, lng: float, area_m2: float, duration_days: int, month: int,
    dataset: dict,
    mode: str = "visitors",
    target_visitors: int | None = None,
    target_renewable_percent: float | None = None,
    hydrogen_generators_override: int | None = None,
    battery_units_override: int | None = None,
    grid_kw_override: int | None = None,
    m2_per_person_override: float | None = None,
    _skip_nudges: bool = False,
) -> FestivalPlan:
    grid = check_grid_capacity(lat, lng, dataset)
    consumption = dataset.get("festival_resource_consumption", {})

    # Month-dependent values from dataset
    ren_share = grid_renewable_share(month)
    hourly_prices = get_hourly_prices(month, dataset)

    grid_kw = grid_kw_override if grid_kw_override is not None else grid["grid_available_kw"]
    m2_pp = m2_per_person_override if m2_per_person_override is not None else 1.0
    stage_kwh = stage_energy(area_m2)

    # --- Infrastructure (fixed, area-based) ---
    h2_units = hydrogen_generators_override if hydrogen_generators_override is not None else auto_h2_generators(area_m2)
    bat_count = battery_units_override if battery_units_override is not None else auto_battery_count(grid_kw, h2_units)

    grid_kwh, h2_kwh, bat_kwh = daily_supply(grid_kw, h2_units, bat_count, duration_days)
    total_daily = grid_kwh + h2_kwh + bat_kwh
    space_limit = max_visitors_from_space(area_m2, m2_pp)

    if mode == "visitors":
        ren_target = target_renewable_percent if target_renewable_percent is not None else 50.0
        current_pct = calc_renewable_percent(grid_kwh, h2_kwh, bat_kwh, ren_share)

        if current_pct >= ren_target:
            usable_daily = total_daily
        else:
            usable_grid_kw = find_max_grid_for_renewable_target(grid_kw, h2_kwh, bat_kwh, ren_target, ren_share)
            grid_kwh = usable_grid_kw * HOURS_PER_DAY
            usable_daily = grid_kwh + h2_kwh + bat_kwh

        renewable_pct = calc_renewable_percent(grid_kwh, h2_kwh, bat_kwh, ren_share)
        available = max(0, usable_daily - stage_kwh)
        max_vis = min(max_visitors_from_energy(available), space_limit)

    else:  # mode == "renewable"
        vis_target = target_visitors if target_visitors is not None else 20000

        if hydrogen_generators_override is None:
            h2_units = h2_for_visitor_target(vis_target, stage_kwh, grid_kwh, bat_kwh)
            grid_kwh, h2_kwh, bat_kwh = daily_supply(grid_kw, h2_units, bat_count, duration_days)
            total_daily = grid_kwh + h2_kwh + bat_kwh

        renewable_pct = calc_renewable_percent(grid_kwh, h2_kwh, bat_kwh, ren_share)
        available = max(0, total_daily - stage_kwh)
        max_vis = min(max_visitors_from_energy(available), space_limit, vis_target)

    total_daily = grid_kwh + h2_kwh + bat_kwh

    # --- Nudges ---
    if _skip_nudges:
        nudges = []
    else:
        def simulate_fn(ren_target, vis_target, h2_override, bat_override, grid_override, m2_override):
            r = compute_festival_plan(
                lat, lng, area_m2, duration_days, month, dataset,
                mode=mode, target_renewable_percent=ren_target, target_visitors=vis_target,
                hydrogen_generators_override=h2_override, battery_units_override=bat_override,
                grid_kw_override=grid_override, m2_per_person_override=m2_override,
                _skip_nudges=True,
            )
            return {"visitors": r.max_visitors, "renewable": r.energy.renewable_percent}

        nudges = generate_nudges(
            mode=mode, max_vis=max_vis, renewable_pct=renewable_pct, h2_units=h2_units,
            target_renewable_percent=target_renewable_percent, target_visitors=target_visitors,
            simulate_fn=simulate_fn,
            hydrogen_generators_override=hydrogen_generators_override,
            battery_units_override=battery_units_override,
            grid_kw_override=grid_kw_override,
            m2_per_person_override=m2_per_person_override,
        )

    # --- Sources ---
    sources = []
    if total_daily > 0:
        grid_ren = grid_kwh * ren_share
        grid_fos = grid_kwh * (1 - ren_share)
        for name, kwh in [("Grid (renewable)", grid_ren), ("Grid (fossil)", grid_fos), ("Hydrogen", h2_kwh), ("Battery", bat_kwh)]:
            sources.append(EnergySource(name=name, capacity_kWh=round(kwh * duration_days, 1), share_percent=round(kwh / total_daily * 100, 1)))

    # --- Hourly dispatch (using NEDU profile shape for the month) ---
    load_profile = load_load_profile()
    nedu_hourly = get_nedu_hourly_profile(month, load_profile)
    amsterdam_daily_demand = get_amsterdam_monthly_avg_demand_mwh(month, load_profile)

    hourly_mix = compute_hourly_mix(total_daily, grid_kw, h2_units * HYDROGEN_GENERATOR_KW, bat_kwh, hourly_prices, ren_share,
                                    nedu_profile=nedu_hourly)

    # --- Resources ---
    water_pp = consumption.get("water_per_person_per_day_liters", {}).get("total_incl_sanitation_mid", 13)
    food_pp = consumption.get("food_per_person_per_day", {}).get("mid_kg", 1.5)
    drinks_pp = consumption.get("drinks_per_person_per_day", {}).get("dgtl_drinks_per_visitor_kg", 2.25)
    waste_pp = consumption.get("waste_per_person_per_day_kg", {}).get("dgtl_visitor_waste_per_person_kg", 0.08)
    toilets_per_100 = consumption.get("sanitation", {}).get("toilets_per_100_people_festival", 3)

    total_demand = (max_vis * ENERGY_PER_VISITOR_PER_DAY_KWH + stage_kwh) * duration_days

    is_ndsm = (52.3 < lat < 52.5) and (4.8 < lng < 5.0)
    location_name = "NDSM Wharf, Amsterdam-Noord" if is_ndsm else f"{lat:.4f}, {lng:.4f}"

    return FestivalPlan(
        max_visitors=max_vis,
        location_name=location_name,
        area_m2=area_m2,
        duration_days=duration_days,
        month=month,
        energy=EnergyBreakdown(
            total_supply_kWh=round(total_daily * duration_days, 1),
            total_demand_kWh=round(total_demand, 1),
            sources=sources,
            hydrogen_generators=h2_units,
            hydrogen_capacity_kWh=round(h2_kwh * duration_days, 1),
            battery_units=bat_count,
            battery_capacity_kWh=round(bat_kwh, 1),
            grid_kw=grid_kw,
            renewable_percent=renewable_pct,
            hourly_mix=hourly_mix,
        ),
        resources=ResourceBreakdown(
            water_liters_total=round(max_vis * water_pp * duration_days, 0),
            water_liters_per_person=water_pp,
            food_kg_total=round(max_vis * food_pp * duration_days, 0),
            food_kg_per_person=food_pp,
            drinks_kg_total=round(max_vis * drinks_pp * duration_days, 0),
            drinks_kg_per_person=drinks_pp,
            waste_kg_total=round(max_vis * waste_pp * duration_days, 0),
            waste_kg_per_person=waste_pp,
            toilets_required=math.ceil(max_vis / 100 * toilets_per_100),
            human_waste_kg=round(max_vis * 2.835 * duration_days, 0),
        ),
        cost=CostEstimate(
            hydrogen_generators_eur=h2_units * HYDROGEN_GENERATOR_COST_EUR,
            batteries_eur=bat_count * 11000,
            grid_connection_eur=grid_kw * 50 * duration_days,
            total_eur=h2_units * HYDROGEN_GENERATOR_COST_EUR + bat_count * 11000 + grid_kw * 50 * duration_days,
        ),
        grid_congested=grid["congested"],
        nudges=nudges,
    )
