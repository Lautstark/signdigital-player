import { describe, expect, it } from "vitest";
import { isRate, nextRate, rateLabel } from "../src/speed";

describe("speed", () => {
  it("steps Normal, Schnell, Langsam and round again", () => {
    expect(nextRate(1)).toBe(1.5);
    expect(nextRate(1.5)).toBe(0.5);
    expect(nextRate(0.5)).toBe(1);
  });

  it("writes the factor the German way", () => {
    expect(rateLabel(0.5)).toBe("0,5×");
    expect(rateLabel(1)).toBe("1×");
  });

  it("accepts only the three speeds from storage", () => {
    expect(isRate(1.5)).toBe(true);
    expect(isRate(2)).toBe(false);
    expect(isRate("1")).toBe(false);
  });
});
