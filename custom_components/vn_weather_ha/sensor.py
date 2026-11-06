"""Rich sensor detail; null source values are never invented."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from homeassistant.components.sensor import SensorEntity, SensorDeviceClass, SensorStateClass
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from .const import DOMAIN


@dataclass(frozen=True)
class Field:
    key: str
    name: str
    unit: str | None = None
    group: str = "current"
    device_class: SensorDeviceClass | None = None


FIELDS = (
    Field("temperature_2m", "Temperature", "°C", device_class=SensorDeviceClass.TEMPERATURE),
    Field("apparent_temperature", "Feels like temperature", "°C", device_class=SensorDeviceClass.TEMPERATURE),
    Field("dew_point_2m", "Dew point", "°C", device_class=SensorDeviceClass.TEMPERATURE),
    Field("wet_bulb_temperature_2m", "Wet bulb temperature", "°C", device_class=SensorDeviceClass.TEMPERATURE),
    Field("relative_humidity_2m", "Relative humidity", "%", device_class=SensorDeviceClass.HUMIDITY),
    Field("pressure_msl", "Sea level pressure", "hPa", device_class=SensorDeviceClass.ATMOSPHERIC_PRESSURE),
    Field("surface_pressure", "Surface pressure", "hPa", device_class=SensorDeviceClass.ATMOSPHERIC_PRESSURE),
    Field("cloud_cover", "Cloud cover", "%"),
    Field("cloud_cover_low", "Low clouds", "%"),
    Field("cloud_cover_mid", "Mid clouds", "%"),
    Field("cloud_cover_high", "High clouds", "%"),
    Field("visibility_km", "Visibility", "km", device_class=SensorDeviceClass.DISTANCE),
    Field("wind_speed_10m", "Wind speed", "km/h", device_class=SensorDeviceClass.WIND_SPEED),
    Field("wind_gusts_10m", "Wind gust", "km/h", device_class=SensorDeviceClass.WIND_SPEED),
    Field("wind_direction_10m", "Wind direction", "°"),
    Field("precipitation", "Precipitation this model interval", "mm", device_class=SensorDeviceClass.PRECIPITATION),
    Field("rain", "Rain this model interval", "mm", device_class=SensorDeviceClass.PRECIPITATION),
    Field("showers", "Showers this model interval", "mm", device_class=SensorDeviceClass.PRECIPITATION),
    Field("snowfall", "Snowfall this model interval", "cm"),
    Field("uv_index", "UV index"),
    Field("cape", "Convective available potential energy", "J/kg"),
    Field("shortwave_radiation", "Solar shortwave radiation", "W/m²", device_class=SensorDeviceClass.IRRADIANCE),
    Field("direct_radiation", "Direct solar radiation", "W/m²", device_class=SensorDeviceClass.IRRADIANCE),
    Field("diffuse_radiation", "Diffuse solar radiation", "W/m²", device_class=SensorDeviceClass.IRRADIANCE),
    Field("temperature_2m_max", "Today maximum temperature", "°C", "daily", SensorDeviceClass.TEMPERATURE),
    Field("temperature_2m_min", "Today minimum temperature", "°C", "daily", SensorDeviceClass.TEMPERATURE),
    Field("precipitation_sum", "Today forecast precipitation", "mm", "daily", SensorDeviceClass.PRECIPITATION),
    Field("rain_sum", "Today forecast rain", "mm", "daily", SensorDeviceClass.PRECIPITATION),
    Field("precipitation_probability_max", "Today maximum rain probability", "%", "daily"),
    Field("uv_index_max", "Today maximum UV index", None, "daily"),
    Field("sunrise", "Sunrise", None, "daily", SensorDeviceClass.TIMESTAMP),
    Field("sunset", "Sunset", None, "daily", SensorDeviceClass.TIMESTAMP),
    Field("daylight_duration", "Today daylight duration", "h", "daily"),
    Field("sunshine_duration", "Today sunshine duration", "h", "daily"),
    Field("shortwave_radiation_sum", "Today solar energy", "MJ/m²", "daily"),
    Field("fetched_at", "Data fetched at", None, "metadata", SensorDeviceClass.TIMESTAMP),
    Field("observation_time", "Forecast valid at", None, "metadata", SensorDeviceClass.TIMESTAMP),
    Field("source", "Data source", None, "metadata"),
    Field("model", "Forecast model", None, "metadata"),
)


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([VNWeatherSensor(entry, entry.runtime_data, field) for field in FIELDS])


class VNWeatherSensor(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, entry, coordinator, field: Field):
        super().__init__(coordinator)
        self.field = field
        self._attr_name = field.name
        self._attr_unique_id = f"{entry.entry_id}_{field.group}_{field.key}"
        self._attr_device_info = DeviceInfo(
            entry_type=DeviceEntryType.SERVICE,
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title, manufacturer="VN Weather HA / Open-Meteo",
        )
        if field.unit:
            self._attr_native_unit_of_measurement = field.unit
        if field.device_class:
            self._attr_device_class = field.device_class
        if field.unit and field.device_class != SensorDeviceClass.TIMESTAMP:
            # Some daily values are accumulated totals, but never mark those as total_increasing.
            self._attr_state_class = SensorStateClass.MEASUREMENT

    @property
    def native_value(self):
        data = self.coordinator.data
        if not data:
            return None
        if self.field.group == "metadata":
            value = data.get(self.field.key)
        elif self.field.group == "daily":
            # First row always represents current date in provider location (timezone=auto).
            daily = data.get("daily") or []
            value = daily[0].get(self.field.key) if daily else None
            if value is not None and self.field.key in ("daylight_duration", "sunshine_duration"):
                value = round(value / 3600, 2)
        else:
            value = data.get("current", {}).get(self.field.key)
        if value is not None and self.field.device_class == SensorDeviceClass.TIMESTAMP:
            try:
                return datetime.fromisoformat(value)
            except (ValueError, TypeError):
                return None
        return value

    @property
    def extra_state_attributes(self):
        data = self.coordinator.data or {}
        return {
            "data_source": data.get("source"),
            "model": data.get("model"),
            "stale": data.get("is_stale"),
            "forecast_valid_at": data.get("observation_time"),
        }
