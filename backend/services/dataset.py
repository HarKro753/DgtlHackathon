import json
from pathlib import Path
from functools import lru_cache


DATA_DIR = Path(__file__).parent.parent / "data"


@lru_cache(maxsize=1)
def load_dataset() -> dict:
    with open(DATA_DIR / "dgtl_energy_dataset.json") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_load_profile() -> dict:
    with open(DATA_DIR / "amsterdam_load_profile.json") as f:
        return json.load(f)
