"""Constants and weather field definitions for VN Weather HA."""
DOMAIN = "vn_weather_ha"
VERSION = "0.2.0"
PLATFORMS = ["weather", "sensor"]
CONF_MODEL = "model"
CONF_FALLBACK = "met_fallback"
CONF_DAYS = "forecast_days"
CONF_REFRESH = "refresh_minutes"
CONF_STALE = "stale_hours"
CONF_LOCATION_NAME = "location_name"
DEFAULT_MODEL = "best_match"
DEFAULT_DAYS = 7
DEFAULT_REFRESH = 30
DEFAULT_STALE = 6
MODELS = {"best_match": "Best available (automatic)", "ecmwf_ifs": "ECMWF IFS (9 km)", "ecmwf_ifs025": "ECMWF IFS (0.25 degree)"}
OPENMETEO_CURRENT = (
    "temperature_2m", "relative_humidity_2m", "apparent_temperature", "dew_point_2m",
    "precipitation", "rain", "showers", "snowfall", "weather_code", "is_day", "cloud_cover",
    "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "pressure_msl", "surface_pressure",
    "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility", "uv_index",
    "shortwave_radiation", "direct_radiation", "diffuse_radiation", "cape", "wet_bulb_temperature_2m",
)
OPENMETEO_HOURLY = (
    "temperature_2m", "apparent_temperature", "dew_point_2m", "relative_humidity_2m",
    "pressure_msl", "precipitation", "precipitation_probability", "weather_code", "cloud_cover",
    "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility", "uv_index",
)
OPENMETEO_DAILY = (
    "weather_code", "temperature_2m_max", "temperature_2m_min", "apparent_temperature_max",
    "precipitation_sum", "rain_sum", "showers_sum", "precipitation_probability_max", "uv_index_max",
    "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant", "sunrise",
    "sunset", "daylight_duration", "sunshine_duration", "shortwave_radiation_sum",
)
