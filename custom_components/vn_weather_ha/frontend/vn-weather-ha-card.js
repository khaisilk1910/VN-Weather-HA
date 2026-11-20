/* VN Weather HA / Seven Skies Photo Backgrounds edition. Copyright (c) 2026 VN Weather HA contributors. MIT License. */
(() => {
  'use strict';
  const TAG = 'vn-weather-ha-card';
  const EDITOR = 'vn-weather-ha-card-editor';
  const THEMES = Object.freeze({
    aurora:  {vi:'01 · Aurora Glass',     en:'01 · Aurora Glass',     top:'#07183e',mid:'#073c73',low:'#00a6af',hill:'#14295d',hill2:'#082448',water:'#056688',base:'5,24,58',accent:'#57e8e2'},
    scenic:  {vi:'02 · Scenic Weather',   en:'02 · Scenic Weather',   top:'#0d417e',mid:'#2c8dc5',low:'#f8bf7d',hill:'#245071',hill2:'#102f58',water:'#16648a',base:'9,43,78',accent:'#79d9ff'},
    mist:    {vi:'03 · Mountain Mist',    en:'03 · Mountain Mist',    top:'#345a74',mid:'#9bb6c6',low:'#ccdee0',hill:'#55788a',hill2:'#23445a',water:'#527b8a',base:'38,62,79',accent:'#b2f3f1'},
    twilight:{vi:'04 · Twilight Lake',   en:'04 · Twilight Lake',   top:'#091b55',mid:'#444c9c',low:'#d585ac',hill:'#2a3f7b',hill2:'#111f56',water:'#323c93',base:'15,25,75',accent:'#cbb4ff'},
    sunset:  {vi:'05 · Sunset Glow',     en:'05 · Sunset Glow',     top:'#452352',mid:'#dc6e6e',low:'#ffb56b',hill:'#844a68',hill2:'#3c3358',water:'#b85b79',base:'66,31,68',accent:'#ffc88e'},
    sky:     {vi:'06 · Sky Motion',      en:'06 · Sky Motion',      top:'#0759a1',mid:'#229cd3',low:'#d1f0e4',hill:'#588b8a',hill2:'#1a6f7f',water:'#1c9fc1',base:'9,64,110',accent:'#9ff3fa'},
    ocean:   {vi:'07 · Ocean Neon',      en:'07 · Ocean Neon',      top:'#071334',mid:'#103777',low:'#1268a7',hill:'#112a6b',hill2:'#091946',water:'#03578f',base:'6,23,65',accent:'#36e9fc'},
  });
  // Exact names of the replaceable offline photo files (no external URLs).
  const PHOTO_STEMS = Object.freeze({
    aurora:'01-aurora-glass', scenic:'02-scenic-weather', mist:'03-mountain-mist',
    twilight:'04-twilight-lake', sunset:'05-sunset-glow', sky:'06-sky-motion', ocean:'07-ocean-neon'
  });
  // Each panel_style is a usable preset in the card editor and YAML.
  // Keep existing IDs glow/soft for backward compatibility with existing dashboards.
  const PANEL_STYLES = Object.freeze({
    crystal: "01 / Crystal Clear - clear architectural glass",
    sapphire: "02 / Skyline - luminous blue glass",
    frost: "03 / Alpine Frost - icy diffuse glass",
    vapor: "04 / Vapor Silk - almost invisible mist",
    ocean: "05 / Sea Glass - coastal translucence",
    aurora: "06 / Aurora Mesh - lilac and aqua",
    sunrise: "07 / Champagne Hour - warm sunlight",
    rose: "08 / Rose Quartz - luminous blush",
    mint: "09 / Botanical Haze - muted sage",
    solstice: "10 / Solstice - peach-to-violet",
    pearl: "11 / Opal Pearl - iridescent white",
    titanium: "12 / Satin Titanium - brushed silver",
    ceramic: "13 / Porcelain - milky ceramic",
    graphite: "14 / Carbon Glass - neutral graphite",
    ink: "15 / Midnight Ink - editorial navy",
    neon: "16 / Azure Hairline - precise cyan edge",
    liquid: "17 / Liquid Lens - curved glass light",
    hologram: "18 / Holographic - subtle spectrum",
    prism: "19 / Prism Rim - optical edge",
    editorial: "20 / Atelier Line - minimalist structure",
    glow: 'Legacy / Kính xanh phản chiếu',
    soft: 'Legacy / Kính mềm đơn giản',
  });
  const PANEL_STYLE_GROUPS = Object.freeze([
    ["01  /  ULTRA CLEAR", ["crystal","sapphire","frost","vapor","ocean"]],
    ["02  /  ATMOSPHERIC GRADIENTS", ["aurora","sunrise","rose","mint","solstice"]],
    ["03  /  PREMIUM MATERIALS", ["pearl","titanium","ceramic","graphite","ink"]],
    ["04  /  MODERN EDGE", ["neon","liquid","hologram","prism","editorial"]],
    ['05  /  CLASSIC (OLDER DASHBOARDS)', ['glow','soft']],
  ]);
  const ORIGINAL_PANEL_STYLES = Object.freeze(['glow','soft']);
  const DEFAULT_PHOTO_BASE = '/vn_weather_ha/backgrounds';
  // The 21 photo assets included in this release: 7 themes × 3 day phases.
  // Keep the numerical file prefixes from the supplied artwork ZIP.
  const PHOTO_INDEX = Object.freeze({
    aurora:1, scenic:2, mist:3, twilight:4, sunset:5, sky:6, ocean:7
  });
  const photoBase = value => {
    const base=String(value||DEFAULT_PHOTO_BASE).trim().replace(/\/+$/,'');
    // Only local resources are allowed: /vn_weather_ha/... or /local/..., plus ./ for bundled demo.
    if(!(/^(?:\/|\.\/)[a-zA-Z0-9_./-]+$/.test(base)) || base.startsWith('//') || base.split('/').includes('..'))
      return DEFAULT_PHOTO_BASE;
    return base;
  };
  const SYMBOL = {sunny:'sun','clear-night':'moon',partlycloudy:'partly',cloudy:'cloud',rainy:'rain',pouring:'rain',snowy:'snow',
    'snowy-rainy':'snow',lightning:'storm','lightning-rainy':'storm',fog:'fog',windy:'wind','windy-variant':'wind',hail:'snow',exceptional:'storm'};
  const I18N = {
    vi: {weather:'DỰ BÁO THỜI TIẾT',compact:'Thu gọn',detailed:'Chi tiết',hourly:'Theo giờ',daily:'Theo ngày',feels:'Cảm nhận',
      humidity:'Độ ẩm',pressure:'Áp suất',wind:'Gió',gust:'Gió giật',cloud:'Mây',visibility:'Tầm nhìn',uv:'UV',dew:'Điểm sương',
      rain:'Khả năng mưa',sunup:'Bình minh',sundown:'Hoàng hôn',high:'Cao nhất',low:'Thấp nhất',updated:'Cập nhật',
      stale:'Dữ liệu lưu tạm, có thể đã cũ',empty:'Chưa có dữ liệu. Kiểm tra kết nối và entity thời tiết.',
      choose:'Chọn thực thể weather trong trình chỉnh sửa thẻ.',source:'Nguồn',noforecast:'Chưa có dự báo cho chế độ này',
      today:'Hôm nay',settings:'Thiết lập thẻ',forecast:'DỰ BÁO THỜI TIẾT',
      condition:{sunny:'Trời nắng','clear-night':'Trời quang',partlycloudy:'Có mây rải rác',cloudy:'Nhiều mây',
        rainy:'Trời mưa',pouring:'Mưa to',fog:'Sương mù',lightning:'Dông','lightning-rainy':'Dông mưa',snowy:'Tuyết',
        'snowy-rainy':'Mưa tuyết',windy:'Nhiều gió','windy-variant':'Nhiều gió',hail:'Mưa đá'}},
    en: {weather:'WEATHER FORECAST',compact:'Compact',detailed:'Details',hourly:'Hourly',daily:'Daily',feels:'Feels like',
      humidity:'Humidity',pressure:'Pressure',wind:'Wind',gust:'Gusts',cloud:'Cloud',visibility:'Visibility',uv:'UV',
      dew:'Dew point',rain:'Rain chance',sunup:'Sunrise',sundown:'Sunset',high:'High',low:'Low',updated:'Updated',
      stale:'Cached weather data may be outdated',empty:'No current weather data. Check integration and connection.',
      choose:'Select a weather entity in the card editor.',source:'Source',noforecast:'No forecast for this view',
      today:'Today',settings:'Card settings',forecast:'WEATHER OUTLOOK',condition:{}},
  };
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => typeof v === 'number' && Number.isFinite(v);
  const numberText = (v, digits=0) => num(v) ? new Intl.NumberFormat(undefined,{maximumFractionDigits:digits}).format(v) : '—';
  const metricValue = (v,unit='',digits=0) => num(v) ? `${numberText(v,digits)}${unit?' '+unit:''}` : null;
  const sourceTitle = v => v==='open_meteo' ? 'Open-Meteo' : v==='met_norway' ? 'MET Norway' : (v || '—');
  const unitFrom = (s,k,fallback) => s?.attributes?.[k] || fallback;
  const clamp = (value,min,max) => Math.min(max,Math.max(min,Number.isFinite(+value) ? +value : min));
  // Use stable short weekday labels instead of Intl's verbose Vietnamese "Thứ ...".
  // Derive weekday AND calendar day in the weather entity's timezone so labels
  // stay correct near midnight when HA and the browser use different timezones.
  const WEEKDAYS_VI = Object.freeze({Sun:'CN',Mon:'T2',Tue:'T3',Wed:'T4',Thu:'T5',Fri:'T6',Sat:'T7'});
  const compactDate = (v,tz,locale,type) => {
    if (!v) return '—';
    const d=new Date(v); if(!Number.isFinite(d.getTime())) return '—';
    const options=type==='clock'||type==='hourly' ? {hour:'2-digit',minute:'2-digit'} :
      {weekday:'short',day:'numeric',month:'numeric'};
    if(tz)options.timeZone=tz;
    const language=locale==='vi'?'vi-VN':'en-US';
    const format=() => {
      if(type==='clock'||type==='hourly')return new Intl.DateTimeFormat(language,options).format(d);
      // en-US provides Mon...Sun consistently; explicit mapping produces
      // T2...T7/CN without depending on the browser's CLDR translation.
      const parts=new Intl.DateTimeFormat('en-US',options).formatToParts(d);
      const part=name=>parts.find(item=>item.type===name)?.value||'';
      const weekday=part('weekday'),day=part('day'),month=part('month');
      return locale==='vi' ? `${WEEKDAYS_VI[weekday]||weekday}, ${day}/${month}` :
        `${weekday}, ${month}/${day}`;
    };
    try{return format();}
    catch(_e){delete options.timeZone;return format();}
  };

  // Current local calendar date for the optional subtitle below the location.
  // The selected weather entity's timezone wins, then HA's timezone, then the browser.
  const FULL_WEEKDAYS_VI=Object.freeze({Sunday:'Chủ Nhật',Monday:'Thứ Hai',Tuesday:'Thứ Ba',
    Wednesday:'Thứ Tư',Thursday:'Thứ Năm',Friday:'Thứ Sáu',Saturday:'Thứ Bảy'});
  const headerDate = (date,tz,locale) => {
    const options={weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'};
    if(tz)options.timeZone=tz;
    const format=()=>{
      if(locale!=='vi')return new Intl.DateTimeFormat('en-US',{
        ...options,day:'numeric',month:'short'}).format(date);
      const parts=new Intl.DateTimeFormat('en-US',options).formatToParts(date);
      const part=type=>parts.find(item=>item.type===type)?.value||'';
      return `${FULL_WEEKDAYS_VI[part('weekday')]||part('weekday')}, ${part('day')}/${part('month')}/${part('year')}`;
    };
    try{return format();}catch(_e){delete options.timeZone;return format();}
  };

  const CALENDAR_ICON='<svg class="date-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';

  // Small hand-drawn SVG weather glyphs: fast, crisp at every scale, no external fonts/images.
  const weatherIcon = (condition,large=false,night=false) => {
    const kind = SYMBOL[condition] || 'cloud';
    const cloud = `<path d="M25 78c-13 0-21-8-21-20 0-11 8-20 19-21 4-17 18-28 35-26 15 2 25 12 29 25 14-1 25 8 25 21 0 12-9 21-22 21Z" fill="#d8e9ff"/>
      <path d="M25 78c-13 0-21-8-21-20 0-11 8-20 19-21 4-17 18-28 35-26 15 2 25 12 29 25 14-1 25 8 25 21 0 12-9 21-22 21Z" fill="url(#v-cloud)" opacity=".65"/>`;
    const moon = `<path d="M69 10C49 28 54 58 79 66 65 80 38 71 31 49 24 28 40 8 69 10Z" fill="#fff3c5"/>`;
    const sun = `<g stroke="#ffd979" stroke-width="4.5" stroke-linecap="round">${Array.from({length:8},(_,i)=>{
      const a=i*Math.PI/4;return `<path d="M${58+37*Math.cos(a)} ${45+37*Math.sin(a)}l${10*Math.cos(a)} ${10*Math.sin(a)}"/>`;}).join('')}</g><circle cx="58" cy="45" r="27" fill="#ffce57"/><circle cx="52" cy="37" r="21" fill="#ffec98" opacity=".38"/>`;
    const drops = `<g stroke="#73cbff" stroke-width="5" stroke-linecap="round"><path d="M32 86l-7 15M58 86l-7 15M84 86l-7 15"/></g>`;
    const type = kind==='sun' ? sun : kind==='moon' ? moon : kind==='partly' ? `${night?moon:sun}<g transform="translate(20 24) scale(.83)">${cloud}</g>`
      : kind==='rain' ? `${cloud}${drops}` : kind==='storm' ? `${cloud}<path d="M57 68L43 93h15l-8 24 31-38H62l10-11Z" fill="#ffcc5b"/>`
      : kind==='snow' ? `${cloud}<g fill="#dcfaff"><circle cx="27" cy="94" r="4"/><circle cx="57" cy="98" r="4"/><circle cx="84" cy="94" r="4"/></g>`
      : kind==='fog' ? `${cloud}<g stroke="#c6efff" stroke-width="5" stroke-linecap="round"><path d="M20 89h70M33 101h57"/></g>`
      : kind==='wind' ? `${cloud}<g stroke="#a8f2ff" stroke-width="5" fill="none" stroke-linecap="round"><path d="M6 90h92M22 103h58"/></g>` : cloud;
    return `<svg class="weather-icon ${large?'icon-large':''}" viewBox="0 0 120 120" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="v-cloud" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#97b3ea"/></linearGradient></defs>
      ${type}</svg>`;
  };
  const METRIC_ICONS = {
    humidity:'<path d="M12 2C9 7 5 11 5 16a7 7 0 0 0 14 0c0-5-4-9-7-14Z"/>',
    wind:'<path d="M3 8h13a3 3 0 1 0-3-3M2 12h18a3 3 0 1 1-3 3M4 16h8a3 3 0 1 1-3 3"/>',
    pressure:'<circle cx="12" cy="12" r="9"/><path d="m12 12 5-5M5 18h14"/>',
    visibility:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    uv:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7m-10 10-2.1 2.1"/>',
    cloud:'<path d="M5 18a4 4 0 0 1 0-8 7 7 0 0 1 13-2 5 5 0 0 1 1 10Z"/>',
    gust:'<path d="M3 8h13a3 3 0 1 0-3-3M2 13h17m-15 5h8a3 3 0 1 0-3-3"/>',
    dew:'<path d="M12 2C9 7 5 12 5 16a7 7 0 0 0 14 0c0-4-4-9-7-14Z"/><path d="M8 16a4 4 0 0 0 4 4"/>',
    high:'<path d="m12 4-6 7h4v9h4v-9h4Z"/>', low:'<path d="m12 20-6-7h4V4h4v9h4Z"/>',
    sunup:'<path d="M2 20h20M12 4v4m-8 8h2m12 0h2M5 12l2 2m10 0 2-2M5 19a7 7 0 0 1 14 0M12 13v5m-3-3 3-3 3 3"/>',
    sundown:'<path d="M2 20h20M12 4v4m-8 8h2m12 0h2M5 12l2 2m10 0 2-2M5 19a7 7 0 0 1 14 0M12 12v6m-3-3 3 3 3-3"/>',
    rain:'<path d="M5 16a4 4 0 0 1 0-8 7 7 0 0 1 13-1 5 5 0 0 1 1 9ZM7 20l-1 2m7-2-1 2m7-2-1 2"/>',
  };
  const metricIcon = kind => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${METRIC_ICONS[kind]||METRIC_ICONS.cloud}</svg>`;

  const SCENE_EXTRAS = {
    aurora:`<g opacity=".56" filter="url(#blur)"><path d="M-60 110C110 -10 190 250 370 82S550 65 680 -70" fill="none" stroke="#28ffc9" stroke-width="66"/><path d="M-100 0C120 160 220 -65 430 100S530 200 700 20" fill="none" stroke="#577fff" stroke-width="46"/></g>`,
    scenic:`<path d="M0 420l85-100 55 42 84-116 76 112 62-75 68 103 58-75 112 115V600H0Z" fill="#b4d6ea" opacity=".30"/>`,
    mist:`<g fill="#e9f7fb" opacity=".29" filter="url(#blur)"><ellipse cx="280" cy="445" rx="340" ry="38"/><ellipse cx="350" cy="520" rx="390" ry="48"/><ellipse cx="250" cy="670" rx="380" ry="52"/></g>`,
    twilight:`<g fill="#f3ebff" opacity=".8"><circle cx="440" cy="120" r="25"/><circle cx="453" cy="112" r="24" fill="#293a83"/></g>`,
    sunset:`<g stroke="#ffce94" opacity=".48"><path d="M250 600h180M220 630h250M262 668h145M180 705h300" stroke-width="3"/></g>`,
    sky:`<g fill="white" opacity=".45"><ellipse cx="130" cy="150" rx="98" ry="30"/><ellipse cx="370" cy="240" rx="92" ry="22"/></g>`,
    ocean:`<g fill="#b5edff" opacity=".60"><rect x="455" y="430" width="10" height="65"/><rect x="472" y="408" width="18" height="88"/><rect x="493" y="455" width="23" height="42"/><rect x="519" y="425" width="11" height="71"/><rect x="533" y="448" width="18" height="50"/></g>`,
  };
  const sceneSvg = theme => {
    const p=THEMES[theme]||THEMES.scenic;
    const stars=Array.from({length:26},(_,i)=>{
      const x=(i*97+43)%596,y=(i*61+13)%365,r=(i%6===0?1.9:.8);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${.25+(i%4)*.17}"/>`;
    }).join('');
    const trees=Array.from({length:17},(_,i)=>{
      const x=i*40-14,y=538+((i*37)%35),h=45+((i*17)%52);
      return `<path d="M${x} ${y}l13 -${h} 13 ${h}Z" fill="#0b2b41" opacity=".60"/>`;
    }).join('');
    const skyObject = ['twilight','aurora','ocean'].includes(theme) ? `<circle cx="486" cy="135" r="29" fill="#f3f3f5" opacity=".72"/>`
      : `<circle cx="484" cy="255" r="65" fill="url(#sunlight)" opacity=".9"/>`;
    return `<svg class="scene-svg" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs><linearGradient id="sky" x2=".4" y2="1"><stop stop-color="${p.top}"/><stop offset=".52" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.low}"/></linearGradient>
      <linearGradient id="water" x2="0" y2="1"><stop stop-color="${p.water}"/><stop offset="1" stop-color="${p.top}"/></linearGradient>
      <radialGradient id="sunlight"><stop stop-color="#fff8c2"/><stop offset=".23" stop-color="#ffdf86"/><stop offset=".54" stop-color="#ffc876" stop-opacity=".57"/><stop offset="1" stop-color="#fff1b6" stop-opacity="0"/></radialGradient>
      <filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
      </defs><rect width="600" height="900" fill="url(#sky)"/>
      <g class="scene-stars" opacity="${['aurora','twilight','ocean'].includes(theme)?1:.28}">${stars}</g>
      ${skyObject}${SCENE_EXTRAS[theme]||''}
      <path d="M0 511L91 390l57 67 89-117 75 110 82-87 90 101 53-40 63 75v190H0Z" fill="${p.hill}" opacity=".88"/>
      <path d="M0 550l80-72 90 65 84-88 96 81 84-52 77 63 89-95v195H0Z" fill="${p.hill2}" opacity=".94"/>
      ${trees}<path d="M0 585Q150 570 300 591T600 584v316H0Z" fill="url(#water)" opacity=".95"/>
      <g stroke="#e6fbff" opacity=".13" stroke-width="2"><path d="M0 645Q120 630 280 643T600 634"/><path d="M80 698Q210 686 450 698T650 687"/><path d="M0 765Q140 752 300 770T600 756"/><path d="M25 840Q230 824 570 833"/></g>
      </svg>`;
  };

  const STYLE = `
    :host {display:block; --vnh-text:#fff; --vnh-muted:#d3e7fa; font-family:var(--primary-font-family,system-ui,sans-serif);}
    ha-card {--vnh-base:9,43,78; --vnh-accent:#82e0f6; --vnh-card-alpha:.94; --vnh-glass:rgba(6,27,61,.62);
      --vnh-edge:rgba(218,241,255,.40); position:relative; display:block; overflow:hidden; isolation:isolate;
      color:var(--vnh-text); background:rgba(var(--vnh-base),var(--vnh-card-alpha)); border:1px solid rgba(237,249,255,.58);
      border-radius:26px; box-shadow:0 20px 40px rgba(1,10,30,.28),inset 0 1px rgba(255,255,255,.34);
      box-sizing:border-box; text-shadow:0 1px 2px rgba(0,11,34,.32);}
    ha-card:before{content:'';position:absolute;inset:0;z-index:4;pointer-events:none;border-radius:inherit;
      box-shadow:inset 0 1px rgba(255,255,255,.36),inset 1px 0 rgba(255,255,255,.11),inset 0 -1px rgba(255,255,255,.10);}
    ha-card.theme-aurora{--vnh-base:5,24,58;--vnh-accent:#57e8e2}
    ha-card.theme-scenic{--vnh-base:9,43,78;--vnh-accent:#79d9ff}
    ha-card.theme-mist{--vnh-base:38,62,79;--vnh-accent:#b2f3f1}
    ha-card.theme-twilight{--vnh-base:15,25,75;--vnh-accent:#cbb4ff}
    ha-card.theme-sunset{--vnh-base:66,31,68;--vnh-accent:#ffc88e}
    ha-card.theme-sky{--vnh-base:9,64,110;--vnh-accent:#9ff3fa}
    ha-card.theme-ocean{--vnh-base:6,23,65;--vnh-accent:#36e9fc}
    .scene,.shade,.weather-tint,.weather-effects{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
    .scene {opacity:var(--vnh-card-alpha);z-index:0;}
    .scene-vector,.scene-photo{position:absolute;inset:0;width:100%;height:100%;}
    .scene-vector .scene-svg{width:100%;height:100%;display:block;}
    .scene-photo{object-fit:cover;object-position:50% 50%;opacity:0;transition:opacity .35s ease;}
    .scene-photo.loaded{opacity:1;}
    .scene-photo[hidden]{display:none;}
    .phase-night .scene-photo{filter:brightness(.88) saturate(1.08);}
    .phase-dawn .scene-photo,.phase-dusk .scene-photo{filter:saturate(1.10);}
    @media(prefers-reduced-motion:reduce){.scene-photo{transition:none;}}
    .shade{z-index:1;background:linear-gradient(105deg,rgba(3,16,40,.66) 0%,rgba(3,21,49,.27) 61%,rgba(1,20,51,.19) 100%),
      linear-gradient(0deg,rgba(2,18,41,.72) 0%,rgba(3,17,47,.09) 72%);}
    .weather-tint{z-index:2;mix-blend-mode:normal;opacity:.74;}
    .phase-night .scene-svg{filter:brightness(.52) saturate(1.16) hue-rotate(4deg)}
    .phase-night .weather-tint{background:linear-gradient(180deg,rgba(2,6,31,.39),rgba(3,21,58,.27))}
    .phase-dawn .weather-tint,.phase-dusk .weather-tint{background:linear-gradient(125deg,rgba(255,130,90,.15),transparent 68%)}
    .weather-rain .weather-tint,.weather-storm .weather-tint{background:linear-gradient(180deg,rgba(3,15,39,.42),rgba(23,64,101,.28))}
    .weather-fog .weather-tint{background:linear-gradient(180deg,rgba(211,232,235,.15),rgba(171,199,218,.31))}
    .weather-snow .weather-tint{background:linear-gradient(180deg,rgba(186,230,255,.11),rgba(130,178,217,.2))}
    .is-high-contrast .shade{background:linear-gradient(110deg,rgba(1,9,29,.88),rgba(1,10,30,.68)),linear-gradient(0deg,rgba(1,10,30,.72),transparent)}
    .is-high-contrast{--vnh-text:#fff;--vnh-muted:#f2f9ff;--vnh-glass:rgba(3,17,42,.85);--vnh-edge:rgba(236,249,255,.56)}
    .weather-effects{z-index:3;opacity:.82;contain:paint;}
    .weather-effects .particle{position:absolute;left:var(--x);top:var(--y);animation-delay:var(--delay);animation-duration:var(--speed);will-change:transform;}
    .weather-effects .particle:before{content:'';display:block;width:2px;height:30px;border-radius:10px;
      background:linear-gradient(to bottom,transparent,rgba(192,228,255,.7));transform:rotate(16deg)}
    .weather-rain .particle,.weather-storm .particle{animation-name:drop;animation-timing-function:linear;animation-iteration-count:infinite;}
    .weather-snow .particle{animation-name:snowfall;animation-timing-function:linear;animation-iteration-count:infinite;}
    .weather-snow .particle:before{width:5px;height:5px;border-radius:50%;background:rgba(244,249,255,.8)}
    .weather-wind .particle{animation-name:windline;animation-timing-function:linear;animation-iteration-count:infinite;}
    .weather-wind .particle:before{height:2px;width:32px;background:linear-gradient(to right,transparent,rgba(198,233,255,.75));}
    .weather-cloud .particle,.weather-fog .particle{animation-name:drift;animation-timing-function:linear;animation-iteration-count:infinite;}
    .weather-cloud .particle:before,.weather-fog .particle:before{height:35px;width:100px;border-radius:50%;background:rgba(211,235,255,.075);filter:blur(9px)}
    .weather-sun .particle,.weather-neutral .particle{display:none}
    .weather-storm .weather-effects:after{content:'';position:absolute;inset:0;pointer-events:none;background:#e5e7ff;opacity:0;animation:flash 13s ease infinite;}
    .effect-off .weather-effects{display:none}
    .effect-off .symbol .weather-icon{animation:none!important}
    .effect-subtle .particle:nth-child(n+7){display:none}
    .paused .particle,.paused .weather-effects:after,.paused .symbol .weather-icon{animation-play-state:paused!important}
    .main{position:relative;z-index:5;padding:22px 22px 18px;}
    .head,.hero,.bottom,.section-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;}
    .head{min-height:57px;align-items:flex-start}.head-copy{min-width:0;flex:1}
    .eyebrow{font-size:10px;letter-spacing:.18em;font-weight:800;color:#d1f7ff;}
    .title{margin:6px 0 0;font-weight:760;font-size:22px;letter-spacing:-.025em;overflow-wrap:anywhere}
    /* Subtle calendar subtitle; never reserves space when its setting is off. */
    .date-line{display:flex;align-items:center;gap:6px;margin-top:4px;color:#dceeff;font-size:12px;font-weight:600;line-height:1.35;
      letter-spacing:.005em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere;
      text-shadow:0 1px 4px rgba(2,13,35,.45)}
    .date-line[hidden]{display:none}
    .date-icon{width:13px;height:13px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.8;
      stroke-linecap:round;stroke-linejoin:round;opacity:.92}
    button{font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
    .mode{margin-top:10px;font-size:12px;font-weight:750;padding:10px 14px;min-height:38px;max-width:110px;flex-shrink:0;border-radius:999px;
      border:1px solid rgba(229,246,255,.70);color:#fff;cursor:pointer;
      background:linear-gradient(150deg,rgba(226,251,255,.28),rgba(16,66,112,.66));
      box-shadow:inset 0 1px rgba(255,255,255,.37),0 4px 13px rgba(1,14,45,.24);}
    .mode:hover{background:linear-gradient(150deg,rgba(228,252,255,.39),rgba(39,96,153,.72))}
    .mode:focus-visible,.tab:focus-visible,.hero:focus-visible{outline:2px solid #fff0b3;outline-offset:3px}
    .hero{margin:22px 0 24px;min-height:148px;cursor:pointer;align-items:center;position:relative;border-radius:13px;}
    .current{flex:1;min-width:0;}
    .temperature{font-size:clamp(48px, 11vw, 76px);font-weight:780;letter-spacing:-.07em;line-height:1.04;
      font-variant-numeric:tabular-nums;white-space:nowrap;text-shadow:0 2px 12px rgba(3,13,40,.36),0 1px 2px rgba(1,7,22,.48);}
    .description{font-size:17px;font-weight:730;margin-top:8px}.subtext{font-size:12px;color:var(--vnh-muted);margin-top:6px}
    .sun-track{display:flex;gap:15px;flex-wrap:wrap;margin-top:16px;color:#ddedfa;font-size:10px;font-weight:550}
    .sun-track span{white-space:nowrap}.sun-track b{color:#fff;font-weight:650}
    .symbol{width:clamp(112px,32%,174px);max-width:44%;filter:drop-shadow(0 10px 14px rgba(1,13,39,.25));flex-shrink:0;transform-origin:center;}
    .symbol .weather-icon{width:100%;height:auto;display:block;animation:iconfloat 8s ease-in-out infinite;}
    .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;}
    /* 0.3.5 - lake-blue crystal panels inspired by the supplied reference.
       Blue at top-left, soft milky reflection at top-right, translucent base,
       a precise white edge and no constantly animated blur. */
    .surface-glow:not(.is-high-contrast) .shade{
      background:linear-gradient(112deg,rgba(2,22,54,.45),rgba(8,44,84,.17) 64%,rgba(8,38,73,.12)),
        linear-gradient(0deg,rgba(3,27,61,.51),rgba(4,31,66,.02) 75%);}
    .tile{min-height:67px;box-sizing:border-box;position:relative;isolation:isolate;overflow:hidden;
      border:1px solid rgba(224,243,255,.49);border-radius:15px;padding:10px 11px;
      background:radial-gradient(ellipse 100% 145% at 105% -18%,rgba(224,241,255,.33) 0%,rgba(157,205,246,.17) 35%,transparent 71%),
        linear-gradient(132deg,rgba(36,124,200,.49) 0%,rgba(46,107,169,.43) 45%,rgba(15,56,107,.51) 100%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.52),inset 1px 0 rgba(255,255,255,.13),
        inset 0 -1px 0 rgba(210,235,255,.11),0 6px 15px rgba(0,15,45,.19);
      -webkit-backdrop-filter:blur(10px) saturate(148%);backdrop-filter:blur(10px) saturate(148%);
      transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease,filter .2s ease;}
    .tile:before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;
      background:linear-gradient(180deg,rgba(246,253,255,.17) 0%,rgba(225,243,255,.045) 36%,transparent 62%),
        linear-gradient(113deg,rgba(175,229,255,.10),transparent 42%);}
    .tile:after{content:'';pointer-events:none;position:absolute;z-index:0;right:-23px;top:-35px;width:106px;height:93px;
      border-radius:50%;background:radial-gradient(ellipse,rgba(238,249,255,.34),rgba(116,198,255,.13) 45%,transparent 72%);}
    .tile .key,.tile .value,.tile .meter{position:relative;z-index:1;}
    /* Preserve the legacy subdued alternative, without blur or shine. */
    .surface-soft .tile{background:var(--vnh-glass);border-color:rgba(218,241,255,.28);
      box-shadow:inset 0 1px rgba(255,255,255,.16),0 3px 9px rgba(0,9,29,.12);
      -webkit-backdrop-filter:none;backdrop-filter:none;}
    .surface-soft .tile:before,.surface-soft .tile:after{display:none;}
    /* For readability on very bright custom backgrounds. */
    .is-high-contrast .tile{background:linear-gradient(145deg,rgba(16,62,106,.89),rgba(2,21,53,.95));
      border-color:rgba(235,248,255,.59);-webkit-backdrop-filter:none;backdrop-filter:none;}
    @media(hover:hover) and (pointer:fine){
      .surface-glow .tile:hover{transform:translateY(-2px);border-color:rgba(214,248,255,.92);
        filter:brightness(1.08);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.69),inset 0 0 22px rgba(138,212,255,.12),
          0 9px 20px rgba(0,16,49,.30),0 0 14px rgba(114,212,255,.18);}
    }
    .key{display:flex;gap:6px;align-items:center;color:var(--vnh-muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .metric-icon{display:inline-flex;flex:0 0 15px;color:#80dafa}.metric-icon svg{width:15px;height:15px;}
    .tile:nth-child(5n+2) .metric-icon{color:#98efff}.tile:nth-child(5n+3) .metric-icon{color:#f8c57c}
    .tile:nth-child(5n+4) .metric-icon{color:#e3c0ff}.tile:nth-child(5n) .metric-icon{color:#ffd769}
    .value{font-size:14px;font-weight:780;margin-top:7px;white-space:nowrap;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
    .meter{height:4px;border-radius:5px;margin-top:8px;background:rgba(222,240,255,.17);overflow:hidden;}
    .meter>i{height:100%;display:block;background:linear-gradient(90deg,var(--vnh-accent),#fff1ba);border-radius:inherit;}
    .forecast-shell{margin-top:18px;padding:13px 12px 12px;border:1px solid rgba(228,245,255,.48);
      border-radius:19px;background:radial-gradient(ellipse at 100% 0%,rgba(167,216,255,.20),transparent 62%),
        linear-gradient(155deg,rgba(52,130,201,.35),rgba(19,75,137,.39) 40%,rgba(11,47,95,.54));
      box-shadow:inset 0 1px rgba(255,255,255,.36),inset 0 -1px rgba(236,247,255,.08),0 8px 21px rgba(1,12,36,.16);
      -webkit-backdrop-filter:blur(11px) saturate(140%);backdrop-filter:blur(11px) saturate(140%);}
    .surface-soft .forecast-shell{background:rgba(5,22,52,.45);border-color:rgba(238,249,255,.24);box-shadow:none;
      -webkit-backdrop-filter:none;backdrop-filter:none;}
    .is-high-contrast .forecast-shell{background:rgba(3,19,48,.86);}
    .line{height:0;margin:0;}
    .section-bar{margin-bottom:12px}.section-title{font-size:13px;font-weight:800;letter-spacing:.015em}
    .tabs{display:inline-flex;flex-shrink:0;gap:2px;border-radius:12px;background:rgba(1,16,36,.51);padding:3px;border:1px solid rgba(230,243,255,.28)}
    .tab{border:0;color:#d9edff;cursor:pointer;padding:7px 10px;font-size:11px;background:transparent;border-radius:10px;white-space:nowrap;}
    .tab[aria-selected=true]{color:#fff;background:linear-gradient(145deg,#23bcff 0%,#168af4 55%,#1b64de 100%);
      box-shadow:inset 0 1px rgba(255,255,255,.45),0 2px 9px rgba(0,54,148,.34);font-weight:780}
    /* Forecast items lift 2px on hover. Reserve an unclipped inset INSIDE
       the scrollport: overflow-x:auto also clips overflow-y in Chromium/Safari.
       A margin above the list alone cannot prevent the top border being cut. */
    .forecast{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:thin;
      scrollbar-color:rgba(222,245,255,.45) transparent;padding:10px 6px 8px;scroll-padding-inline:6px;}
    .forecast-row{min-width:74px;flex:1 0 74px;min-height:108px;box-sizing:border-box;padding:10px 4px 9px;
      border:1px solid rgba(224,246,255,.41);border-radius:13px;
      background:radial-gradient(ellipse at 95% 0%,rgba(227,244,255,.27),transparent 67%),
        linear-gradient(160deg,rgba(66,145,212,.44),rgba(29,94,158,.44) 46%,rgba(14,55,108,.57));
      box-shadow:inset 0 1px rgba(255,255,255,.40),inset 0 -1px rgba(212,240,255,.08),0 4px 9px rgba(0,12,37,.15);
      -webkit-backdrop-filter:blur(8px) saturate(130%);backdrop-filter:blur(8px) saturate(130%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;scroll-snap-align:start;text-align:center;
      transition:border-color .18s ease,transform .18s ease,filter .18s ease;}
    .surface-soft .forecast-row{background:rgba(12,53,102,.45);border-color:rgba(224,246,255,.14);box-shadow:none;
      -webkit-backdrop-filter:none;backdrop-filter:none;}
    .is-high-contrast .forecast-row{background:rgba(4,28,67,.87)}
    @media(hover:hover) and (pointer:fine){.surface-glow .forecast-row:hover{transform:translateY(-2px);
      border-color:rgba(215,249,255,.92);filter:brightness(1.07);}}

    /* v0.3.8 | 20 distinct premium weather materials.
       CSS-only surfaces: no image overlays, external libraries, or animation loops.
       Original glow/soft still resolve for older YAML configurations. */
    .surface-crystal{--p-main:239,249,255;--p-mid:174,225,247;--p-deep:82,151,188;--p-shine:255,255,255;--p-accent:197,236,255;--p-edge:253,253,255;--p-radius:19px;--p-blur:14px;--p-border:0.47;--p-veil:0.13;--p-sat:124%;--p-flare:radial-gradient(ellipse 120% 85% at 95% -18%,rgba(255,255,255,calc(.27 * var(--p-density))),transparent 64%);--p-wash:linear-gradient(153deg,rgba(239,249,255,calc(.22 * var(--p-density))) 0%,rgba(174,225,247,calc(.16 * var(--p-density))) 52%,rgba(82,151,188,calc(.19 * var(--p-density))) 100%);}
    .surface-sapphire{--p-main:188,231,255;--p-mid:98,188,249;--p-deep:24,104,174;--p-shine:235,249,255;--p-accent:70,175,255;--p-edge:226,246,255;--p-radius:18px;--p-blur:17px;--p-border:0.46;--p-veil:0.16;--p-sat:140%;--p-flare:radial-gradient(ellipse 105% 85% at 100% 0%,rgba(235,249,255,calc(.32 * var(--p-density))),transparent 72%);--p-wash:linear-gradient(133deg,rgba(188,231,255,calc(.34 * var(--p-density))) 0%,rgba(98,188,249,calc(.24 * var(--p-density))) 52%,rgba(24,104,174,calc(.21 * var(--p-density))) 100%);}
    .surface-frost{--p-main:242,252,255;--p-mid:170,226,252;--p-deep:94,175,216;--p-shine:255,255,255;--p-accent:187,241,255;--p-edge:240,253,255;--p-radius:16px;--p-blur:25px;--p-border:0.5;--p-veil:0.13;--p-sat:111%;--p-flare:radial-gradient(ellipse 125% 100% at 45% -23%,rgba(255,255,255,calc(.37 * var(--p-density))),transparent 70%);--p-wash:linear-gradient(169deg,rgba(242,252,255,calc(.32 * var(--p-density))) 0%,rgba(170,226,252,calc(.18 * var(--p-density))) 52%,rgba(94,175,216,calc(.17 * var(--p-density))) 100%);}
    .surface-vapor{--p-main:238,247,250;--p-mid:203,227,236;--p-deep:135,178,200;--p-shine:255,255,255;--p-accent:195,226,239;--p-edge:247,253,255;--p-radius:23px;--p-blur:31px;--p-border:0.27;--p-veil:0.11;--p-sat:105%;--p-flare:radial-gradient(ellipse 110% 130% at 2% -17%,rgba(242,252,255,calc(.24 * var(--p-density))),transparent 72%);--p-wash:linear-gradient(170deg,rgba(238,247,250,calc(.23 * var(--p-density))) 0%,rgba(203,227,236,calc(.13 * var(--p-density))) 52%,rgba(135,178,200,calc(.12 * var(--p-density))) 100%);}
    .surface-ocean{--p-main:186,252,241;--p-mid:101,226,219;--p-deep:22,131,158;--p-shine:233,255,252;--p-accent:84,228,213;--p-edge:211,255,246;--p-radius:17px;--p-blur:21px;--p-border:0.47;--p-veil:0.16;--p-sat:123%;--p-flare:radial-gradient(ellipse 100% 100% at 0% -5%,rgba(233,255,252,calc(.33 * var(--p-density))),transparent 72%);--p-wash:linear-gradient(137deg,rgba(186,252,241,calc(.32 * var(--p-density))) 0%,rgba(101,226,219,calc(.21 * var(--p-density))) 52%,rgba(22,131,158,calc(.23 * var(--p-density))) 100%);}
    .surface-aurora{--p-main:229,209,254;--p-mid:162,216,254;--p-deep:73,135,201;--p-shine:254,241,255;--p-accent:181,164,255;--p-edge:241,231,255;--p-radius:22px;--p-blur:21px;--p-border:0.45;--p-veil:0.15;--p-sat:132%;--p-flare:radial-gradient(ellipse 95% 95% at 93% 0%,rgba(225,183,251,calc(.25 * var(--p-density))),transparent 74%),radial-gradient(ellipse 110% 110% at 0% 100%,rgba(105,230,223,calc(.15 * var(--p-density))),transparent 74%);--p-wash:linear-gradient(121deg,rgba(229,209,254,calc(.31 * var(--p-density))) 0%,rgba(162,216,254,calc(.26 * var(--p-density))) 52%,rgba(73,135,201,calc(.20 * var(--p-density))) 100%);}
    .surface-sunrise{--p-main:255,240,217;--p-mid:255,196,156;--p-deep:202,139,150;--p-shine:255,250,226;--p-accent:255,204,136;--p-edge:255,236,207;--p-radius:19px;--p-blur:17px;--p-border:0.45;--p-veil:0.13;--p-sat:117%;--p-flare:radial-gradient(ellipse 100% 105% at 100% 80%,rgba(255,211,140,calc(.26 * var(--p-density))),transparent 71%);--p-wash:linear-gradient(39deg,rgba(255,240,217,calc(.29 * var(--p-density))) 0%,rgba(255,196,156,calc(.23 * var(--p-density))) 52%,rgba(202,139,150,calc(.19 * var(--p-density))) 100%);}
    .surface-rose{--p-main:255,225,239;--p-mid:243,194,227;--p-deep:171,116,192;--p-shine:255,242,249;--p-accent:249,177,217;--p-edge:255,231,245;--p-radius:21px;--p-blur:20px;--p-border:0.47;--p-veil:0.15;--p-sat:121%;--p-flare:radial-gradient(ellipse 125% 100% at 7% 0%,rgba(255,217,235,calc(.29 * var(--p-density))),transparent 70%);--p-wash:linear-gradient(158deg,rgba(255,225,239,calc(.33 * var(--p-density))) 0%,rgba(243,194,227,calc(.23 * var(--p-density))) 52%,rgba(171,116,192,calc(.20 * var(--p-density))) 100%);}
    .surface-mint{--p-main:229,254,238;--p-mid:157,236,204;--p-deep:75,151,142;--p-shine:249,255,249;--p-accent:152,233,191;--p-edge:232,255,238;--p-radius:19px;--p-blur:23px;--p-border:0.43;--p-veil:0.15;--p-sat:114%;--p-flare:radial-gradient(ellipse 115% 130% at 90% -20%,rgba(231,255,241,calc(.31 * var(--p-density))),transparent 72%);--p-wash:linear-gradient(119deg,rgba(229,254,238,calc(.31 * var(--p-density))) 0%,rgba(157,236,204,calc(.21 * var(--p-density))) 52%,rgba(75,151,142,calc(.20 * var(--p-density))) 100%);}
    .surface-solstice{--p-main:255,218,201;--p-mid:250,173,196;--p-deep:146,145,229;--p-shine:255,242,220;--p-accent:255,183,159;--p-edge:255,231,216;--p-radius:21px;--p-blur:19px;--p-border:0.44;--p-veil:0.16;--p-sat:134%;--p-flare:radial-gradient(ellipse 95% 90% at 98% 2%,rgba(255,237,179,calc(.33 * var(--p-density))),transparent 69%),radial-gradient(ellipse 105% 110% at -10% 110%,rgba(176,166,253,calc(.18 * var(--p-density))),transparent 68%);--p-wash:linear-gradient(58deg,rgba(255,218,201,calc(.31 * var(--p-density))) 0%,rgba(250,173,196,calc(.25 * var(--p-density))) 52%,rgba(146,145,229,calc(.21 * var(--p-density))) 100%);}
    .surface-pearl{--p-main:255,252,245;--p-mid:234,234,244;--p-deep:154,176,187;--p-shine:255,255,255;--p-accent:237,220,186;--p-edge:255,252,238;--p-radius:18px;--p-blur:24px;--p-border:0.53;--p-veil:0.17;--p-sat:111%;--p-flare:radial-gradient(ellipse 130% 140% at 80% -35%,rgba(255,254,246,calc(.38 * var(--p-density))),transparent 72%);--p-wash:linear-gradient(135deg,rgba(255,252,245,calc(.36 * var(--p-density))) 0%,rgba(234,234,244,calc(.23 * var(--p-density))) 52%,rgba(154,176,187,calc(.18 * var(--p-density))) 100%);}
    .surface-titanium{--p-main:230,239,249;--p-mid:165,194,221;--p-deep:69,114,149;--p-shine:249,254,255;--p-accent:206,225,244;--p-edge:235,245,253;--p-radius:12px;--p-blur:11px;--p-border:0.52;--p-veil:0.18;--p-sat:105%;--p-flare:linear-gradient(175deg,rgba(255,255,255,calc(.24 * var(--p-density))) 0%,transparent 29%,rgba(220,245,255,calc(.06 * var(--p-density))) 30%,transparent 37%);--p-wash:linear-gradient(168deg,rgba(230,239,249,calc(.28 * var(--p-density))) 0%,rgba(69,114,149,calc(.21 * var(--p-density))) 31%,rgba(165,194,221,calc(.31 * var(--p-density))) 32%,rgba(69,114,149,calc(.26 * var(--p-density))) 67%,rgba(230,239,249,calc(.22 * var(--p-density))) 100%);}
    .surface-ceramic{--p-main:251,250,248;--p-mid:234,241,242;--p-deep:165,190,197;--p-shine:255,255,255;--p-accent:225,234,227;--p-edge:255,255,251;--p-radius:14px;--p-blur:12px;--p-border:0.5;--p-veil:0.23;--p-sat:100%;--p-flare:radial-gradient(ellipse 145% 100% at 50% -10%,rgba(255,255,255,calc(.35 * var(--p-density))),transparent 83%);--p-wash:linear-gradient(174deg,rgba(251,250,248,calc(.48 * var(--p-density))) 0%,rgba(234,241,242,calc(.30 * var(--p-density))) 65%,rgba(165,190,197,calc(.13 * var(--p-density))) 100%);}
    .surface-graphite{--p-main:120,147,166;--p-mid:64,90,112;--p-deep:16,38,58;--p-shine:230,244,255;--p-accent:160,190,212;--p-edge:193,217,229;--p-radius:13px;--p-blur:13px;--p-border:0.31;--p-veil:0.35;--p-sat:106%;--p-flare:linear-gradient(175deg,rgba(210,234,248,calc(.11 * var(--p-density))),transparent 47%);--p-wash:linear-gradient(145deg,rgba(120,147,166,calc(.24 * var(--p-density))) 0%,rgba(64,90,112,calc(.27 * var(--p-density))) 51%,rgba(16,38,58,calc(.38 * var(--p-density))) 100%);}
    .surface-ink{--p-main:134,148,203;--p-mid:70,95,160;--p-deep:19,36,93;--p-shine:231,239,255;--p-accent:170,188,255;--p-edge:189,210,249;--p-radius:11px;--p-blur:14px;--p-border:0.36;--p-veil:0.34;--p-sat:118%;--p-flare:radial-gradient(ellipse 100% 100% at 100% 0%,rgba(139,160,255,calc(.23 * var(--p-density))),transparent 71%);--p-wash:linear-gradient(145deg,rgba(134,148,203,calc(.25 * var(--p-density))) 0%,rgba(70,95,160,calc(.27 * var(--p-density))) 51%,rgba(19,36,93,calc(.42 * var(--p-density))) 100%);}
    .surface-neon{--p-main:187,244,255;--p-mid:112,201,240;--p-deep:47,115,181;--p-shine:250,255,255;--p-accent:119,237,255;--p-edge:146,235,255;--p-radius:13px;--p-blur:12px;--p-border:0.62;--p-veil:0.14;--p-sat:128%;--p-flare:linear-gradient(182deg,rgba(223,254,255,calc(.13 * var(--p-density))),transparent 55%);--p-wash:linear-gradient(140deg,rgba(187,244,255,calc(.23 * var(--p-density))) 0%,rgba(112,201,240,calc(.15 * var(--p-density))) 52%,rgba(47,115,181,calc(.14 * var(--p-density))) 100%);}
    .surface-liquid{--p-main:235,247,255;--p-mid:154,214,249;--p-deep:65,142,182;--p-shine:255,255,255;--p-accent:174,233,255;--p-edge:251,255,255;--p-radius:25px;--p-blur:22px;--p-border:0.58;--p-veil:0.13;--p-sat:133%;--p-flare:radial-gradient(ellipse 98% 90% at 102% -17%,rgba(255,255,255,calc(.42 * var(--p-density))),transparent 65%),radial-gradient(ellipse 120% 140% at -22% 115%,rgba(124,209,255,calc(.19 * var(--p-density))),transparent 77%);--p-wash:linear-gradient(141deg,rgba(235,247,255,calc(.24 * var(--p-density))) 0%,rgba(154,214,249,calc(.17 * var(--p-density))) 52%,rgba(65,142,182,calc(.17 * var(--p-density))) 100%);}
    .surface-hologram{--p-main:252,224,244;--p-mid:180,227,255;--p-deep:111,165,205;--p-shine:255,249,255;--p-accent:194,176,255;--p-edge:250,235,255;--p-radius:20px;--p-blur:20px;--p-border:0.51;--p-veil:0.14;--p-sat:131%;--p-flare:conic-gradient(from 215deg at 84% 2%,rgba(179,236,255,calc(.09 * var(--p-density))),rgba(239,195,255,calc(.25 * var(--p-density))),rgba(255,223,186,calc(.10 * var(--p-density))),rgba(173,252,233,calc(.15 * var(--p-density))),rgba(179,236,255,calc(.09 * var(--p-density))));--p-wash:linear-gradient(127deg,rgba(252,224,244,calc(.28 * var(--p-density))) 0%,rgba(180,227,255,calc(.19 * var(--p-density))) 52%,rgba(111,165,205,calc(.19 * var(--p-density))) 100%);}
    .surface-prism{--p-main:233,242,255;--p-mid:170,219,248;--p-deep:76,134,188;--p-shine:255,255,255;--p-accent:182,244,248;--p-edge:252,246,255;--p-radius:16px;--p-blur:15px;--p-border:0.58;--p-veil:0.12;--p-sat:129%;--p-flare:linear-gradient(111deg,rgba(255,235,246,calc(.08 * var(--p-density))),transparent 32%,rgba(188,237,255,calc(.17 * var(--p-density))) 62%,transparent);--p-wash:linear-gradient(146deg,rgba(233,242,255,calc(.22 * var(--p-density))) 0%,rgba(170,219,248,calc(.18 * var(--p-density))) 52%,rgba(76,134,188,calc(.16 * var(--p-density))) 100%);}
    .surface-editorial{--p-main:220,235,245;--p-mid:164,193,215;--p-deep:72,118,158;--p-shine:251,254,255;--p-accent:198,227,245;--p-edge:228,243,255;--p-radius:8px;--p-blur:10px;--p-border:0.26;--p-veil:0.22;--p-sat:110%;--p-flare:linear-gradient(93deg,rgba(220,243,255,calc(.16 * var(--p-density))),transparent 39%);--p-wash:linear-gradient(180deg,rgba(220,235,245,calc(.15 * var(--p-density))) 0%,rgba(164,193,215,calc(.13 * var(--p-density))) 52%,rgba(72,118,158,calc(.12 * var(--p-density))) 100%);}
    .surface-premium:not(.is-high-contrast) .shade{
       background:linear-gradient(112deg,rgba(5,21,39,.35),rgba(6,28,51,.11) 68%,rgba(4,26,46,.075)),
                  linear-gradient(0deg,rgba(6,25,47,.35),transparent 73%);}
    .surface-premium:not(.is-high-contrast) .eyebrow,
    .surface-premium:not(.is-high-contrast) .title,
    .surface-premium:not(.is-high-contrast) .temperature{text-shadow:0 2px 8px rgba(1,12,30,.54);}
    .surface-premium:not(.is-high-contrast) .tile{
       border:1px solid rgba(var(--p-edge),var(--p-border));
       border-radius:var(--p-radius);
       background:var(--p-flare),var(--p-wash),linear-gradient(180deg,rgba(6,24,44,.085),rgba(5,22,43,var(--p-veil)));
       box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 5px 15px rgba(2,19,37,.105);
       -webkit-backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));
       backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));}
    .surface-premium:not(.is-high-contrast) .tile:before{
       background:linear-gradient(177deg,rgba(255,255,255,.13),transparent 39%);
       opacity:.67;}
    .surface-premium:not(.is-high-contrast) .tile:after{display:none;}
    .surface-premium:not(.is-high-contrast) .forecast-shell{
       border-color:rgba(var(--p-edge),calc(var(--p-border) * .87));
       background:var(--p-wash),linear-gradient(180deg,rgba(5,22,43,.115),rgba(5,23,44,.22));
       box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 5px 16px rgba(2,19,36,.10);
       -webkit-backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));
       backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));}
    .surface-premium:not(.is-high-contrast) .forecast-row{
       border-color:rgba(var(--p-edge),calc(var(--p-border) * .84));
       border-radius:calc(var(--p-radius) - 3px);
       background:var(--p-flare),var(--p-wash),linear-gradient(180deg,rgba(6,23,43,.075),rgba(5,21,40,.17));
       box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 3px 9px rgba(3,15,37,.08);
       -webkit-backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));
       backdrop-filter:blur(var(--p-blur)) saturate(var(--p-sat));}
    .surface-premium:not(.is-high-contrast) .tabs{
       border-color:rgba(248,253,255,.34);background:rgba(9,33,57,.27);
       -webkit-backdrop-filter:blur(13px);backdrop-filter:blur(13px);}
    .surface-premium:not(.is-high-contrast) .tab[aria-selected=true]{
       background:linear-gradient(143deg,rgba(var(--p-accent),.68),rgba(var(--p-deep),.73));
       box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 2px 8px rgba(3,17,35,.13);}
    .surface-premium .tile .key,.surface-premium .tile .value,
    .surface-premium .section-title,.surface-premium .forecast-row{
       text-shadow:0 1px 5px rgba(0,12,28,.42);}
    @media(hover:hover) and (pointer:fine){
      .surface-premium:not(.is-high-contrast) .tile:hover,
      .surface-premium:not(.is-high-contrast) .forecast-row:hover{
        transform:translateY(-1px);filter:brightness(1.04);
        border-color:rgba(var(--p-edge),.72);
        box-shadow:inset 0 1px rgba(255,255,255,.4),0 9px 19px rgba(4,20,42,.14);}}
    /* The next rules alter MATERIAL AND GEOMETRY, not just its hue. */
    .surface-crystal .tile,.surface-crystal .forecast-row{outline:1px solid rgba(255,255,255,.055);outline-offset:-3px;}
    .surface-frost:not(.is-high-contrast) .tile{
       box-shadow:inset 0 2px 1px rgba(248,255,255,.38),inset 0 -1px rgba(255,255,255,.13),0 4px 17px rgba(24,83,130,.10);}
    .surface-vapor:not(.is-high-contrast) .tile,.surface-vapor:not(.is-high-contrast) .forecast-row{
       box-shadow:0 7px 24px rgba(5,32,64,.07);border-color:rgba(247,252,255,.28);}
    .surface-aurora:not(.is-high-contrast) .tile:before{
       background:radial-gradient(ellipse 115% 110% at 0% 100%,rgba(98,249,231,.16),transparent 66%);
       opacity:1;}
    .surface-sunrise:not(.is-high-contrast) .tile:before{
       background:radial-gradient(ellipse 110% 85% at 100% 0%,rgba(255,245,220,.24),transparent 67%);
       opacity:1;}
    .surface-solstice:not(.is-high-contrast) .tile:before{
       background:linear-gradient(132deg,rgba(255,254,238,.18),transparent 46%,rgba(191,161,255,.12));opacity:1;}
    .surface-pearl:not(.is-high-contrast) .tile{
       box-shadow:inset 0 1px rgba(255,255,255,.59),inset 0 -1px rgba(255,251,223,.10),0 5px 17px rgba(27,38,57,.075);}
    .surface-titanium:not(.is-high-contrast) .tile:before{
       background:repeating-linear-gradient(180deg,rgba(255,255,255,.05) 0px,rgba(255,255,255,.05) 1px,transparent 1px,transparent 4px);opacity:.7;}
    .surface-ceramic:not(.is-high-contrast) .tile,.surface-ceramic:not(.is-high-contrast) .forecast-row{
       box-shadow:inset 0 1px rgba(255,255,255,.42),0 8px 19px rgba(18,31,44,.10);}
    .surface-graphite:not(.is-high-contrast) .tile,.surface-graphite:not(.is-high-contrast) .forecast-row{
       border-color:rgba(217,231,238,.26);box-shadow:inset 0 1px rgba(239,250,255,.18);}
    .surface-ink:not(.is-high-contrast) .tile,.surface-ink:not(.is-high-contrast) .forecast-row{
       border-color:rgba(192,211,252,.30);box-shadow:inset 2px 0 rgba(198,207,255,.18),0 6px 14px rgba(2,9,38,.12);}
    .surface-neon:not(.is-high-contrast) .tile,.surface-neon:not(.is-high-contrast) .forecast-row{
       border-color:rgba(158,243,255,.69);box-shadow:inset 0 1px rgba(255,255,255,.32),0 0 0 1px rgba(72,211,247,.055);}
    .surface-liquid:not(.is-high-contrast) .tile:before{
       background:radial-gradient(ellipse 140% 85% at 50% -34%,rgba(255,255,255,.29),transparent 70%),
                  linear-gradient(160deg,rgba(255,255,255,.13),transparent 42%);opacity:1;}
    .surface-liquid:not(.is-high-contrast) .tile:after{
       display:block;top:auto;bottom:-57px;left:-30px;right:auto;width:190px;height:88px;
       background:radial-gradient(ellipse,rgba(186,234,255,.11),transparent 70%);}
    .surface-hologram:not(.is-high-contrast) .tile:before{
       background:linear-gradient(112deg,rgba(255,240,252,.14),transparent 28%,rgba(178,255,245,.10) 68%,transparent);opacity:1;}
    .surface-prism:not(.is-high-contrast) .tile{
       border-color:rgba(217,248,255,.62);
       box-shadow:inset 1px 1px rgba(255,241,248,.23),inset -1px -1px rgba(175,250,243,.17),0 4px 13px rgba(3,20,42,.09);}
    .surface-prism:not(.is-high-contrast) .tile:before{
       background:linear-gradient(120deg,rgba(255,222,241,.16),transparent 38%,rgba(164,242,255,.13) 75%,transparent);opacity:1;}
    .surface-editorial:not(.is-high-contrast) .tile,.surface-editorial:not(.is-high-contrast) .forecast-row{
       border-color:rgba(224,245,255,.20);border-left:2px solid rgba(220,244,255,.79);
       box-shadow:none;}
    .surface-editorial:not(.is-high-contrast) .tile:before{display:none;}
    /* High-contrast is explicit, safe, and independent of selected material. */
    .surface-premium.is-high-contrast .tile,
    .surface-premium.is-high-contrast .forecast-row{
       background:linear-gradient(145deg,rgba(16,62,106,.94),rgba(2,21,53,.97));
       border-color:rgba(235,248,255,.72);
       -webkit-backdrop-filter:none;backdrop-filter:none;}
    .surface-premium.is-high-contrast .forecast-shell{
       background:rgba(3,19,48,.93);-webkit-backdrop-filter:none;backdrop-filter:none;}
    @media(prefers-reduced-transparency:reduce){
      .surface-premium:not(.is-high-contrast) .tile,
      .surface-premium:not(.is-high-contrast) .forecast-row{
        background:linear-gradient(135deg,rgba(28,79,121,.94),rgba(7,32,64,.97));
        -webkit-backdrop-filter:none;backdrop-filter:none;}}
    .when{white-space:nowrap;font-size:10px;color:#d8e9f8;}.forecast-symbol{height:37px;width:43px;display:block;}
    .weather-icon{width:100%;height:100%;display:block;}
    .forecast-temp{font-size:15px;font-weight:780}.forecast-min{font-size:11px;color:#bdd7ef}.pop{font-size:10px;color:#a7e6ff;margin-top:1px}
    .bottom{margin-top:14px;font-size:10px;color:var(--vnh-muted);flex-wrap:wrap;
      border-top:1px solid rgba(245,252,255,.22);padding-top:11px;}
    .source{display:inline-flex;gap:7px;align-items:center}.dot{display:inline-block;width:7px;height:7px;background:#75f7bd;border-radius:50%;}
    .stale .dot{background:#ffcd6b}.attribution{font-size:9px;color:var(--vnh-muted);margin-top:9px;opacity:.89}
    .notice{font-size:12px;background:rgba(255,198,84,.19);border:1px solid rgba(255,224,142,.5);padding:9px 11px;border-radius:10px;margin-top:10px}
    .empty{color:#f2f9ff;font-size:13px;padding:18px 0;line-height:1.6}.compact .main{padding:18px}
    .compact .hero{margin:8px 0 12px;min-height:100px}
    .compact.has-date .hero{margin-top:5px}.compact .temperature{font-size:54px}.compact .symbol{max-width:120px}
    .compact .sun-track{display:none}.compact .tile{min-height:59px;padding:9px}.compact .value{font-size:13px}
    .compact .metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
    @keyframes iconfloat{50%{transform:translateY(-5px)}}
    @keyframes drop{from{transform:translate3d(0,-100px,0)}to{transform:translate3d(-40px,1000px,0)}}
    @keyframes snowfall{from{transform:translate3d(0,-40px,0)}to{transform:translate3d(35px,980px,0)}}
    @keyframes windline{from{transform:translate3d(-220px,0,0)}to{transform:translate3d(650px,0,0)}}
    @keyframes drift{from{transform:translate3d(-150px,0,0)}to{transform:translate3d(690px,0,0)}}
    @keyframes flash{0%,96%,100%{opacity:0}97%{opacity:.35}98%{opacity:0}98.7%{opacity:.18}}
    @media(max-width:390px){.main{padding:18px 14px 15px}.temperature{font-size:58px}.hero{min-height:132px}.metrics{gap:6px}
      .tile{padding:10px 8px;min-height:65px}.value{font-size:12px}.key{font-size:10px}.forecast-row{min-width:72px}
      .forecast-shell{padding:12px 8px}.sun-track{gap:9px}.date-line{font-size:11px}}
    @media(max-width:320px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.symbol{width:98px}.temperature{font-size:49px}}
    @media(prefers-reduced-motion:reduce){.weather-effects,.symbol .weather-icon{animation:none!important}.weather-effects .particle{animation:none!important;display:none!important}
      .tile,.forecast-row{transition:none!important}}
  `;

  const DEFAULTS = Object.freeze({mode:'detailed',forecast_type:'daily',forecast_slots:7,show_forecast:true,show_source:true,
    show_date:false,
    theme:'auto',effects:'subtle',background_transparency:8,glass_transparency:52,contrast:'auto',auto_day_night:true,language:'auto',
    background_style:'photos',background_image_ext:'webp',background_base_url:DEFAULT_PHOTO_BASE,panel_style:'crystal'});

  class VNWeatherHACard extends HTMLElement {
    constructor(){
      super(); this.attachShadow({mode:'open'});
      this._config={...DEFAULTS};this._mode='detailed';this._tab='daily';this._hass=null;
      this._forecasts={hourly:[],daily:[]};this._unsub=[];this._subscriptionKey='';this._subscriptionEpoch=0;
      this._ticker=null;this._observer=null;this._inViewport=true;
      this.shadowRoot.addEventListener('click',e=>this._click(e));
      for(const type of ['pointerdown','mousedown']) this.shadowRoot.addEventListener(type,e=>{
        if(e.target.closest?.('button[data-action]')) e.stopPropagation();
      });
      this.shadowRoot.addEventListener('keydown',e=>{
        if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-action="more"]')){e.preventDefault();this._moreInfo();}
      });
    }
    static getConfigElement(){return document.createElement(EDITOR);}
    static getStubConfig(hass){return {entity:Object.keys(hass?.states||{}).find(x=>x.startsWith('weather.'))||'',...DEFAULTS};}
    setConfig(value){
      if(!value||typeof value!=='object') throw new Error('VN Weather HA: card configuration is required');
      const cfg={...DEFAULTS,...value};
      if(!['compact','detailed'].includes(cfg.mode)) throw new Error('mode must be compact or detailed');
      if(!['hourly','daily'].includes(cfg.forecast_type)) throw new Error('forecast_type must be hourly or daily');
      if(!['auto',...Object.keys(THEMES)].includes(cfg.theme)) throw new Error('Invalid weather theme');
      if(!['off','subtle','full'].includes(cfg.effects)) throw new Error('Invalid animation mode');
      if(!['auto','high'].includes(cfg.contrast)) throw new Error('Invalid contrast mode');
      if(!['photos','vector'].includes(cfg.background_style)) throw new Error('Invalid background style');
      if(!Object.prototype.hasOwnProperty.call(PANEL_STYLES,cfg.panel_style)) throw new Error('Invalid glass panel style');
      if(!['webp','jpg','png','avif'].includes(cfg.background_image_ext)) throw new Error('Invalid background image format');
      cfg.forecast_slots=clamp(cfg.forecast_slots,3,8);
      cfg.background_transparency=clamp(cfg.background_transparency,0,100);
      cfg.glass_transparency=clamp(cfg.glass_transparency,0,100);
      const old=this._config.entity;this._config=cfg;this._mode=cfg.mode;this._tab=cfg.forecast_type;
      if(old!==cfg.entity) this._changeSubscription(true);
      this._render();
    }
    set hass(value){const old=this._hass?.connection;this._hass=value;this._changeSubscription(old!==value?.connection);this._render();}
    connectedCallback(){this._changeSubscription(false);this._render();
      if(typeof setInterval==='function'&&!this._ticker) this._ticker=setInterval(()=>this._checkTimeTransition(),60000);
      if(typeof IntersectionObserver!=='undefined'&&!this._observer){
        this._observer=new IntersectionObserver(entries=>{this._inViewport=entries[0]?.isIntersecting??true;this._setPause();},{threshold:0});
        this._observer.observe(this);
      }
      if(typeof document!=='undefined' && document.addEventListener) document.addEventListener('visibilitychange',this._visibilityHandler ||= ()=>this._setPause());
    }
    disconnectedCallback(){this._unsubscribe();if(this._ticker){clearInterval(this._ticker);this._ticker=null;}
      this._observer?.disconnect();this._observer=null;
      if(typeof document!=='undefined'&&document.removeEventListener&&this._visibilityHandler) document.removeEventListener('visibilitychange',this._visibilityHandler);
    }
    getCardSize(){return this._mode==='compact'?3:8;}
    _unsubscribe(){this._subscriptionEpoch++;this._subscriptionKey='';for(const fn of this._unsub.splice(0)){try{fn();}catch(_e){/* HA disconnect */}}}
    _changeSubscription(force){
      if(!this.isConnected||!this._hass?.connection?.subscribeMessage||!this._config.entity)return;
      const conn=this._hass.connection,key=this._config.entity;
      if(!force&&this._subscriptionKey===key&&this._subConnection===conn)return;
      this._unsubscribe();this._subConnection=conn;this._subscriptionKey=key;this._forecasts={hourly:[],daily:[]};
      const epoch=this._subscriptionEpoch;
      for(const forecastType of ['hourly','daily']){
        Promise.resolve().then(()=>conn.subscribeMessage(event=>{
          if(epoch!==this._subscriptionEpoch||!this.isConnected)return;
          if(Array.isArray(event?.forecast)){this._forecasts[forecastType]=event.forecast;this._render();}
        },{type:'weather/subscribe_forecast',entity_id:key,forecast_type:forecastType}))
          .then(unsub=>{if(epoch!==this._subscriptionEpoch||!this.isConnected){if(typeof unsub==='function')unsub();}
            else if(typeof unsub==='function')this._unsub.push(unsub);})
          .catch(err=>{if(epoch===this._subscriptionEpoch) console.debug('VN Weather HA forecast unavailable',forecastType,err);});
      }
    }
    _click(event){
      const button=event.target.closest('button[data-action]');
      if(button){event.stopPropagation?.();event.preventDefault?.();const action=button.dataset.action;
        if(action==='mode')this._mode=this._mode==='detailed'?'compact':'detailed';
        if(action==='hourly'||action==='daily')this._tab=action;
        this._render();return;}
      if(event.target.closest('[data-action="more"]'))this._moreInfo();
    }
    _moreInfo(){if(this._config.entity)this.dispatchEvent(new CustomEvent('hass-more-info',
      {detail:{entityId:this._config.entity},bubbles:true,composed:true}));}
    _tr(){const lang=this._config.language&&this._config.language!=='auto'?this._config.language:(this._hass?.language||'vi').split('-')[0];
      return {code:lang==='vi'?'vi':'en',t:I18N[lang==='vi'?'vi':'en']};}
    _phase(attrs,weather,tz,now=Date.now()){
      if(this._config.auto_day_night===false) return weather==='clear-night'?'night':'day';
      const sunrise=Date.parse(attrs.sunrise||''), sunset=Date.parse(attrs.sunset||'');
      if(Number.isFinite(sunrise)&&Number.isFinite(sunset)&&sunset>sunrise&&Math.abs(now-sunrise)<36*3600000){
        if(Math.abs(now-sunrise)<=35*60000)return 'dawn';
        if(Math.abs(now-sunset)<=35*60000)return 'dusk';
        return now>sunrise&&now<sunset?'day':'night';
      }
      const sun=this._hass?.states?.['sun.sun']?.state;
      if(sun==='below_horizon')return 'night';
      if(sun==='above_horizon')return 'day';
      if(weather==='clear-night')return 'night';
      try {const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:tz}).format(now));
        return hour>=6&&hour<18?'day':'night';}
      catch(_e){return new Date(now).getHours()>=6&&new Date(now).getHours()<18?'day':'night';}
    }
    _weatherKind(weather,attrs){
      if(['lightning','lightning-rainy'].includes(weather))return 'storm';
      if(['rainy','pouring','snowy-rainy'].includes(weather))return 'rain';
      if(['snowy','hail'].includes(weather))return 'snow';
      if(weather==='fog')return 'fog';
      if(['windy','windy-variant'].includes(weather)||num(attrs.wind_speed)&&attrs.wind_speed>=32)return 'wind';
      if(['cloudy','partlycloudy'].includes(weather))return 'cloud';
      if(weather==='sunny'||weather==='clear-night')return 'sun';
      return 'neutral';
    }
    _theme(phase,kind,weather){
      if(this._config.theme!=='auto')return this._config.theme;
      if(kind==='storm'||kind==='rain')return 'ocean';
      if(kind==='fog'||kind==='snow')return 'mist';
      if(kind==='wind')return 'sky';
      if(phase==='dusk')return 'sunset';
      if(phase==='dawn')return 'scenic';
      if(phase==='night')return weather==='clear-night'?'aurora':'twilight';
      if(weather==='sunny')return 'sky';
      return 'scenic';
    }
    _photoUrl(theme,phase='day'){
      const stem=PHOTO_STEMS[theme]||PHOTO_STEMS.scenic;
      const index=PHOTO_INDEX[theme]||PHOTO_INDEX.scenic;
      const imagePhase=phase==='night'?'night':(['dawn','dusk'].includes(phase)?'sunset':'day');
      const offset=imagePhase==='night'?14:imagePhase==='sunset'?7:0;
      const prefix=String(index+offset).padStart(2,'0');
      return `${photoBase(this._config.background_base_url)}/${prefix}-${stem.slice(3)}-${imagePhase}.${this._config.background_image_ext}`;
    }
    _metric(label,kind,value,percent=null){
      if(value===null||value===undefined||value==='—')return '';
      return `<div class="tile"><div class="key"><span class="metric-icon">${metricIcon(kind)}</span><span>${escapeHtml(label)}</span></div>
        <div class="value">${escapeHtml(value)}</div>${percent===null?'':`<div class="meter" aria-hidden="true"><i style="width:${clamp(percent,0,100)}%"></i></div>`}</div>`;
    }
    _forecastMarkup(t,code,tz){
      const rows=this._forecasts[this._tab]||[];const now=Date.now();
      const upcoming=rows.filter(row=>{
        const stamp=new Date(row.datetime).getTime();return Number.isFinite(stamp)&&(this._tab==='daily'||stamp>=now-30*60000);
      }).slice(0,this._config.forecast_slots);
      if(!upcoming.length)return `<div class="empty">${escapeHtml(t.noforecast)}</div>`;
      return `<div class="forecast" role="list" aria-label="${escapeHtml(t.forecast)}">${upcoming.map(row=>{
        const high=metricValue(row.temperature,'°');const low=metricValue(row.templow,'°');
        const pop=metricValue(row.precipitation_probability,'%');
        return `<div class="forecast-row" role="listitem"><span class="when">${escapeHtml(compactDate(row.datetime,tz,code,this._tab))}</span>
          <span class="forecast-symbol">${weatherIcon(row.condition)}</span><span class="forecast-temp">${escapeHtml(high||'—')}</span>
          ${this._tab==='daily'&&low?`<span class="forecast-min">${escapeHtml(low)}</span>`:''}
          ${pop?`<span class="pop">💧 ${escapeHtml(pop)}</span>`:''}</div>`;
      }).join('')}</div>`;
    }
    _weatherParticles(){return Array.from({length:13},(_,i)=>
      `<i class="particle" style="--x:${(i*83+13)%100}%;--y:${(i*29+5)%80}%;--delay:-${(i*.78).toFixed(2)}s;--speed:${(4+i%4)*1.5}s"></i>`).join('');}
    _setPause(){const card=this.shadowRoot.querySelector('ha-card');if(card)card.classList.toggle('paused',!this._inViewport||!!document?.hidden);}
    _checkTimeTransition(){const a=this._hass?.states?.[this._config.entity]?.attributes||{};
      const tz=a.time_zone||this._hass?.config?.time_zone;
      const stage=this._phase(a,this._hass?.states?.[this._config.entity]?.state,tz);
      const nextDate=this._config.show_date===true?headerDate(new Date(),tz,this._tr().code):'';
      if(stage!==this._lastPhase||nextDate!==this._lastDateLabel)this._render();}
    _render(){
      if(!this.shadowRoot)return;
      const {t,code}=this._tr(),s=this._hass?.states?.[this._config.entity],a=s?.attributes||{};
      const tz=a.time_zone||this._hass?.config?.time_zone||undefined,weather=s?.state||'';
      const today=this._config.show_date===true?headerDate(new Date(),tz,code):'';
      this._lastDateLabel=today;
      const present=!!s&&weather!=='unknown'&&weather!=='unavailable';
      const phase=this._phase(a,weather,tz),kind=this._weatherKind(weather,a),theme=this._theme(phase,kind,weather);
      this._lastPhase=phase;
      const compact=this._mode==='compact',unit=unitFrom(s,'temperature_unit','°C');
      const temp=metricValue(a.temperature,unit,1);
      const shownWeather=phase==='night'&&weather==='sunny'?'clear-night':phase==='day'&&weather==='clear-night'?'sunny':weather;
      const conditions=present?`<div class="hero" role="button" data-action="more" tabindex="0" aria-label="${escapeHtml(this._config.name||a.friendly_name||'Weather')} - ${escapeHtml(t.weather)}">
        <div class="current"><div class="temperature">${escapeHtml(temp||'—')}</div>
        <div class="description">${escapeHtml(t.condition[weather]||weather.replaceAll('-',' ')||'—')}</div>
        <div class="subtext">${escapeHtml(t.feels)}: ${escapeHtml(metricValue(a.apparent_temperature,unit,1)||'—')}</div>
        <div class="sun-track">${a.sunrise?`<span>☀ ${escapeHtml(t.sunup)} <b>${escapeHtml(compactDate(a.sunrise,tz,code,'clock'))}</b></span>`:''}
          ${a.sunset?`<span>◕ ${escapeHtml(t.sundown)} <b>${escapeHtml(compactDate(a.sunset,tz,code,'clock'))}</b></span>`:''}</div></div>
        <div class="symbol">${weatherIcon(shownWeather,true,phase==='night')}</div></div>`:
        `<div class="empty">${escapeHtml(this._config.entity?t.empty:t.choose)}</div>`;
      const data=present?[
        [t.humidity,'humidity',metricValue(a.humidity,'%'),a.humidity],[t.wind,'wind',metricValue(a.wind_speed,unitFrom(s,'wind_speed_unit','km/h'),1)],
        [t.pressure,'pressure',metricValue(a.pressure,unitFrom(s,'pressure_unit','hPa'),1)],
        [t.visibility,'visibility',metricValue(a.visibility,unitFrom(s,'visibility_unit','km'),1)],
        [t.uv,'uv',metricValue(a.uv_index,'',1),num(a.uv_index)?a.uv_index/11*100:null],
        [t.cloud,'cloud',metricValue(a.cloud_coverage,'%'),a.cloud_coverage],
        [t.gust,'gust',metricValue(a.wind_gust_speed,unitFrom(s,'wind_speed_unit','km/h'),1)],
        [t.dew,'dew',metricValue(a.dew_point,unit,1)],
        [t.high,'high',metricValue(a.forecast_high,unit,1)],[t.low,'low',metricValue(a.forecast_low,unit,1)],
        [t.sunup,'sunup',a.sunrise?compactDate(a.sunrise,tz,code,'clock'):null],
        [t.sundown,'sundown',a.sunset?compactDate(a.sunset,tz,code,'clock'):null]
      ].filter(x=>x[2]!==null):[];
      const shown=compact?data.slice(0,3):data;
      const body=conditions+(present?`<div class="metrics">${shown.map(x=>this._metric(...x)).join('')}</div>`:'');
      const notice=a.is_stale?`<div class="notice" role="status">⚠ ${escapeHtml(t.stale)}</div>`:'';
      const source=sourceTitle(a.data_source);
      const footer=this._config.show_source!==false&&present?`<div class="bottom"><span class="source ${a.is_stale?'stale':''}"><span class="dot"></span>
        ${escapeHtml(t.source)}: ${escapeHtml(source)}${a.model?` · ${escapeHtml(a.model)}`:''}</span>
        ${a.last_refresh?`<span>${escapeHtml(t.updated)} ${escapeHtml(compactDate(a.last_refresh,tz,code,'clock'))}</span>`:''}</div>
        <div class="attribution">${a.data_source==='met_norway'?'Weather data: MET Norway':a.data_source==='open_meteo'?'Weather data: Open-Meteo.com (CC BY 4.0)':'Weather data: '+escapeHtml(source)}</div>`:'';
      // Allow lightweight, DOM-less CommonJS smoke checks; actual HA always has querySelector.
      if(typeof this.shadowRoot.querySelector!=='function'){
        this.shadowRoot.innerHTML=`<ha-card><div class="eyebrow">${escapeHtml(t.weather)}</div><div class="title">${escapeHtml(this._config.name||a.friendly_name||this._config.entity||'VN Weather HA')}</div>
          ${today?`<div class="date-line">${CALENDAR_ICON}<span>${escapeHtml(today)}</span></div>`:''}
          ${body}${this._config.show_forecast!==false&&!compact?this._forecastMarkup(t,code,tz):''}${notice}${footer}</ha-card>`;
        return;
      }
      // Keep button/tab DOM elements stable across HA updates to preserve click and touch events.
      if(!this._shellReady){
        this.shadowRoot.innerHTML=`<style>${STYLE}</style><ha-card aria-label="VN Weather HA">
          <div class="scene"><div class="scene-vector"></div><img class="scene-photo" alt="" aria-hidden="true" decoding="async" loading="lazy" /></div><div class="shade"></div><div class="weather-tint"></div><div class="weather-effects">${this._weatherParticles()}</div>
          <div class="main"><header class="head"><div class="head-copy"><div class="eyebrow"></div><div class="title"></div><div class="date-line" hidden>${CALENDAR_ICON}<span class="date-text"></span></div></div>
          <button class="mode" type="button" data-action="mode"></button></header>
          <div class="conditions"></div><div class="forecast-shell"><div class="line"></div><section aria-label="Forecast">
          <div class="section-bar"><span class="section-title"></span><div class="tabs" role="tablist">
          <button class="tab" type="button" role="tab" data-action="hourly"></button>
          <button class="tab" type="button" role="tab" data-action="daily"></button></div></div>
          <div class="forecast-content"></div></section></div><div class="notice-slot"></div><div class="footer-slot"></div>
          </div></ha-card>`;
        const photo=this.shadowRoot.querySelector('.scene-photo');
        photo.addEventListener('load',()=>{if(photo.naturalWidth>0)photo.classList.add('loaded');});
        photo.addEventListener('error',()=>photo.classList.remove('loaded'));
        this._shellReady=true;
      }
      const root=this.shadowRoot,card=root.querySelector('ha-card');
      const hi=this._config.contrast==='high';
      const premium=!ORIGINAL_PANEL_STYLES.includes(this._config.panel_style);
      const classes=`theme-${theme} phase-${phase} weather-${kind} effect-${this._config.effects} surface-${this._config.panel_style} ${premium?'surface-premium ':''}${hi?'is-high-contrast ':''}${compact?'compact ':''}${today?'has-date':''}`.trim();
      if(card.className!==classes)card.className=classes;
      const alpha=String((100-this._config.background_transparency)/100);
      if(card.style.getPropertyValue('--vnh-card-alpha')!==alpha)card.style.setProperty('--vnh-card-alpha',alpha);
      // Normalized at 52%; presets stay bright, glass opacity is independently adjustable.
      const density=String(Math.round((100-this._config.glass_transparency)/48*1000)/1000);
      if(card.style.getPropertyValue('--p-density')!==density)card.style.setProperty('--p-density',density);
      if(this._renderedTheme!==theme){
        root.querySelector('.scene-vector').innerHTML=sceneSvg(theme);
        this._renderedTheme=theme;
      }
      // Keep the vector scene behind the local image as a graceful fallback for missing files.
      // Swapping theme only changes one image URL; no canvas, video, or external image service.
      const photo=root.querySelector('.scene-photo');
      const photoUrl=this._config.background_style==='photos'?this._photoUrl(theme,phase):'';
      if((photo.getAttribute('src')||'')!==photoUrl){
        photo.classList.remove('loaded');
        if(photoUrl){photo.hidden=false;photo.setAttribute('src',photoUrl);}
        else{photo.hidden=true;photo.removeAttribute('src');}
      }
      const setText=(selector,value)=>{const el=root.querySelector(selector);if(el.textContent!==value)el.textContent=value;};
      const setMarkup=(selector,html)=>{const el=root.querySelector(selector);if(el._vnhMarkup!==html){el.innerHTML=html;el._vnhMarkup=html;}};
      setText('.eyebrow',t.weather);
      setText('.title',String(this._config.name||a.friendly_name||this._config.entity||'VN Weather HA'));
      const dateLine=root.querySelector('.date-line');
      dateLine.hidden=!today;
      if(today)setText('.date-text',today);
      const modeButton=root.querySelector('.mode'),modeText=`${compact?t.detailed:t.compact} ⇄`;
      if(modeButton.textContent!==modeText)modeButton.textContent=modeText;
      modeButton.setAttribute('aria-label',compact?t.detailed:t.compact);
      modeButton.setAttribute('aria-pressed',String(compact));
      setMarkup('.conditions',body);
      const forecastAvailable=this._config.show_forecast!==false&&!compact;
      root.querySelector('.forecast-shell').hidden=!forecastAvailable;
      if(forecastAvailable){setText('.section-title',t.forecast);
        for(const f of ['hourly','daily']){const tab=root.querySelector(`.tab[data-action="${f}"]`);
          const lbl=f==='hourly'?t.hourly:t.daily;
          if(tab.textContent!==lbl)tab.textContent=lbl;
          tab.setAttribute('aria-selected',String(this._tab===f));}
        setMarkup('.forecast-content',this._forecastMarkup(t,code,tz));}
      setMarkup('.notice-slot',notice);setMarkup('.footer-slot',footer);
      if(typeof document!=='undefined')this._setPause();
    }
  }

  class VNWeatherHACardEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._config={};this._hass=null;this._rendered=false;
      this._entitiesFingerprint='';this._deferredEntityUpdate=false;
      this.shadowRoot.addEventListener('change',e=>this._onChange(e));
      this.shadowRoot.addEventListener('input',e=>{
        if(e.target?.type==='range')this._updateRangeLabel(e.target);
      });
      this.shadowRoot.addEventListener('focusout',e=>{
        if(e.target?.name==='entity'&&this._deferredEntityUpdate)this._syncWeatherEntities();
      });
    }
    setConfig(config){this._config={...(config||{})};this._ensureForm();this._syncWeatherEntities();this._syncControls();}
    set hass(v){this._hass=v;this._ensureForm();this._syncWeatherEntities();}
    _onChange(event){
      const input=event.target;if(!input?.name)return;
      const value=input.type==='checkbox'?input.checked:
        ['forecast_slots','background_transparency','glass_transparency'].includes(input.name)?Number(input.value):input.value;
      if(this._config[input.name]===value)return;
      this._config={...this._config,[input.name]:value};
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));
    }
    _updateRangeLabel(input){const output=this.shadowRoot.querySelector('[data-output="'+input.name+'"]');
      if(output)output.textContent=`${input.value}%`;}
    _ensureForm(){
      if(this._rendered)return;
      this.shadowRoot.innerHTML=`<style>
        :host{display:block;font-family:var(--primary-font-family,system-ui);color:var(--primary-text-color)}
        .form{display:grid;gap:13px;padding:10px 2px}.group{padding:12px;border:1px solid var(--divider-color,#ddd);border-radius:14px;display:grid;gap:11px}
        .group-title{font-size:13px;font-weight:800;color:var(--primary-text-color)}
        label{display:grid;gap:6px;font-size:13px;font-weight:600}
        select,input:not([type=checkbox]):not([type=range]){box-sizing:border-box;width:100%;min-width:0;border:1px solid var(--divider-color,#ccc);
          border-radius:9px;padding:11px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#111);font:inherit}
        .check{display:flex;gap:10px;align-items:center}.check input{width:18px;height:18px;accent-color:var(--primary-color,#039be5)}
        input[type=range]{width:100%;margin:3px 0 7px;accent-color:var(--primary-color,#039be5)}
        output{float:right;font-variant-numeric:tabular-nums;color:var(--primary-color,#0284c7);font-weight:800}
        .hint{font-size:11px;color:var(--secondary-text-color,#777);line-height:1.5}
      </style><div class="form">
        <div class="group"><div class="group-title">1. Dữ liệu và bố cục</div>
          <label>Weather entity <select name="entity"><option value="">-- Select weather entity --</option></select></label>
          <label>Tên địa điểm <input name="name" placeholder="My Home" /></label>
          <label>Bố cục <select name="mode"><option value="detailed">Chi tiết</option><option value="compact">Thu gọn</option></select></label>
          <label>Kiểu dự báo <select name="forecast_type"><option value="hourly">Theo giờ</option><option value="daily">Theo ngày</option></select></label>
          <label>Số dự báo <select name="forecast_slots">${[3,4,5,6,7,8].map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label>
          <label>Ngôn ngữ <select name="language"><option value="auto">Theo Home Assistant</option><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
          <label class="check"><input name="show_date" type="checkbox" />Hiện thứ, ngày/tháng/năm dưới tên địa điểm</label>
          <label class="check"><input name="show_forecast" type="checkbox" />Hiện dự báo</label>
          <label class="check"><input name="show_source" type="checkbox" />Hiện nguồn dữ liệu / giờ cập nhật</label>
        </div>
        <div class="group"><div class="group-title">2. Chọn trong 7 theme</div>
          <label>Theme <select name="theme"><option value="auto">✨ Tự chọn theo thời tiết và thời gian</option>
            ${Object.entries(THEMES).map(([id,info])=>`<option value="${id}">${info.vi}</option>`).join('')}</select></label>
          <label class="check"><input name="auto_day_night" type="checkbox" />Tự đổi ngày / đêm theo bình minh / hoàng hôn</label>
          <label>Kiểu nền <select name="background_style"><option value="photos">Ảnh phong cảnh (tự fallback nếu thiếu ảnh)</option>
          <option value="vector">Vector tích hợp (nhẹ nhất)</option></select></label>
          <label>Định dạng ảnh <select name="background_image_ext"><option value="webp">WebP — khuyên dùng</option>
          <option value="jpg">JPG / JPEG</option><option value="png">PNG</option><option value="avif">AVIF</option></select></label>
          <label>Đường dẫn thư mục ảnh <input name="background_base_url" placeholder="/vn_weather_ha/backgrounds" /></label>
          <p class="hint">Đã tích hợp sẵn 21 ảnh WebP: 7 theme × 3 thời điểm (ban ngày, bình minh/hoàng hôn, ban đêm).
          Tệp nằm tại frontend/backgrounds. Nếu tự thay ảnh, có thể dùng /config/www/vn-weather-ha-backgrounds và
          nhập /local/vn-weather-ha-backgrounds. Xem danh sách chính xác trong THEME_IMAGES.md.</p>
          <p class="hint">Theme thủ công giữ phong cách đã chọn; ánh sáng và hiệu ứng vẫn đổi theo thời tiết. Theme tự động đổi cả phong cảnh.</p>
        </div>
        <div class="group"><div class="group-title">3. Hiệu ứng và dễ đọc</div>
          <label>Kiểu viền và khối dữ liệu <select name="panel_style">
            ${PANEL_STYLE_GROUPS.map(([group,ids])=>`<optgroup label="${group}">${ids.map(id=>`<option value="${id}">${PANEL_STYLES[id]}</option>`).join('')}</optgroup>`).join('')}
          </select></label>
          <label>Hiệu ứng thời tiết <select name="effects"><option value="off">Tắt — tiết kiệm tài nguyên</option>
          <option value="subtle">Nhẹ — khuyên dùng</option><option value="full">Đầy đủ</option></select></label>
          <label>Độ trong của ô kính <output data-output="glass_transparency">52%</output>
            <input type="range" name="glass_transparency" min="0" max="100" step="1" value="52" /></label>
          <p class="hint">Áp dụng cho 20 mẫu hiện đại: tăng để nhìn rõ ảnh phía sau ô, giảm để chữ dễ đọc hơn.</p>
          <label>Độ trong suốt nền <output data-output="background_transparency">8%</output>
            <input type="range" name="background_transparency" min="0" max="100" step="1" value="8" /></label>
          <label>Tương phản <select name="contrast"><option value="auto">Tự động — dễ đọc trên HA sáng/tối</option>
          <option value="high">Cao — nền ô đậm, chữ trắng</option></select></label>
          <p class="hint">Độ trong suốt nền ảnh độc lập với độ trong ô kính. 0% = nền đặc; 100% = nền trong suốt. Tự dừng hiệu ứng ngoài màn hình hoặc khi hệ thống ưu tiên giảm chuyển động.</p>
        </div>
      </div>`;
      this._rendered=true;this._syncControls();
    }
    _syncControls(){if(!this._rendered||typeof this.shadowRoot.querySelectorAll!=='function')return;const cfg={...DEFAULTS,...this._config,name:'',entity:'',...this._config};
      for(const input of this.shadowRoot.querySelectorAll('[name]')){
        if(input===this.shadowRoot.activeElement)continue;
        const value=cfg[input.name];
        if(input.type==='checkbox'){if(input.checked!==Boolean(value))input.checked=Boolean(value);}
        else if(input.value!==String(value)){input.value=String(value??'');}
        if(input.type==='range')this._updateRangeLabel(input);
      }
    }
    _syncWeatherEntities(){
      if(!this._hass||!this._rendered||typeof this.shadowRoot.querySelector!=='function')return;
      const select=this.shadowRoot.querySelector('select[name="entity"]');if(!select)return;
      const states=this._hass.states||{},records=Object.keys(states).filter(key=>key.startsWith('weather.')).sort()
        .map(key=>[key,states[key]?.attributes?.friendly_name||key]);
      const fingerprint=JSON.stringify([records,this._config.entity||'']);
      if(fingerprint===this._entitiesFingerprint){this._deferredEntityUpdate=false;return;}
      if(this.shadowRoot.activeElement===select){this._deferredEntityUpdate=true;return;}
      const selected=this._config.entity||select.value||'';
      if(selected&&!records.some(([key])=>key===selected))records.push([selected,selected]);
      select.innerHTML='<option value="">-- Select weather entity --</option>'+records.map(([key,name])=>
        `<option value="${escapeHtml(key)}">${escapeHtml(name)} · ${escapeHtml(key)}</option>`).join('');
      select.value=selected;this._entitiesFingerprint=fingerprint;this._deferredEntityUpdate=false;
    }
  }
  if(!customElements.get(TAG))customElements.define(TAG,VNWeatherHACard);
  if(!customElements.get(EDITOR))customElements.define(EDITOR,VNWeatherHACardEditor);
  globalThis.customCards=globalThis.customCards||[];
  if(!globalThis.customCards.some(card=>card.type===TAG))globalThis.customCards.push({
    type:TAG,name:'VN Weather HA · Seven Skies',description:'7 landscape photo themes, offline backgrounds, automatic sunrise/sunset, lightweight effects',
    preview:true,documentationURL:'https://github.com/khaisilk1910/VN-Weather-HA',
    getEntitySuggestion:(_hass,entityId)=>entityId.startsWith('weather.')?{config:{type:`custom:${TAG}`,entity:entityId,mode:'detailed'}}:null,
  });
})();
