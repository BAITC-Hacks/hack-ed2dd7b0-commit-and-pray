import type {
  DistrictsResponse,
  MeasuresResponse,
  PreviewResult,
  Recommendation,
  Selection,
  SimulateResult,
} from "../types";

const BASE = "/api";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDistricts: () => jsonFetch<DistrictsResponse>("/districts"),
  getMeasures: () => jsonFetch<MeasuresResponse>("/measures"),
  getBaseScore: () =>
    jsonFetch<{
      score: number;
      d_avg: number;
      weakest_district: string;
      n_crit: number;
    }>("/base-score"),
  simulate: (selections: Selection[]) =>
    jsonFetch<SimulateResult>("/simulate", {
      method: "POST",
      body: JSON.stringify({ selections }),
    }),
  preview: (selections: Selection[]) =>
    jsonFetch<PreviewResult>("/preview", {
      method: "POST",
      body: JSON.stringify({ selections }),
    }),
  recommend: (selections: Selection[], result: SimulateResult) =>
    jsonFetch<Recommendation[]>("/recommend", {
      method: "POST",
      body: JSON.stringify({ selections, result }),
    }),
};
