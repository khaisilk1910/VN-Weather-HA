"""Update lifecycle, cache, error handling and source-level fallback."""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ProviderError, WeatherClient
from .const import DOMAIN, CONF_FALLBACK, CONF_REFRESH, CONF_STALE, DEFAULT_REFRESH, DEFAULT_STALE

_LOGGER = logging.getLogger(__name__)


class VNWeatherCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """One request updates all entities and cached forecasts for a location."""

    def __init__(self, hass: HomeAssistant, entry, client: WeatherClient):
        self.entry = entry
        self.client = client
        self.store = Store(hass, 1, f"{DOMAIN}.{entry.entry_id}")
        self.fallback_enabled = entry.options.get(CONF_FALLBACK, True)
        self.stale_hours = entry.options.get(CONF_STALE, DEFAULT_STALE)
        self.previous_valid: dict[str, Any] | None = None
        self.last_error: str | None = None
        self.consecutive_failures = 0
        interval = entry.options.get(CONF_REFRESH, DEFAULT_REFRESH)
        super().__init__(hass, _LOGGER, name=f"VN Weather {entry.title}", update_interval=timedelta(minutes=interval))

    def _cached_snapshot(self, *, error: str):
        candidate = self.previous_valid or self.data
        if not candidate:
            return None
        try:
            freshness = datetime.fromisoformat(candidate["fetched_at"]).astimezone(timezone.utc)
            age = datetime.now(timezone.utc) - freshness
        except (KeyError, TypeError, ValueError):
            return None
        if age < timedelta(0) or age > timedelta(hours=self.stale_hours):
            return None
        return {**candidate, "is_stale": True, "error": error, "original_source": candidate.get("source")}

    async def async_bootstrap(self):
        """Called as a config-entry background task, never blocks HA setup."""
        try:
            cached = await self.store.async_load()
            if isinstance(cached, dict) and isinstance(cached.get("current"), dict):
                self.previous_valid = cached
                restored = self._cached_snapshot(error="Restored from disk; refreshing")
                if restored:
                    self.async_set_updated_data(restored)
        except (OSError, ValueError, TypeError) as exc:
            _LOGGER.warning("VN Weather [%s] cache restore error: %s", self.entry.title, exc)
        # A corrupt cache must never prevent network refresh.
        await self.async_refresh()

    async def _async_update_data(self):
        errors = []
        for key, fetch in (("Open-Meteo", self.client.fetch_open_meteo), ("MET Norway", self.client.fetch_met)):
            if key == "MET Norway" and not self.fallback_enabled:
                break
            try:
                data = await fetch()
            except ProviderError as exc:
                errors.append(f"{key}: {exc}")
                _LOGGER.warning("VN Weather [%s] %s error: %s", self.entry.title, key, exc)
                continue
            self.consecutive_failures = 0
            self.last_error = errors[0] if errors else None
            if errors:
                data["error"] = errors[0]
            self.previous_valid = data
            # No disk I/O in this update path: Store schedules its own asynchronous save.
            self.store.async_delay_save(lambda snapshot=data: snapshot, 60)
            _LOGGER.debug(
                "VN Weather [%s] source=%s model=%s hourly=%d daily=%d",
                self.entry.title, data["source"], data["model"], len(data["hourly"]), len(data["daily"]),
            )
            return data
        self.consecutive_failures += 1
        self.last_error = "; ".join(errors)
        stale = self._cached_snapshot(error=self.last_error)
        if stale:
            _LOGGER.warning("VN Weather [%s] using cached data after provider errors (stale)", self.entry.title)
            return stale
        raise UpdateFailed(self.last_error or "No weather providers available")
