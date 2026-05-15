import { NextResponse } from "next/server";

/**
 * GET /api/weather
 *
 * 기상청 API 허브 (apihub.kma.go.kr) 의 두 가지 API 를 결합:
 *  1) getUltraSrtNcst — 초단기실황 (현재 기온/강수형태)
 *  2) getVilageFcst   — 단기예보 (오늘 최고/최저기온, 강수확률, 하늘상태)
 *
 * 환경변수 필요:  KMA_API_KEY  (apihub.kma.go.kr 인증키)
 *
 * 격자 좌표: 평촌학원가 (안양시 동안구) ≈ nx=59, ny=124
 */

const KMA_KEY = process.env.KMA_API_KEY ?? "";
const NX = 59;
const NY = 124;
const BASE_URL = "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0";

interface KmaItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate?: string;
  fcstTime?: string;
  fcstValue?: string;
  obsrValue?: string;
  nx: number;
  ny: number;
}

// ─────────────────────────────────────────────────────────────────────
// 시각 계산 헬퍼
// ─────────────────────────────────────────────────────────────────────
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** 초단기실황 base 시각: 매시 정각 데이터, 약 40분 후 가용 */
function getNowcastBase(): { date: string; time: string } {
  const d = new Date();
  if (d.getMinutes() < 45) d.setHours(d.getHours() - 1);
  return { date: ymd(d), time: pad2(d.getHours()) + "00" };
}

/** 단기예보 base 시각: 02/05/08/11/14/17/20/23, 약 10분 후 가용 */
function getForecastBase(): { date: string; time: string } {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const now = new Date();
  // 현재 시각 - 15분 (10분 가용 + 여유) 의 가장 가까운 이전 slot 선택
  const t = new Date(now.getTime() - 15 * 60 * 1000);
  const h = t.getHours();
  let baseHour = -1;
  for (let i = slots.length - 1; i >= 0; i--) {
    if (h >= slots[i]) { baseHour = slots[i]; break; }
  }
  const d = new Date(now);
  if (baseHour === -1) {
    // 02시 이전 → 어제 23시
    d.setDate(d.getDate() - 1);
    baseHour = 23;
  }
  return { date: ymd(d), time: pad2(baseHour) + "00" };
}

// ─────────────────────────────────────────────────────────────────────
// GET 핸들러
// ─────────────────────────────────────────────────────────────────────
export const revalidate = 600; // 10분 캐시

export async function GET() {
  if (!KMA_KEY) {
    return NextResponse.json(
      { error: "KMA_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const nc = getNowcastBase();
  const fc = getForecastBase();

  const ncUrl =
    `${BASE_URL}/getUltraSrtNcst` +
    `?authKey=${encodeURIComponent(KMA_KEY)}` +
    `&base_date=${nc.date}&base_time=${nc.time}` +
    `&nx=${NX}&ny=${NY}` +
    `&dataType=JSON&numOfRows=10&pageNo=1`;

  const fcUrl =
    `${BASE_URL}/getVilageFcst` +
    `?authKey=${encodeURIComponent(KMA_KEY)}` +
    `&base_date=${fc.date}&base_time=${fc.time}` +
    `&nx=${NX}&ny=${NY}` +
    `&dataType=JSON&numOfRows=400&pageNo=1`;

  try {
    // 초단기실황 (필수) — 단기예보는 실패해도 무시
    const [ncRes, fcRes] = await Promise.allSettled([
      fetch(ncUrl, { next: { revalidate: 600 } }),
      fetch(fcUrl, { next: { revalidate: 1800 } }),
    ]);

    // 실황 실패 시 전체 실패 처리
    if (ncRes.status !== "fulfilled" || !ncRes.value.ok) {
      const code = ncRes.status === "fulfilled" ? ncRes.value.status : "네트워크";
      return NextResponse.json(
        { error: `초단기실황 조회 실패 (${code})` },
        { status: 502 }
      );
    }

    const ncJson = await ncRes.value.json();
    const ncItems: KmaItem[] = ncJson?.response?.body?.items?.item ?? [];

    if (ncItems.length === 0) {
      return NextResponse.json(
        { error: "초단기실황 응답에 데이터가 없습니다.", debug: ncJson },
        { status: 502 }
      );
    }

    // ── 초단기실황: 현재 ──
    const tempVal   = ncItems.find((i) => i.category === "T1H")?.obsrValue;
    const ptyVal    = ncItems.find((i) => i.category === "PTY")?.obsrValue;
    const rn1Val    = ncItems.find((i) => i.category === "RN1")?.obsrValue;
    const tempC     = tempVal ? parseFloat(tempVal) : null;
    const pty       = ptyVal ? parseInt(ptyVal, 10) : 0;
    const rainMm    = rn1Val ? parseFloat(rn1Val) : 0;

    // ── 단기예보: 성공 시에만 오늘 최고/최저/강수확률/하늘 ──
    let tmin: number | null = null;
    let tmax: number | null = null;
    let maxPop = 0;
    let sky = 0; // 0 = 알 수 없음

    if (fcRes.status === "fulfilled" && fcRes.value.ok) {
      try {
        const fcJson = await fcRes.value.json();
        const fcItems: KmaItem[] = fcJson?.response?.body?.items?.item ?? [];
        const today = ymd(new Date());
        const todayItems = fcItems.filter((i) => i.fcstDate === today);

        const tmnItem = todayItems.find((i) => i.category === "TMN");
        const tmxItem = todayItems.find((i) => i.category === "TMX");
        tmin = tmnItem?.fcstValue ? parseFloat(tmnItem.fcstValue) : null;
        tmax = tmxItem?.fcstValue ? parseFloat(tmxItem.fcstValue) : null;

        const popItems = todayItems.filter((i) => i.category === "POP" && i.fcstValue);
        maxPop = popItems.reduce(
          (m, i) => Math.max(m, parseInt(i.fcstValue!, 10)),
          0
        );

        const skyItems = todayItems.filter((i) => i.category === "SKY" && i.fcstValue);
        const skyCounts: Record<string, number> = {};
        for (const i of skyItems) {
          const v = i.fcstValue!;
          skyCounts[v] = (skyCounts[v] ?? 0) + 1;
        }
        const dominantSky =
          Object.entries(skyCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (dominantSky) sky = parseInt(dominantSky, 10);
      } catch {
        // 단기예보 파싱 실패는 무시
      }
    }

    return NextResponse.json({
      tempC,                   // 현재 기온 (°C) — null 가능
      pty,                     // 0:없음, 1:비, 2:비/눈, 3:눈, 5:빗방울, 6:빗방울/눈날림, 7:눈날림
      rainMm,                  // 현재 1시간 강수량 (mm)
      tmin,                    // 오늘 최저기온 (°C) — null = 단기예보 미사용
      tmax,                    // 오늘 최고기온 (°C) — null = 단기예보 미사용
      maxPop,                  // 오늘 최고 강수확률 (%) — 0 = 미사용
      sky,                     // 1:맑음, 3:구름많음, 4:흐림, 0:미사용(실황만)
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[weather] error:", err);
    return NextResponse.json(
      { error: "날씨 조회 중 오류", detail: String(err) },
      { status: 500 }
    );
  }
}
