"""VN Weather HA - Open-Meteo free cloud with optional MET Norway fallback."""
from __future__ import annotations
import logging
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_LATITUDE, CONF_LONGITUDE
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from .api import WeatherClient
from .coordinator import VNWeatherCoordinator
from .frontend import async_register_frontend
from .const import DOMAIN, CONF_MODEL, CONF_DAYS, DEFAULT_MODEL, DEFAULT_DAYS, PLATFORMS

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Declare entities before any internet calls to protect HA startup."""
    client = WeatherClient(
        async_get_clientsession(hass),
        entry.data[CONF_LATITUDE], entry.data[CONF_LONGITUDE],
        entry.options.get(CONF_MODEL, DEFAULT_MODEL),
        entry.options.get(CONF_DAYS, DEFAULT_DAYS),
    )
    coordinator = VNWeatherCoordinator(hass, entry, client)
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_entry_updated))
    entry.async_create_background_task(
        hass, async_register_frontend(hass), f"{DOMAIN}_card_{entry.entry_id}", eager_start=False
    )
    entry.async_create_background_task(
        hass, coordinator.async_bootstrap(), f"{DOMAIN}_initial_{entry.entry_id}", eager_start=False
    )
    _LOGGER.debug("VN Weather [%s] setup complete, network refresh deferred", entry.title)
    return True


async def _async_entry_updated(hass: HomeAssistant, entry: ConfigEntry):
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
