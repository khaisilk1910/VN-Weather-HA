"""Diagnostics intentionally exclude exact home coordinates."""
from __future__ import annotations
from homeassistant.core import HomeAssistant
from .const import VERSION


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry) -> dict:
    coordinator = entry.runtime_data
    data = coordinator.data or {}
    client = coordinator.client
    return {
        "version": VERSION,
        "location_name": entry.title,
        "coordinates_redacted": True,
        "model": client.model,
        "degraded_open_meteo_query": data.get("degraded_query"),
        "source": data.get("source"),
        "weather_valid_at": data.get("observation_time"),
        "last_successful_fetch": data.get("fetched_at"),
        "stale": data.get("is_stale"),
        "current_fields_available": sorted(k for k, v in data.get("current", {}).items() if v is not None),
        "hourly_rows": len(data.get("hourly", [])),
        "daily_rows": len(data.get("daily", [])),
        "open_meteo_requests_since_start": client.count_open_meteo,
        "met_requests_since_start": client.count_met,
        "consecutive_failures": coordinator.consecutive_failures,
        "last_error": coordinator.last_error,
    }
