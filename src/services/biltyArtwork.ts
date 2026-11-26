// Shared vector artwork for the Warraich Goods Samundri Official Bilty
// Used consistently by both OfficialBiltySheet (React/Print) and pdfGenerator (Canvas A4 PDF).

export const PAKISTAN_FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 58">
  <defs>
    <linearGradient id="pkGreen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d6e35"/>
      <stop offset="55%" stop-color="#0a5428"/>
      <stop offset="100%" stop-color="#063e1c"/>
    </linearGradient>
    <linearGradient id="pkWhite" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <!-- Waving flag body -->
  <path d="M4,8 C26,1 46,16 68,9 C78,6 86,6 92,8 L84,49 C78,47 70,47 60,50 C38,57 18,42 0,49 Z" fill="url(#pkGreen)" stroke="#1e293b" stroke-width="1.4"/>
  <!-- White vertical strip on hoist (right side in photo orientation) -->
  <path d="M68,9 C78,6 86,6 92,8 L84,49 C78,47 70,47 60,50 Z" fill="url(#pkWhite)" stroke="#1e293b" stroke-width="1"/>
  <!-- Crescent -->
  <path d="M44,17 A12,12 0 1,0 48,39 A9.5,9.5 0 1,1 44,17 Z" fill="#ffffff"/>
  <!-- 5-pointed star -->
  <polygon points="50,21 51.6,25.2 56,25.4 52.5,28.1 53.7,32.4 50,30 46.3,32.4 47.5,28.1 44,25.4 48.4,25.2" fill="#ffffff"/>
</svg>`;

export const WHATSAPP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14.5" fill="#16a34a" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M16 5.5C10.2 5.5 5.5 10.2 5.5 16c0 2 .6 3.9 1.6 5.5L5.8 26.5l5.2-1.3c1.5.8 3.2 1.3 5 1.3 5.8 0 10.5-4.7 10.5-10.5S21.8 5.5 16 5.5zm5.4 14.9c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.7-3-1.3-5-4.4-5.1-4.6-.1-.2-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1-2.5.3-.3.6-.3.8-.3h.6c.2 0 .5-.1.7.5.2.6.8 2 .9 2.2.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.3.4-.5.5-.2.2-.4.4-.2.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.8.3.2.5.1.7-.1.2-.2.8-1 1.1-1.3.2-.3.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.7.4.1.2.1.8-.1 1.4z" fill="#ffffff"/>
</svg>`;

/**
 * Detailed grayscale 3/4 front-facing Pakistani Bedford / Mazda Mini Truck watermark
 * matching the physical Warraich Goods Samundri stationery ("LES 6543" plate).
 */
