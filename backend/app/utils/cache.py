import time
from typing import Any, Dict, Optional

class InMemoryCache:
    def __init__(self, ttl_seconds: int = 900):
        self.ttl = ttl_seconds
        self._data: Dict[str, Any] = {}
        self._timestamps: Dict[str, float] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._data:
            if time.time() - self._timestamps.get(key, 0) < self.ttl:
                return self._data[key]
            else:
                self.delete(key)
        return None

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value
        self._timestamps[key] = time.time()

    def delete(self, key: str) -> None:
        self._data.pop(key, None)
        self._timestamps.pop(key, None)

    def clear(self) -> None:
        self._data.clear()
        self._timestamps.clear()

cache_barbeiros = InMemoryCache(ttl_seconds=900)
cache_servicos = InMemoryCache(ttl_seconds=900)
