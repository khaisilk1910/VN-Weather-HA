"""Run frontend resource registration using isolated mock HA modules."""
import asyncio
import importlib.util
import sys
import types
from pathlib import Path

ROOT = Path(__file__).parents[1]
PKG = ROOT / "custom_components" / "vn_weather_ha"


def load_resource_module():
    for name in list(sys.modules):
        if name.startswith('_vncard_test') or name.startswith('homeassistant'):
            del sys.modules[name]
    base = types.ModuleType('_vncard_test')
    base.__path__ = [str(PKG)]
    sub = types.ModuleType('_vncard_test.frontend')
    sub.__path__ = [str(PKG / 'frontend')]
    sys.modules['_vncard_test'] = base
    sys.modules['_vncard_test.frontend'] = sub
    http = types.ModuleType('homeassistant.components.http')
    http.StaticPathConfig = lambda url, path, cache: (url, str(path), cache)
    core = types.ModuleType('homeassistant.core')
    core.HomeAssistant = object
    sys.modules['homeassistant'] = types.ModuleType('homeassistant')
    sys.modules['homeassistant.components'] = types.ModuleType('homeassistant.components')
    sys.modules['homeassistant.components.http'] = http
    sys.modules['homeassistant.core'] = core
    spec = importlib.util.spec_from_file_location(
        '_vncard_test.frontend.impl', PKG / 'frontend/__init__.py')
    mod = importlib.util.module_from_spec(spec)
    mod.__package__ = '_vncard_test.frontend'
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


class Resources:
    def __init__(self, loaded=False):
        self.loaded = loaded
        self.records = [{'id':'original', 'url':'/other/card.js', 'res_type':'module'}]
        self.load_calls = 0
    async def async_load(self):
        self.load_calls += 1
        self.loaded = True
    def async_items(self):
        assert self.loaded
        return list(self.records)
    async def async_create_item(self, record):
        self.records.append({'id':'newcard', **record})
    async def async_update_item(self, id_, record):
        self.records = [{**old, **record} if old['id']==id_ else old for old in self.records]


class HTTP:
    def __init__(self):
        self.paths=[]
    async def async_register_static_paths(self, paths):
        self.paths.extend(paths)


class HA:
    def __init__(self,resources):
        self.data={'lovelace':types.SimpleNamespace(resources=resources)}
        self.http=HTTP()


def test_resource_registration_deduplicates_and_preserves_other_cards():
    mod=load_resource_module()
    resources=Resources()
    hass=HA(resources)
    async def run():
        await asyncio.gather(mod.async_register_frontend(hass),mod.async_register_frontend(hass))
        assert len(hass.http.paths)==1
        assert resources.load_calls==1
        assert len(resources.records)==2
        assert resources.records[0]['url']=='/other/card.js'
        assert resources.records[1]['url']==mod.RESOURCE_URL
        resources.records[1]['url']=mod.CARD_URL+'?v=old'
        await mod.async_register_frontend(hass)
        assert len(resources.records)==2
        assert resources.records[1]['url']==mod.RESOURCE_URL
    asyncio.run(run())


def test_lovelace_yaml_does_not_touch_storage():
    mod=load_resource_module()
    hass=HA(types.SimpleNamespace(async_items=lambda:[]))
    asyncio.run(mod.async_register_frontend(hass))
    assert len(hass.http.paths)==1
