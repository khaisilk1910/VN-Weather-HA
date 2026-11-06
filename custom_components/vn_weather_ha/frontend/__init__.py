"""Serve the local dashboard module and register it in Lovelace storage mode.

All work is scheduled outside config-entry initialization; weather fetching never
waits for resource setup. No remote dependencies, secrets, or user data are served.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from ..const import DOMAIN, VERSION

_LOGGER = logging.getLogger(__name__)
CARD_URL = f"/{DOMAIN}/vn-weather-ha-card.js"
RESOURCE_URL = f"{CARD_URL}?v={VERSION}"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register once even if the user configures multiple weather locations."""
    state = hass.data.setdefault(f"{DOMAIN}_frontend", {"lock": asyncio.Lock()})
    async with state["lock"]:
        if not state.get("static_registered"):
            try:
                await hass.http.async_register_static_paths(
                    [StaticPathConfig(CARD_URL, Path(__file__).parent / "vn-weather-ha-card.js", False)]
                )
            except (OSError, RuntimeError, ValueError) as exc:
                _LOGGER.warning("VN Weather card static path unavailable: %s", exc)
                return
            state["static_registered"] = True
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None)
        if resources is None:
            _LOGGER.info("VN Weather card: Lovelace not ready; manually add module %s", RESOURCE_URL)
            return
        # YAML resource lists must never be modified by integrations.
        if not callable(getattr(resources, "async_create_item", None)):
            _LOGGER.info("VN Weather card: YAML resource mode; add module manually: %s", RESOURCE_URL)
            return
        try:
            # HA resource storage is lazy-loaded; reading/updating BEFORE
            # async_load could overwrite existing dashboard resource entries.
            if not getattr(resources, "loaded", False):
                await resources.async_load()
            existing = [item for item in resources.async_items()
                        if str(item.get("url", "")).split("?", 1)[0] == CARD_URL]
            if existing:
                for item in existing:
                    if item.get("url") != RESOURCE_URL or item.get("res_type") != "module":
                        await resources.async_update_item(
                            item["id"], {"url": RESOURCE_URL, "res_type": "module"}
                        )
                        _LOGGER.info("VN Weather card resource upgraded to v%s", VERSION)
            else:
                await resources.async_create_item({"url": RESOURCE_URL, "res_type": "module"})
                _LOGGER.info("VN Weather card v%s resource registered", VERSION)
        except (AttributeError, RuntimeError, TypeError, ValueError, OSError) as exc:
            _LOGGER.warning("VN Weather card auto-registration failed (%s). Add resource URL: %s", exc, RESOURCE_URL)
