"""Nudge generation — suggests parameter changes to improve the plan."""

from __future__ import annotations
from typing import TYPE_CHECKING

from models.festival import Nudge

if TYPE_CHECKING:
    pass


def generate_nudges(
    mode: str,
    max_vis: int,
    renewable_pct: float,
    h2_units: int,
    target_renewable_percent: float | None,
    target_visitors: int | None,
    # Pass-through for simulation
    simulate_fn: callable,
    hydrogen_generators_override: int | None,
    battery_units_override: int | None,
    grid_kw_override: int | None,
    m2_per_person_override: float | None,
) -> list[Nudge]:
    """Generate nudges by simulating alternative configurations."""
    nudges: list[Nudge] = []

    if mode == "visitors":
        ren_target = target_renewable_percent if target_renewable_percent is not None else 50.0

        # Nudge: add a generator
        if h2_units < 20:
            sim = simulate_fn(
                ren_target=ren_target, vis_target=None,
                h2_override=h2_units + 1, bat_override=battery_units_override,
                grid_override=grid_kw_override, m2_override=m2_per_person_override,
            )
            if sim["visitors"] > max_vis:
                nudges.append(Nudge(
                    message=f"+1 H₂ generator → {sim['visitors']:,} visitors at {sim['renewable']}%",
                    action="hydrogen_generators",
                    value=h2_units + 1,
                    impact=f"{max_vis:,} / {renewable_pct}% → {sim['visitors']:,} / {sim['renewable']}%",
                ))

        # Nudge: lower renewable target
        if ren_target > 20:
            lower = max(0, ren_target - 10)
            sim = simulate_fn(
                ren_target=lower, vis_target=None,
                h2_override=hydrogen_generators_override, bat_override=battery_units_override,
                grid_override=grid_kw_override, m2_override=m2_per_person_override,
            )
            if sim["visitors"] > max_vis:
                nudges.append(Nudge(
                    message=f"Accept {lower:.0f}% renewable → {sim['visitors']:,} visitors",
                    action="target_renewable_percent",
                    value=lower,
                    impact=f"{max_vis:,} at {renewable_pct}% → {sim['visitors']:,} at {sim['renewable']}%",
                ))

    else:  # renewable mode
        if max_vis < (target_visitors or 20000) and h2_units < 20:
            sim = simulate_fn(
                ren_target=None, vis_target=target_visitors,
                h2_override=h2_units + 1, bat_override=battery_units_override,
                grid_override=grid_kw_override, m2_override=m2_per_person_override,
            )
            nudges.append(Nudge(
                message=f"+1 H₂ generator → {sim['renewable']}% renewable",
                action="hydrogen_generators",
                value=h2_units + 1,
                impact=f"{renewable_pct}% → {sim['renewable']}%",
            ))

    return nudges
