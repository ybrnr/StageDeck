import { clampBpm, MAX_BPM, MIN_BPM } from "../tempo";

describe("clampBpm", () => {
  it("returns values inside the range unchanged", () => {
    expect(clampBpm(120)).toBe(120);
    expect(clampBpm(MIN_BPM)).toBe(MIN_BPM);
    expect(clampBpm(MAX_BPM)).toBe(MAX_BPM);
  });

  it("clamps values below the minimum", () => {
    expect(clampBpm(1)).toBe(MIN_BPM);
    expect(clampBpm(-50)).toBe(MIN_BPM);
  });

  it("clamps values above the maximum", () => {
    expect(clampBpm(999)).toBe(MAX_BPM);
  });
});
