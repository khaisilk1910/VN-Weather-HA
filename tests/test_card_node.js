/* Offline card smoke tests; no network or Home Assistant instance required. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const elementMap = new Map();
global.customElements = {get(name){return elementMap.get(name)}, define(name, ctor){elementMap.set(name, ctor)}};
global.CustomEvent = class {constructor(type, options){this.type=type;this.detail=options.detail;this.bubbles=options.bubbles;this.composed=options.composed}};
global.HTMLElement = class {
  constructor(){this.isConnected=true;this.events=[]}
  attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};return this.shadowRoot}
  dispatchEvent(e){this.events.push(e);return true}
};
global.document = {createElement(tag){const Constructor=elementMap.get(tag);return Constructor?new Constructor():{}}};
require(path.resolve(__dirname,'../custom_components/vn_weather_ha/frontend/vn-weather-ha-card.js'));
const Card = elementMap.get('vn-weather-ha-card');
const Editor = elementMap.get('vn-weather-ha-card-editor');
assert(Card && Editor);
assert(global.customCards.some(c => c.type==='vn-weather-ha-card' && c.getEntitySuggestion));
let calls=0, unsub=0;
const callbacks = {};
const connection={subscribeMessage(fn,msg){calls++;callbacks[msg.forecast_type]=fn;return Promise.resolve(()=>unsub++)}};
const hass={language:'vi',config:{time_zone:'Asia/Ho_Chi_Minh'},connection,states:{
  'weather.vn_ha':{state:'sunny',attributes:{friendly_name:'Hà Nội',temperature:29.5,temperature_unit:'°C',humidity:82,
    pressure:1007,pressure_unit:'hPa',wind_speed:12,wind_speed_unit:'km/h',visibility:10,visibility_unit:'km',
    uv_index:4,apparent_temperature:32,data_source:'open_meteo',model:'best_match',last_refresh:'2026-11-06T08:00:00+00:00',
    sunrise:'2026-11-06T06:00:00+07:00',sunset:'2026-11-06T17:30:00+07:00',time_zone:'Asia/Ho_Chi_Minh'}}
}};
const card=new Card();
card.setConfig({entity:'weather.vn_ha',mode:'detailed',forecast_type:'hourly'});
card.hass=hass;
card.connectedCallback();
assert.match(card.shadowRoot.innerHTML,/Hà Nội/);
assert.match(card.shadowRoot.innerHTML,/Open-Meteo/);
assert.match(card.shadowRoot.innerHTML,/29,5|29\.5/);
assert.match(card.shadowRoot.innerHTML,/Bình minh/);
assert.equal(card.getCardSize(),6);
const mode={dataset:{action:'mode'}};
card._click({target:{closest:selector=>selector==='button[data-action]'?mode:null}});
assert.equal(card.getCardSize(),3);
assert.doesNotMatch(card.shadowRoot.innerHTML,/class="forecast"/);
card.hass=hass; card.hass=hass;
setImmediate(()=>{
  assert.equal(calls,2,'No repeated subscribe on hass updates');
  callbacks.hourly({forecast:[{datetime:'2099-01-01T00:00:00Z',temperature:29,condition:'sunny'}]});
  card._mode='detailed';card._render();
  assert.match(card.shadowRoot.innerHTML,/forecast-symbol/);
  card._moreInfo();
  assert.equal(card.events.at(-1).detail.entityId,'weather.vn_ha');
  const editor=new Editor();editor.setConfig({entity:'weather.vn_ha'});editor.hass=hass;
  assert.match(editor.shadowRoot.innerHTML,/Select weather entity/);
  editor._onChange({target:{name:'mode',type:'select',value:'compact'}});
  assert.equal(editor.events.at(-1).detail.config.mode,'compact');
  card.disconnectedCallback();
  assert.equal(unsub,2);
  console.log('VN Weather HA card smoke: OK');
});
