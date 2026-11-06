"""Weather entity with HA 2026.11 coordinator forecast subscriptions."""
from __future__ import annotations
from datetime import datetime, timezone
from homeassistant.components.weather import SingleCoordinatorWeatherEntity, WeatherEntityFeature
from homeassistant.const import (
    UnitOfLength, UnitOfPressure, UnitOfPrecipitationDepth,
    UnitOfSpeed, UnitOfTemperature,
)
from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from .const import DOMAIN
from .parsing import wmo_condition


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([VNWeatherEntity(entry, entry.runtime_data)])


class VNWeatherEntity(SingleCoordinatorWeatherEntity):
    _attr_has_entity_name = True
    _attr_name = None
    _attr_native_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_native_pressure_unit = UnitOfPressure.HPA
    _attr_native_wind_speed_unit = UnitOfSpeed.KILOMETERS_PER_HOUR
    _attr_native_precipitation_unit = UnitOfPrecipitationDepth.MILLIMETERS
    _attr_native_visibility_unit = UnitOfLength.KILOMETERS
    _attr_supported_features = WeatherEntityFeature.FORECAST_DAILY | WeatherEntityFeature.FORECAST_HOURLY

    def __init__(self, entry, coordinator):
        super().__init__(coordinator=coordinator)
        self._attr_unique_id = entry.entry_id
        self._attr_device_info = DeviceInfo(
            entry_type=DeviceEntryType.SERVICE, identifiers={(DOMAIN, entry.entry_id)},
            manufacturer="VN Weather HA / Open-Meteo", name=entry.title,
        )

    def _get(self, key):
        return (self.coordinator.data or {}).get("current", {}).get(key)

    @property
    def condition(self):
        explicit = self._get("condition")
        if explicit:
            return explicit
        daytime = self._get("is_day")
        return wmo_condition(self._get("weather_code"), day=daytime != 0)

    @property
    def native_temperature(self):
        return self._get("temperature_2m")

    @property
    def native_apparent_temperature(self):
        return self._get("apparent_temperature")

    @property
    def native_dew_point(self):
        return self._get("dew_point_2m")

    @property
    def humidity(self):
        return self._get("relative_humidity_2m")

    @property
    def native_pressure(self):
        return self._get("pressure_msl")

    @property
    def native_wind_speed(self):
        return self._get("wind_speed_10m")

    @property
    def native_wind_gust_speed(self):
        return self._get("wind_gusts_10m")

    @property
    def wind_bearing(self):
        return self._get("wind_direction_10m")

    @property
    def native_visibility(self):
        return self._get("visibility_km")

    @property
    def cloud_coverage(self):
        return self._get("cloud_cover")

    @property
    def uv_index(self):
        return self._get("uv_index")

    @property
    def extra_state_attributes(self):
        data = self.coordinator.data or {}
        today = (data.get("daily") or [{}])[0]
        return {
            "data_source": data.get("source"),
            "time_zone": data.get("time_zone"),
            "sunrise": today.get("sunrise"),
            "sunset": today.get("sunset"),
            "forecast_high": today.get("temperature_2m_max"),
            "forecast_low": today.get("temperature_2m_min"),
            "precipitation_probability": today.get("precipitation_probability_max"),
            "model": data.get("model"),
            "is_stale": data.get("is_stale"),
            "last_refresh": data.get("fetched_at"),
            "observation_time": data.get("observation_time"),
            "weather_data_attribution": "Open-Meteo.com (CC BY 4.0)" if data.get("source") == "open_meteo" else "MET Norway (attribution required)",
        }

    @callback
    def _async_forecast_hourly(self):
        data = self.coordinator.data or {}
        rows = data.get("hourly") or []
        now = datetime.now(timezone.utc)
        result = []
        mapping = {
            "temperature_2m": "native_temperature", "apparent_temperature": "native_apparent_temperature",
            "dew_point_2m": "native_dew_point", "relative_humidity_2m": "humidity",
            "pressure_msl": "native_pressure", "cloud_cover": "cloud_coverage",
            "precipitation": "native_precipitation", "precipitation_probability": "precipitation_probability",
            "wind_speed_10m": "native_wind_speed", "wind_gusts_10m": "native_wind_gust_speed",
            "wind_direction_10m": "wind_bearing", "uv_index": "uv_index",
        }
        for row in rows:
            try:
                when = datetime.fromisoformat(row["time"])
                if when < now:
                    continue
            except (TypeError, KeyError, ValueError):
                continue
            item = {"datetime": when.isoformat()}
            condition = row.get("condition") or wmo_condition(row.get("weather_code"), day=True)
            if condition:
                item["condition"] = condition
            for field, attribute in mapping.items():
                value = row.get(field)
                if value is not None:
                    item[attribute] = value
            result.append(item)
        return result

    @callback
    def _async_forecast_daily(self):
        data = self.coordinator.data or {}
        rows = data.get("daily") or []
        result = []
        mapping = {
            "temperature_2m_max": "native_temperature",
            "temperature_2m_min": "native_templow",
            "apparent_temperature_max": "native_apparent_temperature",
            "precipitation_sum": "native_precipitation",
            "precipitation_probability_max": "precipitation_probability",
            "wind_speed_10m_max": "native_wind_speed",
            "wind_gusts_10m_max": "native_wind_gust_speed",
            "wind_direction_10m_dominant": "wind_bearing",
            "uv_index_max": "uv_index",
        }
        for row in rows:
            if not row.get("time"):
                continue
            item = {"datetime": row["time"]}
            condition = wmo_condition(row.get("weather_code"), day=True)
            if condition:
                item["condition"] = condition
            for field, attribute in mapping.items():
                value = row.get(field)
                if value is not None:
                    item[attribute] = value
            result.append(item)
        return result
