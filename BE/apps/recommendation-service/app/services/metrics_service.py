from collections import defaultdict, deque
import math
from threading import Lock
from time import time


_lock = Lock()
_counters = defaultdict(int)
_latencies = deque(maxlen=500)
_started_at = time()


def increment(name: str, value: int = 1) -> None:
    with _lock:
        _counters[name] += value


def observe_latency(milliseconds: float) -> None:
    with _lock:
        _latencies.append(milliseconds)


def snapshot() -> dict:
    with _lock:
        latencies = sorted(_latencies)
        count = len(latencies)
        avg = sum(latencies) / count if count else 0
        p95_index = min(max(math.ceil(count * 0.95) - 1, 0), count - 1) if count else 0
        return {
            "uptime_seconds": round(time() - _started_at, 2),
            "counters": dict(_counters),
            "latency_ms": {
                "count": count,
                "avg": round(avg, 2),
                "p95": round(latencies[p95_index], 2) if count else 0,
                "max": round(latencies[-1], 2) if count else 0,
            },
        }
