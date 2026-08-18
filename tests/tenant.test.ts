import { describe, expect, it } from "vitest";
import {
  canUseFeature,
  createAccountSessionToken,
  getAccountIdFromSessionToken,
  getPlanEntitlements,
} from "../server/tenant";

describe("SaaS tenant security helpers", () => {
  it("round-trips a signed account session token", () => {
    const token = createAccountSessionToken(42);
    expect(getAccountIdFromSessionToken(token)).toBe(42);
  });

  it("rejects a tampered session token", () => {
    const token = createAccountSessionToken(42);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(getAccountIdFromSessionToken(tampered)).toBeNull();
  });

  it("defines progressively larger plan entitlements", () => {
    expect(getPlanEntitlements("free").maxPlayers).toBeLessThan(getPlanEntitlements("pro").maxPlayers);
    expect(getPlanEntitlements("pro").maxPlayers).toBeLessThan(getPlanEntitlements("enterprise").maxPlayers);
    expect(getPlanEntitlements("free").finance).toBe(false);
    expect(getPlanEntitlements("enterprise").finance).toBe(true);
  });

  it("blocks premium features for canceled academies", () => {
    const academy = { subscriptionStatus: "canceled", subscriptionPlan: "enterprise" } as any;
    expect(canUseFeature(academy, "video")).toBe(false);
    expect(canUseFeature(academy, "finance")).toBe(false);
  });
});
