import truckWatermarkAsset from '../assets/images/truck_watermark_halftone_1795666136841.jpg';

// Shared vector & raster artwork for the Warraich Goods Samundri Official Bilty
// Used consistently by both OfficialBiltySheet (React/Print) and pdfGenerator (300 DPI A4 PDF).

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

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PAKISTAN_FLAG_DATA_URL = svgToDataUrl(PAKISTAN_FLAG_SVG);
export const WHATSAPP_ICON_DATA_URL = svgToDataUrl(WHATSAPP_ICON_SVG);
export const TRUCK_WATERMARK_URL = truckWatermarkAsset;

const imageCache = new Map<string, HTMLImageElement>();
const knockoutCache = new Map<string, HTMLCanvasElement>();

export function loadImageAsset(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Converts pure white background pixels of the halftone truck graphic into
 * transparent alpha so table grid dividers show cleanly underneath.
 */
export async function loadHalftoneTruckCanvas(
  src: string
): Promise<HTMLCanvasElement> {
  const cached = knockoutCache.get(src);
  if (cached) return cached;

  const img = await loadImageAsset(src);
  const off = document.createElement('canvas');
  off.width = img.naturalWidth || img.width;
  off.height = img.naturalHeight || img.height;
  const octx = off.getContext('2d');
  if (!octx) return off;

  octx.drawImage(img, 0, 0);
  const imgData = octx.getImageData(0, 0, off.width, off.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum >= 240) {
      data[i + 3] = 0;
    } else {
      // Smooth anti-aliased edge transparency for light gray dots
      const alpha = Math.min(255, Math.max(0, Math.round(((245 - lum) / 200) * 255)));
      data[i] = 28;
      data[i + 1] = 35;
      data[i + 2] = 48;
      data[i + 3] = alpha;
    }
  }

  octx.putImageData(imgData, 0, 0);
  knockoutCache.set(src, off);
  return off;
}
