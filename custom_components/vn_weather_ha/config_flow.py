"""UI configuration; location is immutable, provider preferences adjustable."""
from __future__ import annotations
from typing import Any
import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.const import CONF_LATITUDE, CONF_LONGITUDE
from .const import (
    DOMAIN, CONF_LOCATION_NAME, CONF_MODEL, CONF_FALLBACK, CONF_DAYS,
    CONF_REFRESH, CONF_STALE, DEFAULT_MODEL, DEFAULT_DAYS, DEFAULT_REFRESH,
    DEFAULT_STALE, MODELS,
)


class VNWeatherConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            lat = float(user_input[CONF_LATITUDE])
            lon = float(user_input[CONF_LONGITUDE])
            await self.async_set_unique_id(f"{lat:.5f},{lon:.5f}")
            self._abort_if_unique_id_configured()
            return self.async_create_entry(title=user_input[CONF_LOCATION_NAME], data=user_input)
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required(CONF_LOCATION_NAME, default="My Home"): str,
                vol.Required(CONF_LATITUDE, default=round(self.hass.config.latitude, 5)):
                    vol.All(vol.Coerce(float), vol.Range(min=-90, max=90)),
                vol.Required(CONF_LONGITUDE, default=round(self.hass.config.longitude, 5)):
                    vol.All(vol.Coerce(float), vol.Range(min=-180, max=180)),
            }),
        )

    @staticmethod
    def async_get_options_flow(config_entry):
        return VNWeatherOptionsFlow()


class VNWeatherOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        options = self.config_entry.options
        return self.async_show_form(
            step_id="init", data_schema=vol.Schema({
                vol.Required(CONF_MODEL, default=options.get(CONF_MODEL, DEFAULT_MODEL)): vol.In(MODELS),
                vol.Required(CONF_FALLBACK, default=options.get(CONF_FALLBACK, True)): bool,
                vol.Required(CONF_DAYS, default=options.get(CONF_DAYS, DEFAULT_DAYS)):
                    vol.All(vol.Coerce(int), vol.Range(min=3, max=15)),
                vol.Required(CONF_REFRESH, default=options.get(CONF_REFRESH, DEFAULT_REFRESH)):
                    vol.All(vol.Coerce(int), vol.Range(min=15, max=120)),
                vol.Required(CONF_STALE, default=options.get(CONF_STALE, DEFAULT_STALE)):
                    vol.All(vol.Coerce(int), vol.Range(min=0, max=24)),
            }),
        )
