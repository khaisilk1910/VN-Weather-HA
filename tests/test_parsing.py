"""Offline, no HA instance and no external API needed."""
import importlib
import sys
import types
from datetime import datetime, timezone
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1] / "custom_components" / "vn_weather_ha"
PACKAGE = "_vn_weather_test"
pkg = types.ModuleType(PACKAGE)
pkg.__path__ = [str(ROOT)]
sys.modules[PACKAGE] = pkg
parse = importlib.import_module(PACKAGE + ".parsing")


def sample_open_meteo():
    return {
        "timezone": "Asia/Ho_Chi_Minh", "latitude": 21.0, "longitude": 105.0,
        "current_units": {"visibility": "m", "wind_speed_10m": "km/h", "pressure_msl": "hPa"},
        "hourly_units": {"visibility": "m"},
        "current": {
            "time": "2026-11-06T10:15", "temperature_2m": 27.2,
            "visibility": 12500, "relative_humidity_2m": 70,
            "wind_speed_10m": 12, "pressure_msl": 1009.8,
            "is_day": 1, "weather_code": 2, "uv_index": 5.5,
        },
        "hourly": {"time": ["2026-11-06T10:00", "2026-11-06T11:00"],
                   "temperature_2m": [27, 28], "visibility": [11000, None],
                   "precipitation_probability": [5, 45]},
        "daily": {"time": ["2026-11-06", "2026-11-07"],
                  "temperature_2m_max": [29, 30], "temperature_2m_min": [20, 21],
                  "sunrise": ["2026-11-06T06:01", "2026-11-07T06:01"],
                  "sunset": ["2026-11-06T17:28", "2026-11-07T17:28"]},
    }


def test_visibility_converts_only_when_units_verified():
    result = parse.parse_open_meteo(sample_open_meteo(), "best_match")
    assert result["current"]["visibility_km"] == 12.5
    assert result["hourly"][0]["visibility_km"] == 11
    assert result["hourly"][1]["visibility_km"] is None
    assert result["current"]["uv_index"] == 5.5
    assert result["current"]["is_day"] == 1.0


def test_unknown_visibility_unit_never_guesses():
    data = sample_open_meteo()
    data["current_units"]["visibility"] = "unrecognized"
    data["hourly_units"]["visibility"] = "unrecognized"
    result = parse.parse_open_meteo(data, "best_match")
    assert result["current"]["visibility_km"] is None
    assert result["hourly"][0]["visibility_km"] is None


def test_local_time_is_normalized_to_utc():
    result = parse.parse_open_meteo(sample_open_meteo(), "best_match")
    assert result["current"]["time"] == "2026-11-06T03:15:00+00:00"
    assert result["daily"][0]["sunrise"] == "2026-11-05T23:01:00+00:00"
    assert result["daily"][0]["sunset"] == "2026-11-06T10:28:00+00:00"


def test_nan_and_boolean_readings_rejected():
    data = sample_open_meteo()
    data["current"]["uv_index"] = float("nan")
    data["current"]["wind_speed_10m"] = True
    result = parse.parse_open_meteo(data, "best_match")
    assert result["current"]["uv_index"] is None
    assert result["current"]["wind_speed_10m"] is None


def test_missing_units_for_wind_and_pressure_rejected():
    data = sample_open_meteo()
    data["current_units"] = {}
    result = parse.parse_open_meteo(data, "best_match")
    assert result["current"]["wind_speed_10m"] is None
    assert result["current"]["pressure_msl"] is None


def test_bad_open_meteo_payload_fails():
    with pytest.raises(parse.WeatherParseError):
        parse.parse_open_meteo({"error": True, "reason": "No data"}, "best_match")
    with pytest.raises(parse.WeatherParseError):
        parse.parse_open_meteo({"current": {}}, "best_match")


def sample_met():
    return {"properties": {"timeseries": [
        {"time": "2026-11-06T02:00:00Z", "data": {"instant": {"details": {
            "air_temperature": 27.3, "relative_humidity": 80,
            "wind_speed": 3.5, "wind_from_direction": 180,
            "air_pressure_at_sea_level": 1010,
        }}, "next_1_hours": {"summary": {"symbol_code": "rain_day"},
                              "details": {"precipitation_amount": 0.6}}}},
    ]}}


def test_met_does_not_blend_and_converts_speed():
    result = parse.parse_met(sample_met())
    assert result["source"] == "met_norway"
    assert result["current"]["wind_speed_10m"] == 12.6
    assert result["current"]["precipitation"] is None
    assert result["hourly"][0]["precipitation"] == 0.6
    assert result["current"]["visibility_km"] is None
    assert result["daily"] == []
    assert result["current"]["condition"] == "rainy"


def test_met_missing_data_fails():
    with pytest.raises(parse.WeatherParseError):
        parse.parse_met({"properties": {"timeseries": []}})


def test_wmo_day_night_and_severe():
    assert parse.wmo_condition(0, day=False) == "clear-night"
    assert parse.wmo_condition(0, day=True) == "sunny"
    assert parse.wmo_condition(65) == "pouring"
    assert parse.wmo_condition(95) == "lightning-rainy"


def test_bad_timezone_rejected():
    data = sample_open_meteo()
    data["timezone"] = "Unknown/Zone"
    with pytest.raises(parse.WeatherParseError):
        parse.parse_open_meteo(data, "best_match")
