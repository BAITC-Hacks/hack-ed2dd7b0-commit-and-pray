export type DirectionKey = "transport" | "ecology" | "social" | "safety" | "services"

export const DIRECTION_LABELS: Record<DirectionKey, string> = {
  transport: "Транспорт",
  ecology: "Экология",
  social: "Соцсфера",
  safety: "Безопасность",
  services: "Сервисы",
}

export const INDICATOR_LABELS: Record<string, string> = {
  T1: "Разгрузка дорог",
  T2: "Доступность транспорта",
  E1: "Озеленение",
  E2: "Качество воздуха",
  S1: "Школы и детсады",
  S2: "Поликлиники",
  B1: "Безопасность улиц",
  B2: "Безопасность ДД",
  C1: "Надёжность ЖКХ",
  C2: "Скорость обращений",
}

export interface District {
  name: string
  profile: string
  population_share: number
  indicators: Record<string, number>
}

export interface Measure {
  direction: DirectionKey
  title: string
  type: "district" | "city"
  cost: number
  lag: number
  effects: Record<string, number>
}

export type DistrictsResponse = Record<string, District>
export type MeasuresResponse = { measures: Record<string, Measure>; total_budget: number }

export interface Selection {
  measure_id: string
  district: string | null
}

export interface SynergyApplied {
  pair: [string, string]
  indicator: string
  bonus: number
  district: string | null
}

export interface SimulateResult {
  valid: boolean
  error?: string | null
  score?: number
  d_avg?: number
  weakest_district?: string
  weakest_district_score?: number
  district_scores?: Record<string, number>
  district_indicators?: Record<string, Record<string, number>>
  n_crit?: number
  synergies_applied?: SynergyApplied[]
  total_cost?: number
  budget_left?: number
  base_score?: number
  explanation?: string
}
