"""Async HTTP clients with bounded responses and real provider attribution."""
from __future__ import annotations
import asyncio
import json
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import aiohttp
from .const import OPENMETEO_CURRENT, OPENMETEO_HOURLY, OPENMETEO_DAILY, VERSION
from .parsing import parse_open_meteo, parse_met, WeatherParseError

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
MAX_RESPONSE_BYTES = 2_000_000


class ProviderError(Exception):
    """API unreachable, invalid, throttled, or unavailable."""


class WeatherClient:
    def __init__(self, session: aiohttp.ClientSession, lat: float, lon: float, model: str, days: int):
        self.session = session
        self.lat = lat
        self.lon = lon
        self.model = model
        self.days = days
        self.met_cached: dict[str, Any] | None = None
        self.met_expires: datetime | None = None
        self.met_last_modified: str | None = None
        self.met_etag: str | None = None
        self.count_open_meteo = 0
        self.count_met = 0
        self._degraded_query = False

    async def _request_json(self, url: str, *, params: dict, headers: dict | None = None):
        try:
            timeout = aiohttp.ClientTimeout(total=18, connect=6)
            async with self.session.get(url, params=params, headers=headers, timeout=timeout) as response:
                status = response.status
                if status == 304:
                    return None, response.headers
                if status >= 400:
                    try:
                        reason = (await response.text())[:200]
                    except (aiohttp.ClientError, UnicodeError):
                        reason = ""
                    raise ProviderError(f"{url.split('/')[2]} HTTP {status}: {reason}")
                if response.content_length is not None and response.content_length > MAX_RESPONSE_BYTES:
                    raise ProviderError("weather response exceeds size limit")
                chunks = []
                size = 0
                async for chunk in response.content.iter_chunked(65536):
                    size += len(chunk)
                    if size > MAX_RESPONSE_BYTES:
                        raise ProviderError("weather response exceeds size limit")
                    chunks.append(chunk)
                return json.loads(b"".join(chunks)), response.headers
        except (aiohttp.ClientError, asyncio.TimeoutError, UnicodeError, ValueError) as exc:
            raise ProviderError(f"{url.split('/')[2]}: {type(exc).__name__}: {exc}") from exc

    async def fetch_open_meteo(self):
        params = {
            "latitude": round(self.lat, 5), "longitude": round(self.lon, 5),
            "timezone": "auto", "forecast_days": self.days,
            "temperature_unit": "celsius", "wind_speed_unit": "kmh",
            "precipitation_unit": "mm", "timeformat": "iso8601",
            "current": ",".join(OPENMETEO_CURRENT),
            "hourly": ",".join(OPENMETEO_HOURLY), "daily": ",".join(OPENMETEO_DAILY),
        }
        if self.model != "best_match":
            params["models"] = self.model
        if self._degraded_query:
            params = self._reduced_params(params)
        self.count_open_meteo += 1
        try:
            payload, _ = await self._request_json(OPEN_METEO_URL, params=params)
        except ProviderError as exc:
            # Some global models cannot provide optional fields such as UV.
            # Retry once with conservative fields, then remember the choice.
            if "HTTP 400" not in str(exc) or self._degraded_query:
                raise
            params = self._reduced_params(params)
            self.count_open_meteo += 1
            payload, _ = await self._request_json(OPEN_METEO_URL, params=params)
            self._degraded_query = True
        try:
            data = parse_open_meteo(payload, self.model)
            data["degraded_query"] = self._degraded_query
            return data
        except (WeatherParseError, AttributeError, TypeError) as exc:
            raise ProviderError(f"Open-Meteo invalid response: {exc}") from exc

    @staticmethod
    def _reduced_params(params):
        reduced = dict(params)
        reduced["current"] = (
            "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,"
            "is_day,pressure_msl,wind_speed_10m,wind_direction_10m"
        )
        reduced["hourly"] = (
            "temperature_2m,relative_humidity_2m,weather_code,precipitation,"
            "pressure_msl,wind_speed_10m,wind_direction_10m"
        )
        reduced["daily"] = (
            "weather_code,temperature_2m_max,temperature_2m_min,"
            "precipitation_sum,sunrise,sunset"
        )
        return reduced

    async def fetch_met(self):
        """Respect Expires/304 to avoid redundant requests."""
        now = datetime.now(timezone.utc)
        if self.met_cached and self.met_expires and now < self.met_expires:
            return {**self.met_cached, "met_cache_hit": True}
        headers = {
            "User-Agent": f"VNWeatherHA/{VERSION} (https://github.com/khaisilk1910/VN-Weather-HA)",
            "Accept": "application/json",
        }
        if self.met_last_modified:
            headers["If-Modified-Since"] = self.met_last_modified
        if self.met_etag:
            headers["If-None-Match"] = self.met_etag
        self.count_met += 1
        payload, response_headers = await self._request_json(
            MET_URL,
            params={"lat": round(self.lat, 4), "lon": round(self.lon, 4)},
            headers=headers,
        )
        if payload is None and self.met_cached:
            data = {**self.met_cached, "met_cache_hit": True}
        else:
            try:
                data = parse_met(payload)
            except (WeatherParseError, AttributeError, TypeError) as exc:
                raise ProviderError(f"MET Norway invalid response: {exc}") from exc
        expires = response_headers.get("Expires")
        if expires:
            try:
                self.met_expires = parsedate_to_datetime(expires).astimezone(timezone.utc)
            except (TypeError, ValueError, OverflowError):
                self.met_expires = None
        self.met_last_modified = response_headers.get("Last-Modified", self.met_last_modified)
        self.met_etag = response_headers.get("ETag", self.met_etag)
        self.met_cached = data
        return data
