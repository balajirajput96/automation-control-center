import { callDataApi } from "../_core/dataApi";
import { protectedProcedure, router } from "../_core/trpc";

export const marketRouter = router({
  nifty: protectedProcedure.query(async () => {
    const raw = await callDataApi("YahooFinance/get_stock_chart", { query: { symbol: "^NSEI", region: "IN", interval: "1d", range: "3mo", includeAdjustedClose: "true" } }) as { chart?: { result?: Array<{ meta?: Record<string, unknown>; timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
    const result = raw.chart?.result?.[0];
    if (!result?.meta) throw new Error("NIFTY market data was unavailable from the configured source");
    const timestamps = result.timestamp ?? []; const closes = result.indicators?.quote?.[0]?.close ?? [];
    const points = timestamps.map((timestamp, index) => ({ timestamp: timestamp * 1000, close: closes[index] ?? null })).filter(point => point.close !== null);
    const latest = points.at(-1)?.close ?? null; const prior = points.at(-2)?.close ?? null;
    return { symbol: "^NSEI", name: String(result.meta.longName || result.meta.shortName || "NIFTY 50"), currency: String(result.meta.currency || "INR"), latest, change: latest !== null && prior !== null ? latest - prior : null, changePercent: latest !== null && prior ? ((latest - prior) / prior) * 100 : null, points, source: "Yahoo Finance via Manus Data API", retrievedAt: new Date().toISOString(), dataStatus: "source-delayed" as const };
  }),
});
