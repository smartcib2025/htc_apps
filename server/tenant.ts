import crypto from "crypto";
import { parse as parseCookie } from "cookie";
import { and, count, eq } from "drizzle-orm";
import { academies, academyMemberships, players, coaches, type Academy, type AcademyMembership } from "../drizzle/schema";
import { getDb } from "./db";

export const ACCOUNT_SESSION_HEADER = "x-htc-session";
export const ACADEMY_HEADER = "x-academy-id";
export const ACCOUNT_SESSION_COOKIE = "htc_account_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.JWT_SECRET || "hanuman-tennis-development-session-secret";
}

function signSession(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAccountSessionToken(accountId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${accountId}.${expiresAt}`;
  return `${payload}.${signSession(payload)}`;
}

export function getAccountIdFromSessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [accountIdText, expiresAtText, signature] = token.split(".");
  const accountId = Number(accountIdText);
  const expiresAt = Number(expiresAtText);
  if (!Number.isInteger(accountId) || accountId <= 0 || !Number.isInteger(expiresAt) || !signature) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;
  const payload = `${accountId}.${expiresAt}`;
  const expected = signSession(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return accountId;
}

export function getAccountIdFromRequest(req: { headers?: Record<string, string | string[] | undefined> }) {
  const headerValue = req.headers?.[ACCOUNT_SESSION_HEADER];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const bearer = req.headers?.authorization;
  const authorization = Array.isArray(bearer) ? bearer[0] : bearer;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  const cookieHeader = req.headers?.cookie;
  const cookieValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  const cookieToken = cookieValue ? parseCookie(cookieValue)[ACCOUNT_SESSION_COOKIE] : undefined;
  return getAccountIdFromSessionToken(headerToken || bearerToken || cookieToken);
}

export function getAcademyIdFromRequest(req: { headers?: Record<string, string | string[] | undefined> }) {
  const value = req.headers?.[ACADEMY_HEADER];
  const raw = Array.isArray(value) ? value[0] : value;
  const academyId = Number(raw);
  return Number.isInteger(academyId) && academyId > 0 ? academyId : null;
}

export type TenantAccess = {
  academy: Academy;
  membership: AcademyMembership;
  principalId: number;
};

export async function getAcademyAccess(principalId: number, academyId: number): Promise<TenantAccess | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ academy: academies, membership: academyMemberships })
    .from(academyMemberships)
    .innerJoin(academies, eq(academies.id, academyMemberships.academyId))
    .where(and(
      eq(academyMemberships.userId, principalId),
      eq(academyMemberships.academyId, academyId),
      eq(academyMemberships.isActive, true),
    ))
    .limit(1);
  if (!rows[0]) return null;
  return { academy: rows[0].academy, membership: rows[0].membership, principalId };
}

export async function listAcademiesForPrincipal(principalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ academy: academies, membership: academyMemberships })
    .from(academyMemberships)
    .innerJoin(academies, eq(academies.id, academyMemberships.academyId))
    .where(and(eq(academyMemberships.userId, principalId), eq(academyMemberships.isActive, true)));
}

export async function createAcademyWithOwner(input: {
  name: string;
  slug: string;
  domain?: string;
  primaryColor?: string;
  accentColor?: string;
  principalId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ id: academies.id }).from(academies).where(eq(academies.slug, input.slug)).limit(1);
  if (existing[0]) throw new Error("Academy slug is already in use");
  const result = await db.insert(academies).values({
    name: input.name,
    slug: input.slug,
    domain: input.domain,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
    subscriptionPlan: "pro",
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  const academyId = Number((result as any)[0]?.insertId);
  await db.insert(academyMemberships).values({ academyId, userId: input.principalId, role: "tenant_admin" });
  return getAcademyAccess(input.principalId, academyId);
}

export async function updateAcademyBranding(academyId: number, input: {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  domain?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(academies).set(input).where(eq(academies.id, academyId));
  const rows = await db.select().from(academies).where(eq(academies.id, academyId)).limit(1);
  return rows[0];
}

export async function getAcademyUsage(academyId: number) {
  const db = await getDb();
  if (!db) return { players: 0, coaches: 0, members: 0 };
  const [memberCount, playerCount, coachCount] = await Promise.all([
    db.select({ value: count() }).from(academyMemberships).where(and(eq(academyMemberships.academyId, academyId), eq(academyMemberships.isActive, true))),
    db.select({ value: count() }).from(players).where(eq(players.academyId, academyId)),
    db.select({ value: count() }).from(coaches).where(eq(coaches.academyId, academyId)),
  ]);
  return {
    members: Number(memberCount[0]?.value ?? 0),
    players: Number(playerCount[0]?.value ?? 0),
    coaches: Number(coachCount[0]?.value ?? 0),
  };
}

export function canManageAcademy(role: AcademyMembership["role"]) {
  return role === "tenant_admin";
}

export function canUseFeature(academy: Academy, feature: "video" | "analytics" | "finance") {
  if (academy.subscriptionStatus === "canceled" || academy.subscriptionStatus === "past_due") return false;
  if (feature === "finance") return academy.subscriptionPlan === "enterprise";
  if (feature === "analytics") return academy.subscriptionPlan !== "free";
  return academy.subscriptionPlan !== "free";
}

export function getPlanEntitlements(plan: Academy["subscriptionPlan"]) {
  return {
    plan,
    maxPlayers: plan === "free" ? 10 : plan === "pro" ? 250 : 5000,
    maxCoaches: plan === "free" ? 2 : plan === "pro" ? 25 : 500,
    videoAnalysis: plan !== "free",
    analytics: plan !== "free",
    finance: plan === "enterprise",
  } as const;
}
