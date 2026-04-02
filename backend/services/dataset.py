import json
from pathlib import Path
from functools import lru_cache


DATA_PATH = Path(__file__).parent.parent / "data" / "dgtl_energy_dataset.json"


@lru_cache(maxsize=1)
def load_dataset() -> dict:
    with open(DATA_PATH) as f:
        return json.load(f)
