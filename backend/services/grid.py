"""Grid capacity and congestion service."""


def check_grid_capacity(lat: float, lng: float, dataset: dict) -> dict:
    """Check grid status for a location. Currently uses static NDSM data.

    In production this would query the Netbeheer Nederland capacity map API.
    """
    grid_data = dataset.get("electricity_grid_ndsm", {})

    is_ndsm_area = (52.3 < lat < 52.5) and (4.8 < lng < 5.0)

    if is_ndsm_area:
        return {
            "congested": True,
            "status": grid_data.get("congestion_status", "MAXIMUM CAPACITY"),
            "bottleneck": grid_data.get("bottleneck", "Medium voltage grid"),
            "existing_solar_kwp": grid_data.get("ndsm_energie_cooperative", {}).get("solar_capacity_kWp", 0),
            # NDSM has an existing green grid connection. Grid provides ~80% of DGTL's power.
            # Congestion means NO NEW large connections, but existing ones work.
            # Back-calculated from DGTL: 40k visitors needs ~12,000 kWh/day, 80% from grid
            # = ~9,600 kWh/day ÷ 14h = ~700kW
            "grid_available_kw": 700,
            "notes": grid_data.get("implication_for_festivals", "Grid congested — no new connections, existing grid + on-site generators required"),
        }

    return {
        "congested": False,
        "status": "AVAILABLE",
        "bottleneck": None,
        "existing_solar_kwp": 0,
        "grid_available_kw": 500,  # default for uncongested areas
        "notes": "Grid capacity available for temporary event connections",
    }
