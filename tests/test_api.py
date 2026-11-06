"""Validate HTTP parameters and degraded model handling without network."""
import asyncio
import importlib
import json
import sys
import types
from pathlib import Path

PACKAGE = "_vn_weather_test_http"
pkg = types.ModuleType(PACKAGE)
pkg.__path__ = [str(Path(__file__).parents[1] / "custom_components" / "vn_weather_ha")]
sys.modules[PACKAGE] = pkg
api = importlib.import_module(PACKAGE + ".api")


class FakeContent:
    def __init__(self, body):
        self.body = body

    async def iter_chunked(self, size):
        for index in range(0, len(self.body), size):
            yield self.body[index : index + size]


class FakeResponse:
    def __init__(self, data, status=200):
        self.status = status
        self.headers = {}
        self.content = FakeContent(json.dumps(data).encode())
        self.content_length = len(self.content.body)
        self.data = data

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def text(self):
        return json.dumps(self.data)


class FakeSession:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self.responses.pop(0)


def sample_data():
    return {
        "timezone": "Asia/Ho_Chi_Minh",
        "current_units": {"visibility": "m", "wind_speed_10m": "km/h", "pressure_msl": "hPa"},
        "current": {"time": "2026-11-06T12:00", "temperature_2m": 30, "visibility": 15000},
        "hourly": {"time": ["2026-11-06T12:00"], "temperature_2m": [30]},
        "daily": {"time": ["2026-11-06"], "temperature_2m_max": [32]},
    }


def test_one_request_for_complete_forecast():
    session = FakeSession(FakeResponse(sample_data()))
    client = api.WeatherClient(session, 21.0285, 105.8542, "best_match", 7)
    result = asyncio.run(client.fetch_open_meteo())
    assert result["source"] == "open_meteo"
    assert result["current"]["visibility_km"] == 15
    assert len(session.calls) == 1
    url, options = session.calls[0]
    assert url == api.OPEN_METEO_URL
    assert options["params"]["timezone"] == "auto"
    assert options["params"]["wind_speed_unit"] == "kmh"
    assert "uv_index" in options["params"]["current"]
    assert "models" not in options["params"]


def test_ecmwf_optional_var_error_retries_conservative_once():
    session = FakeSession(
        FakeResponse({"error": True, "reason": "unsupported model variable"}, 400),
        FakeResponse(sample_data()),
        FakeResponse(sample_data()),
    )
    client = api.WeatherClient(session, 21, 105, "ecmwf_ifs", 7)
    first = asyncio.run(client.fetch_open_meteo())
    second = asyncio.run(client.fetch_open_meteo())
    assert first["degraded_query"] is True
    assert second["degraded_query"] is True
    assert len(session.calls) == 3
    assert "uv_index" in session.calls[0][1]["params"]["current"]
    assert "uv_index" not in session.calls[1][1]["params"]["current"]
    assert "uv_index" not in session.calls[2][1]["params"]["current"]
    assert session.calls[1][1]["params"]["models"] == "ecmwf_ifs"
