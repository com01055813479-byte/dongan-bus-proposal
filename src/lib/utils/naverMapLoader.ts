/**
 * 네이버 지도 SDK 로더 (싱글톤)
 *
 * - React StrictMode 의 effect 중복 호출에도 안전 (Promise 캐싱)
 * - 인증 실패 콜백(navermap_authFailure) 등록으로 에러 캐치
 * - submodules=geocoder 포함 → 클라이언트에서 역지오코딩 가능
 */

let loadPromise: Promise<NaverNamespace> | null = null;

export type NaverNamespace = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMapInstance;
    LatLng: new (lat: number, lng: number) => NaverLatLng;
    LatLngBounds: new () => NaverLatLngBounds;
    Marker: new (opts: Record<string, unknown>) => NaverMarker;
    Polyline: new (opts: Record<string, unknown>) => NaverPolyline;
    Point: new (x: number, y: number) => unknown;
    Size: new (w: number, h: number) => unknown;
    TrafficLayer: new (opts?: { interval?: number }) => NaverTrafficLayer;
    /** 컨트롤 배치 위치 enum (TOP_LEFT=1, TOP_CENTER=2, ... BOTTOM_RIGHT=9) */
    Position: { [k: string]: number };
    /** 줌 컨트롤 스타일 enum (LARGE=1, SMALL=2) */
    ZoomControlStyle: { [k: string]: number };
  };
};

export interface NaverTrafficLayer {
  setMap: (m: NaverMapInstance | null) => void;
}

export interface NaverMapInstance {
  setCenter: (latLng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: NaverLatLngBounds, padding?: number | { top: number; right: number; bottom: number; left: number }) => void;
}
export interface NaverLatLng { lat: () => number; lng: () => number; }
export interface NaverLatLngBounds { extend: (latLng: NaverLatLng) => void; }
export interface NaverMarker { setMap: (m: NaverMapInstance | null) => void; }
export interface NaverPolyline { setMap: (m: NaverMapInstance | null) => void; }

const SCRIPT_ID = "naver-maps-sdk";

export function loadNaverMaps(clientId: string): Promise<NaverNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SSR 환경에서는 사용할 수 없습니다."));
  }
  const w = window as unknown as { naver?: NaverNamespace; navermap_authFailure?: () => void };

  if (w.naver?.maps?.Map) return Promise.resolve(w.naver);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<NaverNamespace>((resolve, reject) => {
    // 인증 실패 콜백 등록 (네이버 SDK 가 호출함)
    w.navermap_authFailure = () => {
      loadPromise = null;
      reject(new Error("네이버 지도 인증 실패 — Client ID 또는 등록된 도메인을 확인하세요."));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => {
        if (w.naver?.maps?.Map) resolve(w.naver);
        else reject(new Error("네이버 지도 SDK 가 정상적으로 로드되지 않았습니다."));
      };
      if (w.naver?.maps?.Map) resolve(w.naver);
      else {
        existing.addEventListener("load", onLoad);
        existing.addEventListener("error", () => reject(new Error("네이버 지도 스크립트 로드 실패")));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    // NCP 는 2024 년부터 ncpKeyId 를 권장하지만 ncpClientId 도 호환 — 둘 다 보냄
    script.src =
      `https://oapi.map.naver.com/openapi/v3/maps.js` +
      `?ncpKeyId=${encodeURIComponent(clientId)}` +
      `&ncpClientId=${encodeURIComponent(clientId)}` +
      `&submodules=geocoder`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // SDK 가 비동기적으로 globals 을 채울 수 있음 — 짧게 폴링
      let tries = 40;
      const check = () => {
        if (w.naver?.maps?.Map) {
          resolve(w.naver);
        } else if (--tries > 0) {
          setTimeout(check, 50);
        } else {
          loadPromise = null;
          reject(new Error("네이버 지도 SDK 초기화 시간 초과"));
        }
      };
      check();
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("네이버 지도 스크립트 로드 실패 (네트워크/도메인 차단 가능성)"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
