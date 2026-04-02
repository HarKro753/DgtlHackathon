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
            "grid_available_kw": 50,  # limited due to congestion
            "notes": grid_data.get("implication_for_festivals", "Grid congested — on-site renewables essential"),
        }

    return {
        "congested": False,
        "status": "AVAILABLE",
        "bottleneck": None,
        "existing_solar_kwp": 0,
        "grid_available_kw": 500,  # default assumption for uncongested areas
        "notes": "Grid capacity available for temporary event connections",
    }
