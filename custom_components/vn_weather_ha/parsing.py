"""Pure parsing: providers are not blended; missing values stay missing.

No Home Assistant imports so failures can be tested offline.
"""
from __future__ import annotations
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import math


class WeatherParseError(ValueError):
    """Returned payload is unusable or unexpectedly shaped."""


def number(value):
    """Finite numbers only; booleans and NaN are never valid readings."""
    if isinstance(value, bool) or value is None:
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return numeric if math.isfinite(numeric) else None


def parse_time(value: str, tz: ZoneInfo | timezone) -> str:
    """Normalize UTC forecast instants, interpreting provider-local naive ISO times."""
    if not isinstance(value, str):
        raise WeatherParseError("missing forecast time")
    try:
        when = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if when.tzinfo is None:
            when = when.replace(tzinfo=tz)
        return when.astimezone(timezone.utc).isoformat()
    except ValueError as exc:
        raise WeatherParseError(f"invalid timestamp {value!r}") from exc


def wmo_condition(code, day=True):
    value = number(code)
    if value is None:
        return None
    value = int(value)
    if value == 0:
        return "sunny" if day else "clear-night"
    if value in (1, 2):
        return "partlycloudy"
    if value == 3:
        return "cloudy"
    if value in (45, 48):
        return "fog"
    if value in (51, 53, 55, 56, 57, 61, 63, 66, 80, 81):
        return "rainy"
    if value in (65, 67, 82):
        return "pouring"
    if value in (71, 73, 75, 77, 85, 86):
        return "snowy"
    if value in (95,):
        return "lightning-rainy"
    if value in (96, 99):
        return "lightning-rainy"
    return None


def parse_open_meteo(payload: dict, model: str):
    if not isinstance(payload, dict) or payload.get("error"):
        raise WeatherParseError(f"Open-Meteo API error: {str(payload.get('reason', 'invalid payload'))[:120]}")
    current = payload.get("current")
    if not isinstance(current, dict) or number(current.get("temperature_2m")) is None:
        raise WeatherParseError("Open-Meteo response has no valid current temperature")
    timezone_name = payload.get("timezone")
    try:
        tz = ZoneInfo(timezone_name)
    except (KeyError, TypeError, ValueError) as exc:
        raise WeatherParseError("Open-Meteo timezone unavailable") from exc
    units = payload.get("current_units", {})
    if not isinstance(units, dict):
        units = {}
    data = {key: number(value) for key, value in current.items() if key != "time"}
    data["time"] = parse_time(current.get("time"), tz)
    # API's visibility is usually in meters. Unit validation is mandatory.
    visibility = data.get("visibility")
    vis_unit = units.get("visibility") if isinstance(units, dict) else None
    data["visibility_km"] = (
        visibility / 1000 if visibility is not None and vis_unit == "m" else
        visibility if visibility is not None and vis_unit == "km" else None
    )
    if units.get("wind_speed_10m") != "km/h":
        for key in ("wind_speed_10m", "wind_gusts_10m"):
            data[key] = None
    if units.get("pressure_msl") != "hPa":
        data["pressure_msl"] = None

    def parse_series(section: str):
        block = payload.get(section, {})
        if not isinstance(block, dict):
            return []
        times = block.get("time", [])
        if not isinstance(times, list) or len(times) > 500:
            return []
        rows = []
        for ix, raw in enumerate(times):
            try:
                timestamp = parse_time(raw if section == "hourly" else raw + "T00:00", tz)
            except (WeatherParseError, TypeError):
                continue
            row = {"time": timestamp}
            for key, values in block.items():
                if key == "time" or not isinstance(values, list) or ix >= len(values):
                    continue
                if key in ("sunrise", "sunset"):
                    try:
                        row[key] = parse_time(values[ix], tz)
                    except (WeatherParseError, TypeError):
                        row[key] = None
                else:
                    row[key] = number(values[ix])
            if section == "hourly":
                hourly_units = payload.get("hourly_units") or {}
                unit = hourly_units.get("visibility") if isinstance(hourly_units, dict) else None
                rawvis = row.get("visibility")
                row["visibility_km"] = (
                    rawvis / 1000 if unit == "m" and rawvis is not None else
                    rawvis if unit == "km" else None
                )
            rows.append(row)
        return rows

    return {
        "source": "open_meteo", "model": model, "time_zone": timezone_name,
        "fetched_at": datetime.now(timezone.utc).isoformat(), "observation_time": data["time"],
        "current": data, "hourly": parse_series("hourly"), "daily": parse_series("daily"),
        "is_stale": False, "error": None,
    }


