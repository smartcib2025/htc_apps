import { describe, it, expect } from "vitest";
import { calculatePerformanceIndex, calculateRiskScore, getRiskColor, demoPlayers, demoCheckins, demoEvaluations, demoMatches, demoReports } from "../lib/demo-data";

describe("Demo Data Integrity", () => {
  it("should have at least 5 players", () => {
    expect(demoPlayers.length).toBeGreaterThanOrEqual(5);
  });

  it("all players should have required fields", () => {
    demoPlayers.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeTruthy();
      expect(p.level).toBeTruthy();
      expect(p.program).toBeTruthy();
      expect(p.coachId).toBeDefined();
      expect(["active", "injured", "inactive"]).toContain(p.status);
    });
  });

  it("should have check-ins with valid fields", () => {
    demoCheckins.forEach((c) => {
      expect(c.playerId).toBeDefined();
      expect(c.checkinDate).toBeTruthy();
      expect(c.trainingHours).toBeGreaterThan(0);
      expect(c.fatigue).toBeGreaterThanOrEqual(1);
      expect(c.fatigue).toBeLessThanOrEqual(10);
      expect(c.confidence).toBeGreaterThanOrEqual(1);
      expect(c.confidence).toBeLessThanOrEqual(10);
      expect(c.stress).toBeGreaterThanOrEqual(1);
      expect(c.stress).toBeLessThanOrEqual(10);
    });
  });

  it("should have evaluations with scores 1-10", () => {
    demoEvaluations.forEach((e) => {
      expect(e.technique).toBeGreaterThanOrEqual(1);
      expect(e.technique).toBeLessThanOrEqual(10);
      expect(e.fitness).toBeGreaterThanOrEqual(1);
      expect(e.fitness).toBeLessThanOrEqual(10);
      expect(e.tactics).toBeGreaterThanOrEqual(1);
      expect(e.tactics).toBeLessThanOrEqual(10);
      expect(e.mental).toBeGreaterThanOrEqual(1);
      expect(e.mental).toBeLessThanOrEqual(10);
    });
  });

  it("should have matches with valid results", () => {
    demoMatches.forEach((m) => {
      expect(["win", "loss"]).toContain(m.result);
      expect(m.score).toBeTruthy();
      expect(m.opponent).toBeTruthy();
    });
  });

  it("should have reports with indices", () => {
    demoReports.forEach((r) => {
      expect(r.performanceIndex).toBeGreaterThan(0);
      expect(r.readinessIndex).toBeGreaterThan(0);
      expect(r.peakIndex).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(r.riskLevel);
    });
  });
});

describe("calculatePerformanceIndex", () => {
  it("should calculate average of all scores", () => {
    const result = calculatePerformanceIndex({
      technique: 8,
      fitness: 7,
      tactics: 7,
      mental: 8,
      matchIQ: 7,
    });
    expect(result).toBe(7.4);
  });

  it("should handle null values", () => {
    const result = calculatePerformanceIndex({
      technique: 8,
      fitness: null,
      tactics: null,
      mental: 8,
      matchIQ: null,
    });
    expect(result).toBe(8);
  });

  it("should return 0 for empty evaluation", () => {
    const result = calculatePerformanceIndex({});
    expect(result).toBe(0);
  });
});

describe("calculateRiskScore", () => {
  it("should return low risk for healthy checkins", () => {
    const result = calculateRiskScore([
      { fatigue: 3, stress: 2, confidence: 8, injuryStatus: false },
    ]);
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(40);
  });

  it("should return high risk for fatigued and stressed player", () => {
    const result = calculateRiskScore([
      { fatigue: 9, stress: 9, confidence: 2, injuryStatus: true },
    ]);
    expect(result.level).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("should return medium risk for moderate values", () => {
    const result = calculateRiskScore([
      { fatigue: 5, stress: 5, confidence: 5, injuryStatus: false },
    ]);
    expect(result.level).toBe("medium");
  });

  it("should return low risk for empty checkins", () => {
    const result = calculateRiskScore([]);
    expect(result.level).toBe("low");
    expect(result.score).toBe(0);
  });
});

describe("getRiskColor", () => {
  it("should return red for high risk", () => {
    expect(getRiskColor("high")).toBe("#C62828");
  });

  it("should return yellow for medium risk", () => {
    expect(getRiskColor("medium")).toBe("#F57F17");
  });

  it("should return green for low risk", () => {
    expect(getRiskColor("low")).toBe("#2E7D32");
  });
});