export const TRUCK_WATERMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 430">
  <defs>
    <linearGradient id="cabGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="65%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="chromeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Ground shadow -->
  <ellipse cx="215" cy="402" rx="165" ry="18" fill="#0f172a" opacity="0.55"/>

  <!-- Rear Cargo Body (extending left in 3/4 perspective) -->
  <path d="M52,145 L178,108 L178,318 L48,302 Z" fill="url(#bodyGrad)" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Cargo body decorative top rack & slats -->
  <path d="M48,144 L178,106 L178,125 L48,162 Z" fill="#1e293b"/>
  <g stroke="#cbd5e1" stroke-width="1.5" opacity="0.65">
    <line x1="72" y1="154" x2="70" y2="304"/>
    <line x1="96" y1="147" x2="94" y2="307"/>
    <line x1="120" y1="140" x2="119" y2="311"/>
    <line x1="144" y1="133" x2="144" y2="314"/>
    <line x1="50" y1="205" x2="176" y2="178"/>
    <line x1="49" y1="252" x2="177" y2="232"/>
  </g>
  <!-- Ornamental rear arch / mudguard -->
  <path d="M48,295 Q76,262 104,308 L178,318 L178,334 L48,314 Z" fill="#1e293b"/>
  <!-- Rear dual wheel -->
  <ellipse cx="78" cy="322" rx="22" ry="30" fill="#0f172a"/>
  <ellipse cx="78" cy="322" rx="11" ry="16" fill="#64748b"/>
  <ellipse cx="78" cy="322" rx="5" ry="7" fill="#cbd5e1"/>

  <!-- Decorative Pakistani Crown / Taj above cab -->
  <path d="M180,68 C210,32 285,22 332,56 L340,94 L176,104 Z" fill="url(#cabGrad)" stroke="#0f172a" stroke-width="2"/>
  <path d="M188,68 C216,40 282,32 324,60 L328,82 L185,90 Z" fill="#cbd5e1" opacity="0.55"/>
  <!-- Decorative crown scallop pattern & marker lights -->
  <circle cx="215" cy="52" r="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.2"/>
  <circle cx="256" cy="43" r="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.2"/>
  <circle cx="298" cy="48" r="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.2"/>
  <path d="M196,78 Q256,64 316,74" fill="none" stroke="#1e293b" stroke-width="2"/>

  <!-- Main Cab Roof & Visor -->
  <path d="M174,102 L344,90 L368,142 L372,226 L174,234 Z" fill="url(#cabGrad)" stroke="#0f172a" stroke-width="2.5"/>
  <!-- Sun visor over windshield -->
  <path d="M210,122 L352,112 L358,128 L206,138 Z" fill="#1e293b"/>

  <!-- Cab Side Door (Left face) -->
  <path d="M174,132 L212,138 L212,328 L174,316 Z" fill="#334155" stroke="#0f172a" stroke-width="2"/>
  <path d="M181,148 L205,152 L205,212 L181,208 Z" fill="url(#glassGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- Side Mirrors -->
  <path d="M168,150 L150,152 L148,196 L166,195 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.2"/>
  <path d="M166,162 L175,160 M166,188 L175,186" stroke="#1e293b" stroke-width="2.5"/>
  <path d="M366,138 L388,142 L386,188 L366,184 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.2"/>

  <!-- Main Front Windshield -->
  <path d="M222,135 L350,126 L364,205 L218,214 Z" fill="url(#glassGrad)" stroke="#0f172a" stroke-width="2.5"/>
  <!-- Windshield diagonal glare & wipers -->
  <polygon points="242,135 268,133 245,210 224,212" fill="#ffffff" opacity="0.22"/>
  <polygon points="282,132 296,131 275,208 262,209" fill="#ffffff" opacity="0.16"/>
  <line x1="258" y1="210" x2="292" y2="178" stroke="#0f172a" stroke-width="2.2"/>
  <line x1="316" y1="206" x2="348" y2="174" stroke="#0f172a" stroke-width="2.2"/>

  <!-- Lower Front Nose / Grille Panel -->
  <path d="M214,214 L366,205 L370,320 L212,334 Z" fill="#475569" stroke="#0f172a" stroke-width="2.5"/>
  <!-- Center emblem band -->
  <path d="M236,219 L346,213 L348,229 L236,236 Z" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Grille Slats -->
  <rect x="248" y="242" width="96" height="44" rx="4" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/>
  <g stroke="#cbd5e1" stroke-width="2">
    <line x1="253" y1="251" x2="339" y2="249"/>
    <line x1="253" y1="260" x2="339" y2="258"/>
    <line x1="253" y1="269" x2="339" y2="267"/>
    <line x1="253" y1="278" x2="339" y2="276"/>
  </g>

  <!-- Twin Headlight Assemblies -->
  <rect x="218" y="250" width="24" height="28" rx="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8"/>
  <circle cx="230" cy="264" r="8" fill="#ffffff" stroke="#334155" stroke-width="1.5"/>
  <rect x="348" y="242" width="20" height="27" rx="3" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8"/>
  <circle cx="358" cy="255" r="7.5" fill="#ffffff" stroke="#334155" stroke-width="1.5"/>

  <!-- Heavy Front Bumper -->
  <path d="M196,306 L378,292 L380,334 L196,352 Z" fill="url(#chromeGrad)" stroke="#0f172a" stroke-width="2.5"/>
  <!-- Bumper side step & fog cutouts -->
  <rect x="208" y="318" width="28" height="14" rx="2" fill="#1e293b"/>
  <rect x="344" y="305" width="26" height="14" rx="2" fill="#1e293b"/>

  <!-- Number Plate (LES 6543) matching the uploaded bilty photo -->
  <g transform="translate(274,312) rotate(-4)">
    <rect x="0" y="0" width="44" height="34" rx="3" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    <text x="22" y="14" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="11" fill="#0f172a">LES</text>
    <text x="22" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="11.5" fill="#0f172a">6543</text>
  </g>

  <!-- Front Wheel (under cab left-front) -->
  <ellipse cx="182" cy="348" rx="28" ry="38" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
  <ellipse cx="182" cy="348" rx="15" ry="22" fill="#94a3b8"/>
  <ellipse cx="182" cy="348" rx="7" ry="10" fill="#1e293b"/>
  <!-- Front Right Wheel edge peeking under bumper -->
  <path d="M332,337 L366,334 L364,376 Q348,386 332,374 Z" fill="#0f172a"/>
</svg>`;

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PAKISTAN_FLAG_DATA_URL = svgToDataUrl(PAKISTAN_FLAG_SVG);
export const WHATSAPP_ICON_DATA_URL = svgToDataUrl(WHATSAPP_ICON_SVG);
export const TRUCK_WATERMARK_DATA_URL = svgToDataUrl(TRUCK_WATERMARK_SVG);

const imageCache = new Map<string, HTMLImageElement>();

export function loadSvgImage(dataUrl: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(dataUrl);
  if (cached && cached.complete) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(dataUrl, img);
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
