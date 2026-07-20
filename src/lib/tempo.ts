export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;

export function clampBpm(value: number) {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, value));
}
