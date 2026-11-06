/* VN Weather HA dashboard card. Copyright (c) 2026 VN Weather HA contributors. MIT License. */
(() => {
  'use strict';
  const TAG = 'vn-weather-ha-card';
  const EDITOR = 'vn-weather-ha-card-editor';
  const SYMBOL = {
    sunny: '☀️', 'clear-night': '🌙', partlycloudy: '🌤️', cloudy: '☁️', rainy: '🌦️',
    pouring: '🌧️', snowy: '❄️', 'snowy-rainy': '🌨️', lightning: '⛈️',
    'lightning-rainy': '⛈️', fog: '🌫️', windy: '🌬️', 'windy-variant': '🌬️',
    hail: '🌨️', exceptional: '⚠️',
  };
  const I18N = {
    vi: {
      weather: 'DỰ BÁO THỜI TIẾT', compact: 'Thu gọn', detailed: 'Chi tiết', hourly: 'Theo giờ',
      daily: 'Theo ngày', feels: 'Cảm nhận', humidity: 'Độ ẩm', pressure: 'Áp suất',
      wind: 'Gió', gust: 'Gió giật', cloud: 'Mây', visibility: 'Tầm nhìn', uv: 'UV',
      dew: 'Điểm sương', rain: 'Mưa', sunup: 'Bình minh', sundown: 'Hoàng hôn',
      high: 'Cao nhất', low: 'Thấp nhất', updated: 'Cập nhật', stale: 'Dữ liệu lưu tạm, có thể đã cũ',
      empty: 'Chưa có dữ liệu. Kiểm tra kết nối và entity thời tiết.',
      choose: 'Chọn thực thể weather trong trình chỉnh sửa thẻ.',
      source: 'Nguồn', noforecast: 'Chưa có dự báo cho chế độ này',
      today: 'Hôm nay', tomorrow: 'Ngày mai', settings: 'Thiết lập thẻ',
      condition: {sunny:'Nắng', 'clear-night':'Trời quang', partlycloudy:'Ít mây', cloudy:'Nhiều mây',
        rainy:'Mưa', pouring:'Mưa to', fog:'Sương mù', lightning:'Dông', 'lightning-rainy':'Dông mưa',
        snowy:'Tuyết', 'snowy-rainy':'Mưa tuyết', windy:'Nhiều gió', hail:'Mưa đá'},
    },
    en: {
      weather: 'WEATHER FORECAST', compact: 'Compact', detailed: 'Details', hourly: 'Hourly',
      daily: 'Daily', feels: 'Feels like', humidity: 'Humidity', pressure: 'Pressure',
      wind: 'Wind', gust: 'Gusts', cloud: 'Cloud', visibility: 'Visibility', uv: 'UV',
      dew: 'Dew point', rain: 'Rain', sunup: 'Sunrise', sundown: 'Sunset',
      high: 'High', low: 'Low', updated: 'Updated', stale: 'Cached data may be outdated',
      empty: 'Weather data is not yet available. Check integration and connection.',
      choose: 'Choose a weather entity in card settings.', source: 'Source',
      noforecast: 'No forecast available for this view', today: 'Today', tomorrow: 'Tomorrow',
      settings: 'Card settings', condition: {},
    },
  };
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const validNumber = value => typeof value === 'number' && Number.isFinite(value);
  const numberText = (value, digits = 0) => validNumber(value)
    ? new Intl.NumberFormat(undefined, {maximumFractionDigits: digits}).format(value) : '—';
  const metricValue = (value, unit = '', digits = 0) => validNumber(value)
    ? `${numberText(value, digits)}${unit ? ` ${unit}` : ''}` : null;
  const sourceTitle = value => value === 'open_meteo' ? 'Open-Meteo'
    : value === 'met_norway' ? 'MET Norway' : (value || '—');
  const compactDate = (value, tz, locale, type) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.valueOf())) return '—';
    const opts = type === 'hourly' ? {hour:'2-digit',minute:'2-digit'}
      : type === 'clock' ? {hour:'2-digit',minute:'2-digit'}
      : {weekday:'short',day:'numeric',month:'numeric'};
    if (tz) opts.timeZone = tz;
    try {return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN':'en-US', opts).format(d);}
    catch (_err) {delete opts.timeZone; return new Intl.DateTimeFormat('en-US', opts).format(d);}
  };
  const unitFrom = (state, suffix, fallback) => state?.attributes?.[suffix] || fallback;
  const STYLE = `
    :host { display:block; --vnh-text:#fff; --vnh-muted:rgba(247,253,255,.75); }
    ha-card { position:relative; overflow:hidden; isolation:isolate; color:var(--vnh-text);
      font-family:var(--primary-font-family,system-ui,sans-serif); background:
      radial-gradient(circle at 88% 5%,rgba(111,239,254,.33),transparent 33%),
      linear-gradient(128deg,#082e69 0%,#1265a1 53%,#079eaf 120%);
      border:1px solid rgba(191,236,255,.28); border-radius:24px;
      box-shadow:0 16px 38px rgba(0,31,76,.19); }
    ha-card.sunny {background:radial-gradient(circle at 82% 20%,rgba(255,234,124,.44),transparent 37%),linear-gradient(128deg,#075ca9,#0388bf 68%,#2da29c)}
    ha-card.rain {background:radial-gradient(circle at 82% 20%,rgba(179,202,241,.21),transparent 40%),linear-gradient(128deg,#13294e,#2b557f 67%,#426e89)}
    ha-card.night {background:radial-gradient(circle at 82% 14%,rgba(122,137,236,.25),transparent 38%),linear-gradient(128deg,#111b3a,#273464 69%,#355d91)}
    .ambient {position:absolute;right:-75px;top:-105px;width:275px;height:275px;pointer-events:none;border-radius:50%;
      background:radial-gradient(circle,rgba(255,255,255,.15),transparent 67%);animation:vnh-pulse 9s ease-in-out infinite;z-index:-1}
    .main {padding:21px 22px 18px}.head,.bottom,.section-bar,.forecast-row {display:flex;justify-content:space-between;align-items:center;gap:10px}
    .eyebrow{font-size:10px;font-weight:800;letter-spacing:.16em;color:#cff6ff}.title{margin:5px 0 0;font-size:20px;font-weight:750;overflow-wrap:anywhere}
    .mode{color:#f9feff;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.35);border-radius:999px;
      padding:8px 11px;font-size:12px;cursor:pointer;white-space:nowrap;min-height:34px;font-family:inherit}
    button:focus-visible,.hero:focus-visible{outline:3px solid #f5f9a5;outline-offset:3px}
    .hero{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:18px 0 17px;cursor:pointer;border-radius:12px}
    .temperature {font-size:clamp(48px,7vw,78px);font-weight:760;line-height:1;letter-spacing:-.055em;font-variant-numeric:tabular-nums}
    .description{font-size:15px;font-weight:600;margin-top:8px}.subtext{font-size:12px;color:var(--vnh-muted);margin-top:4px}
    .symbol{font-size:clamp(64px,10vw,96px);filter:drop-shadow(0 12px 16px rgba(1,20,50,.3));line-height:1.1;
      animation:vnh-float 6s ease-in-out infinite;flex-shrink:0}
    .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .tile{border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.10);padding:12px 11px;min-width:0;backdrop-filter:blur(5px)}
    .key{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--vnh-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .value{font-size:15px;font-weight:750;margin-top:6px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
    .line{height:1px;background:rgba(255,255,255,.21);margin:17px 0 13px}.section-bar{margin-bottom:12px}
    .section-title{font-size:13px;font-weight:750}.tabs{display:flex;gap:3px;border-radius:12px;background:rgba(0,0,0,.18);padding:3px}
    .tab{border:0;color:rgba(255,255,255,.79);font-size:11px;cursor:pointer;padding:7px 9px;background:transparent;border-radius:10px;font-family:inherit}
    .tab[aria-selected=true]{color:#fff;background:rgba(255,255,255,.25);font-weight:750}
    .forecast{display:grid;grid-template-columns:repeat(var(--slots,5),minmax(0,1fr));gap:6px}
    .forecast-row{flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;min-width:0;
      padding:10px 3px;border-radius:12px;background:rgba(255,255,255,.10)}
    .when{font-size:10px;color:var(--vnh-muted);white-space:nowrap}.forecast-symbol{font-size:22px;line-height:1.2}
    .forecast-temp{font-size:13px;font-weight:750}.forecast-min{font-size:11px;color:var(--vnh-muted)}
    .bottom{font-size:10px;color:var(--vnh-muted);margin-top:14px;flex-wrap:wrap}
    .source{display:inline-flex;gap:6px;align-items:center}.dot{width:7px;height:7px;background:#a4fcd3;border-radius:50%;flex:0 0 auto}
    .stale .dot{background:#ffd16b}.notice{padding:10px 12px;background:rgba(255,209,107,.17);border:1px solid rgba(255,209,107,.4);border-radius:11px;font-size:12px;margin-top:10px}
    .empty{color:var(--vnh-muted);padding:20px 2px;font-size:13px;line-height:1.6}.attribution{font-size:9px;color:var(--vnh-muted);margin-top:10px}
    .compact .main{padding:16px 18px}.compact .title{font-size:17px}.compact .hero{margin:9px 0 10px}.compact .temperature{font-size:54px}.compact .symbol{font-size:60px}
    .compact .metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.compact .tile{padding:9px}.compact .value{font-size:13px}
    @keyframes vnh-float{50%{transform:translateY(-6px)}}@keyframes vnh-pulse{50%{opacity:.65;transform:scale(1.15)}}
    @media(max-width:370px){.main{padding:17px 14px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.forecast{gap:3px}.forecast-row{padding:9px 1px}.when{font-size:9px}}
    @media(prefers-reduced-motion:reduce){.symbol,.ambient{animation:none}}
  `;

  class VNWeatherHACard extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'});
      this._config = {mode:'detailed', forecast_type:'hourly', forecast_slots:5, show_forecast:true, show_source:true};
      this._mode = 'detailed'; this._tab = 'hourly'; this._hass = null;
      this._forecasts = {hourly:[],daily:[]}; this._unsub = [];
      this._subscriptionKey = ''; this._subscriptionEpoch = 0;
      this.shadowRoot.addEventListener('click', event => this._click(event));
      this.shadowRoot.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-action="more"]')) {
          event.preventDefault(); this._moreInfo();
        }
      });
    }
    static getConfigElement() {return document.createElement(EDITOR);}
    static getStubConfig(hass) {
      return {entity: Object.keys(hass?.states || {}).find(x => x.startsWith('weather.')) || '',
        mode:'detailed', show_forecast:true, forecast_type:'hourly', forecast_slots:5, show_source:true};
    }
    setConfig(value) {
      if (!value || typeof value !== 'object') throw new Error('VN Weather HA: card configuration is required');
      const config = {...this._config, ...value};
      if (!['compact','detailed'].includes(config.mode)) throw new Error('mode must be compact or detailed');
      if (!['hourly','daily'].includes(config.forecast_type)) throw new Error('forecast_type must be hourly or daily');
      const oldEntity = this._config.entity;
      this._config = config; this._mode = config.mode; this._tab = config.forecast_type;
      if (oldEntity !== config.entity) this._changeSubscription(true);
      this._render();
    }
    set hass(value) {
      const oldConnection = this._hass?.connection;
      this._hass = value;
      if (oldConnection !== value?.connection) this._changeSubscription(true);
      else this._changeSubscription(false);
      this._render();
    }
    connectedCallback(){this._changeSubscription(false);this._render();}
    disconnectedCallback(){this._unsubscribe();}
    getCardSize(){return this._mode === 'compact' ? 3 : 6;}
    _unsubscribe(){
      this._subscriptionEpoch++;
      this._subscriptionKey = '';
      for(const fn of this._unsub.splice(0)) {try{fn();}catch(_e){/* disconnected */}}
    }
    _changeSubscription(force){
      if (!this.isConnected || !this._hass?.connection?.subscribeMessage || !this._config.entity) return;
      const conn = this._hass.connection;
      const key = `${this._config.entity}`;
      if (!force && this._subscriptionKey === key && this._subConnection === conn) return;
      this._unsubscribe(); this._subConnection = conn; this._subscriptionKey = key;
      this._forecasts = {hourly:[],daily:[]};
      const epoch = this._subscriptionEpoch;
      for (const forecastType of ['hourly','daily']) {
        Promise.resolve().then(() => conn.subscribeMessage(event => {
          if (epoch !== this._subscriptionEpoch || !this.isConnected) return;
          if (Array.isArray(event?.forecast)) {this._forecasts[forecastType] = event.forecast; this._render();}
        }, {type:'weather/subscribe_forecast', entity_id:key, forecast_type:forecastType}))
          .then(unsubscribe => {
            if (epoch !== this._subscriptionEpoch || !this.isConnected) {
              if (typeof unsubscribe === 'function') unsubscribe();
            } else if (typeof unsubscribe === 'function') this._unsub.push(unsubscribe);
          }).catch(err => {if(epoch === this._subscriptionEpoch) console.debug('VN Weather HA forecast unavailable',forecastType,err);});
      }
    }
    _click(event){
      const button = event.target.closest('button[data-action]');
      if (button) {
        const action = button.dataset.action;
        if (action === 'mode') this._mode = this._mode === 'detailed' ? 'compact':'detailed';
        if (action === 'hourly' || action === 'daily') this._tab = action;
        this._render(); return;
      }
      if (event.target.closest('[data-action="more"]')) this._moreInfo();
    }
    _moreInfo(){
      if (!this._config.entity) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', {detail:{entityId:this._config.entity}, bubbles:true, composed:true}));
    }
    _tr(){
      const lang = this._config.language && this._config.language !== 'auto' ? this._config.language
        : (this._hass?.language || 'vi').split('-')[0];
      return {code: lang === 'vi' ? 'vi':'en', t:I18N[lang === 'vi'?'vi':'en']};
    }
    _metric(name, emoji, value){return value === null || value === undefined || value === '—' ? '' :
      `<div class="tile"><div class="key"><span aria-hidden="true">${emoji}</span>${escapeHtml(name)}</div><div class="value">${escapeHtml(value)}</div></div>`;}
    _forecastMarkup(t, code, tz) {
      const rows = this._forecasts[this._tab] || [];
      const count = Math.max(3,Math.min(8,Math.round(Number(this._config.forecast_slots) || 5)));
      const now = Date.now();
      const upcoming = rows.filter(row => {
        const stamp = new Date(row.datetime).getTime();
        return Number.isFinite(stamp) && (this._tab === 'daily' || stamp >= now - 30 * 60 * 1000);
      }).slice(0,count);
      if (!upcoming.length) return `<div class="empty">${escapeHtml(t.noforecast)}</div>`;
      return `<div class="forecast" style="--slots:${upcoming.length}">${upcoming.map(row => {
        const icon = SYMBOL[row.condition] || '🌡️';
        const temp = metricValue(row.temperature, '°', 0);
        const low = metricValue(row.templow, '°', 0);
        const label = compactDate(row.datetime,tz,code,this._tab);
        return `<div class="forecast-row"><span class="when">${escapeHtml(label)}</span>
          <span class="forecast-symbol" aria-hidden="true">${icon}</span><span class="forecast-temp">${escapeHtml(temp || '—')}</span>
          ${this._tab==='daily' && low ? `<span class="forecast-min">${escapeHtml(low)}</span>` : ''}</div>`;
      }).join('')}</div>`;
    }
    _render(){
      if (!this.shadowRoot) return;
      const {t,code} = this._tr();
      const s = this._hass?.states?.[this._config.entity];
      const a = s?.attributes || {};
      const tz = a.time_zone || this._hass?.config?.time_zone || undefined;
      const weather = s?.state;
      const compact = this._mode === 'compact';
      const category = weather === 'sunny' || weather === 'partlycloudy' ? 'sunny' :
        weather === 'clear-night' ? 'night' :
        ['rainy','pouring','lightning','lightning-rainy','snowy-rainy'].includes(weather) ? 'rain' : '';
      const present = !!s && weather !== 'unknown' && weather !== 'unavailable';
      const unit = unitFrom(s,'temperature_unit','°C');
      const temp = metricValue(a.temperature,unit,1);
      const source = sourceTitle(a.data_source);
      const weatherText = t.condition[weather] || escapeHtml(weather?.replaceAll('-', ' ') || '—');
      const sourceStamp = compactDate(a.last_refresh,tz,code,'clock');
      const forecastAvailable = this._config.show_forecast !== false && !compact;
      const header = `<div class="head"><div><div class="eyebrow">${escapeHtml(t.weather)}</div>
        <div class="title">${escapeHtml(this._config.name || a.friendly_name || this._config.entity || 'VN Weather HA')}</div></div>
        <button class="mode" type="button" data-action="mode" aria-label="${escapeHtml(compact?t.detailed:t.compact)}">${escapeHtml(compact?t.detailed:t.compact)} ⇄</button></div>`;
      let body = present ? `<div class="hero" data-action="more" role="button" tabindex="0" title="More info">
        <div><div class="temperature">${escapeHtml(temp||'—')}</div><div class="description">${weatherText}</div>
        <div class="subtext">${escapeHtml(t.feels)}: ${escapeHtml(metricValue(a.apparent_temperature,unit,1)||'—')}</div></div>
        <div class="symbol" aria-hidden="true">${SYMBOL[weather] || '🌦️'}</div></div>` :
        `<div class="empty">${escapeHtml(this._config.entity ? t.empty : t.choose)}</div>`;
      if (present) {
        const details = [
          [t.humidity,'💧',metricValue(a.humidity,'%')], [t.wind,'🌬️',metricValue(a.wind_speed,unitFrom(s,'wind_speed_unit','km/h'),1)],
          [t.pressure,'🧭',metricValue(a.pressure,unitFrom(s,'pressure_unit','hPa'),1)],
          [t.visibility,'👁️',metricValue(a.visibility,unitFrom(s,'visibility_unit','km'),1)],
          [t.uv,'☀️',metricValue(a.uv_index,'',1)], [t.cloud,'☁️',metricValue(a.cloud_coverage,'%')],
          [t.gust,'💨',metricValue(a.wind_gust_speed,unitFrom(s,'wind_speed_unit','km/h'),1)],
          [t.dew,'🌡️',metricValue(a.dew_point,unit,1)],
          [t.high,'🔺',metricValue(a.forecast_high,unit,1)], [t.low,'🔻',metricValue(a.forecast_low,unit,1)],
          [t.sunup,'🌅',a.sunrise ? compactDate(a.sunrise,tz,code,'clock') : null],
          [t.sundown,'🌇',a.sunset ? compactDate(a.sunset,tz,code,'clock') : null],
        ];
        const visible = details.filter(x=>x[2]!==null);
        const shown = compact ? visible.slice(0,3) : visible;
        body += `<div class="metrics">${shown.map(x=>this._metric(...x)).join('')}</div>`;
      }
      if (forecastAvailable) body += `<div class="line"></div><section aria-label="Forecast">
        <div class="section-bar"><span class="section-title">${escapeHtml(t.weather)}</span>
        <div class="tabs" role="tablist"><button class="tab" type="button" data-action="hourly" role="tab" aria-selected="${this._tab==='hourly'}">${escapeHtml(t.hourly)}</button>
        <button class="tab" type="button" data-action="daily" role="tab" aria-selected="${this._tab==='daily'}">${escapeHtml(t.daily)}</button></div></div>
        ${this._forecastMarkup(t,code,tz)}</section>`;
      if (a.is_stale) body += `<div class="notice" role="status">⚠ ${escapeHtml(t.stale)}</div>`;
      if (this._config.show_source !== false && present) {
        body += `<div class="bottom"><span class="source ${a.is_stale?'stale':''}"><i class="dot" aria-hidden="true"></i>
          ${escapeHtml(t.source)}: ${escapeHtml(source)}${a.model ? ` · ${escapeHtml(a.model)}`:''}</span>
          ${a.last_refresh ? `<span>${escapeHtml(t.updated)} ${escapeHtml(sourceStamp)}</span>`:''}</div>
          <div class="attribution">${a.data_source==='met_norway'?'Weather data: MET Norway':'Weather data: Open-Meteo.com (CC BY 4.0)'}</div>`;
      }
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card class="${category} ${compact?'compact':''}" aria-label="VN Weather HA">
        <div class="ambient"></div><div class="main">${header}${body}</div></ha-card>`;
    }
  }

  class VNWeatherHACardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._config = {};
      this._hass = null;
      this._rendered = false;
      this._entitiesFingerprint = '';
      this._deferredEntityUpdate = false;
      this.shadowRoot.addEventListener('change', event => this._onChange(event));
      this.shadowRoot.addEventListener('focusout', event => {
        // Never replace an open native <select>; changing its options closes its popup.
        if (event.target?.name === 'entity' && this._deferredEntityUpdate) {
          this._syncWeatherEntities();
        }
      });
    }
    setConfig(config) {
      this._config = {...(config || {})};
      this._ensureForm();
      // Home Assistant may call setConfig after every edit. Preserve focused nodes.
      this._syncWeatherEntities();
      this._syncControls();
    }
    set hass(value) {
      // HA updates hass on *every* state change, often while a select is open.
      // Do not rebuild the form here: only the entity dropdown may need new options.
      this._hass = value;
      this._ensureForm();
      this._syncWeatherEntities();
    }
    _onChange(event) {
      const input = event.target;
      if (!input?.name) return;
      const value = input.type === 'checkbox' ? input.checked
        : input.name === 'forecast_slots' ? Number(input.value) : input.value;
      if (this._config[input.name] === value) return;
      this._config = {...this._config, [input.name]:value};
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail:{config:{...this._config}}, bubbles:true, composed:true,
      }));
    }
    _ensureForm() {
      if (this._rendered) return;
      // Build the form only once. Replacing innerHTML while the user is interacting
      // with a native dropdown destroys its DOM node and dismisses the popup.
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;font-family:var(--primary-font-family,system-ui);color:var(--primary-text-color)}
        .form{display:grid;gap:12px;padding:10px 2px}label{display:grid;gap:5px;font-size:13px;font-weight:600}
        select,input:not([type=checkbox]){width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--divider-color,#ccc);
          border-radius:9px;padding:11px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#111);font:inherit}
        .check{display:flex;gap:10px;align-items:center}.check input{width:18px;height:18px}
      </style><div class="form">
        <label>Weather entity <select name="entity"><option value="">-- Select weather entity --</option></select></label>
        <label>Title <input name="name" placeholder="VN Weather HA" /></label>
        <label>Layout <select name="mode"><option value="detailed">Detailed</option>
          <option value="compact">Compact</option></select></label>
        <label>Forecast view <select name="forecast_type"><option value="hourly">Hourly</option>
          <option value="daily">Daily</option></select></label>
        <label>Forecast slots <select name="forecast_slots">${[3,4,5,6,7,8].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label>
        <label>Language <select name="language"><option value="auto">Auto</option>
          <option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
        <label class="check"><input name="show_forecast" type="checkbox">Show forecast</label>
        <label class="check"><input name="show_source" type="checkbox">Show data source / refresh</label>
      </div>`;
      this._rendered = true;
      this._syncControls();
    }
    _syncControls() {
      if (!this._rendered) return;
      const cfg = this._config;
      const defaults = {name:'', entity:'', mode:'detailed', forecast_type:'hourly',
        forecast_slots:5, language:'auto', show_forecast:true, show_source:true};
      for (const input of this.shadowRoot.querySelectorAll('[name]')) {
        // The select popup and in-progress text must survive an external config update.
        if (input === this.shadowRoot.activeElement) continue;
        const value = cfg[input.name] ?? defaults[input.name];
        if (input.type === 'checkbox') {
          if (input.checked !== Boolean(value)) input.checked = Boolean(value);
        } else if (input.value !== String(value)) {
          input.value = String(value);
        }
      }
    }
    _syncWeatherEntities() {
      if (!this._hass || !this._rendered) return;
      const select = this.shadowRoot.querySelector('select[name="entity"]');
      if (!select) return;
      const states = this._hass.states || {};
      const records = Object.keys(states).filter(key => key.startsWith('weather.')).sort()
        .map(key => [key, states[key]?.attributes?.friendly_name || key]);
      const fingerprint = JSON.stringify([records, this._config.entity || '']);
      if (fingerprint === this._entitiesFingerprint) {
        this._deferredEntityUpdate = false;
        return;
      }
      if (this.shadowRoot.activeElement === select) {
        this._deferredEntityUpdate = true;
        return;
      }
      const selected = this._config.entity || select.value || '';
      // Keep configured entities visible even when temporarily unavailable.
      if (selected && !records.some(([key]) => key === selected)) records.push([selected, selected]);
      select.innerHTML = '<option value="">-- Select weather entity --</option>' +
        records.map(([key, label]) => `<option value="${escapeHtml(key)}">${escapeHtml(label)} · ${escapeHtml(key)}</option>`).join('');
      select.value = selected;
      this._entitiesFingerprint = fingerprint;
      this._deferredEntityUpdate = false;
    }
  }
  if (!customElements.get(TAG)) customElements.define(TAG,VNWeatherHACard);
  if (!customElements.get(EDITOR)) customElements.define(EDITOR,VNWeatherHACardEditor);
  globalThis.customCards = globalThis.customCards || [];
  if (!globalThis.customCards.some(card=>card.type===TAG)) {
    globalThis.customCards.push({type:TAG,name:'VN Weather HA',description:'Weather detail/compact card with multi-source status',
      preview:true,documentationURL:'https://github.com/khaisilk1910/VN-Weather-HA',
      getEntitySuggestion:(_hass,entityId)=>entityId.startsWith('weather.')?{config:{type:`custom:${TAG}`,entity:entityId,mode:'detailed'}}:null});
  }
})();