MET_SYMBOLS = {
    "clearsky": "sunny", "fair": "partlycloudy", "partlycloudy": "partlycloudy",
    "cloudy": "cloudy", "fog": "fog", "lightrain": "rainy", "rain": "rainy",
    "heavyrain": "pouring", "lightrainshowers": "rainy", "rainshowers": "rainy",
    "heavyrainshowers": "pouring", "lightsnow": "snowy", "snow": "snowy",
    "heavysnow": "snowy", "sleet": "snowy-rainy", "snowshowers": "snowy",
    "rainandthunder": "lightning-rainy", "heavyrainandthunder": "lightning-rainy",
    "lightrainandthunder": "lightning-rainy",
}


def met_condition(symbol):
    if not symbol or not isinstance(symbol, str):
        return None
    base = symbol.removesuffix("_day").removesuffix("_night").removesuffix("_polartwilight")
    if base == "clearsky" and symbol.endswith("night"):
        return "clear-night"
    if "thunder" in base:
        return "lightning-rainy"
    return MET_SYMBOLS.get(base)


def parse_met(payload: dict):
    """MET forecast is a different complete snapshot; no mixing provider values."""
    rows = payload.get("properties", {}).get("timeseries", []) if isinstance(payload, dict) else []
    if not isinstance(rows, list) or not rows:
        raise WeatherParseError("MET Norway response has no timeseries")
    hourly = []
    for item in rows[:96]:
        if not isinstance(item, dict):
            continue
        instant = item.get("data", {}).get("instant", {}).get("details", {})
        if not isinstance(instant, dict):
            continue
        try:
            stamp = parse_time(item["time"], timezone.utc)
        except (WeatherParseError, KeyError):
            continue
        summary = item.get("data", {}).get("next_1_hours", {})
        symbol = summary.get("summary", {}).get("symbol_code") if isinstance(summary, dict) else None
        next_details = summary.get("details", {}) if isinstance(summary, dict) else {}
        speed = number(instant.get("wind_speed"))
        gust = number(instant.get("wind_speed_of_gust"))
        hourly.append({
            "time": stamp,
            "temperature_2m": number(instant.get("air_temperature")),
            "relative_humidity_2m": number(instant.get("relative_humidity")),
            "dew_point_2m": number(instant.get("dew_point_temperature")),
            "pressure_msl": number(instant.get("air_pressure_at_sea_level")),
            "cloud_cover": number(instant.get("cloud_area_fraction")),
            "wind_speed_10m": speed * 3.6 if speed is not None else None,
            "wind_direction_10m": number(instant.get("wind_from_direction")),
            "wind_gusts_10m": gust * 3.6 if gust is not None else None,
            "precipitation": number(next_details.get("precipitation_amount")),
            "condition": met_condition(symbol),
            "visibility_km": None,  # MET does not return compatible observation.
            "uv_index": None,  # clear-sky UV is not measured UV; do not blend.
        })
    if not hourly or hourly[0].get("temperature_2m") is None:
        raise WeatherParseError("MET Norway has no usable forecast temperature")
    now = datetime.now(timezone.utc)
    candidates = [r for r in hourly if datetime.fromisoformat(r["time"]) <= now]
    current = (candidates[-1] if candidates else hourly[0]).copy()
    # next_1_hours precipitation is a *future* 1-hour forecast, not current rain.
    current["precipitation"] = None
    current["is_day"] = 0 if current.get("condition") == "clear-night" else None
    return {
        "source": "met_norway", "model": "locationforecast/2.0/compact", "time_zone": "UTC",
        "fetched_at": now.isoformat(), "observation_time": current["time"],
        "current": current, "hourly": hourly, "daily": [], "is_stale": False, "error": None,
    }
