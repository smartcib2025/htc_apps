import { eq, desc, and, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  players, InsertPlayer,
  coaches, InsertCoach,
  dailyCheckins, InsertDailyCheckin,
  coachEvaluations, InsertCoachEvaluation,
  matchStats, InsertMatchStat,
  aiReports, InsertAiReport,
  coachNotes, InsertCoachNote,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ PLAYER QUERIES ============
export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).orderBy(players.name);
}

export async function getPlayersByCoach(coachId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).where(eq(players.coachId, coachId)).orderBy(players.name);
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result[0];
}

export async function getPlayerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  return result[0];
}

export async function createPlayer(data: InsertPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(players).values(data);
  return result[0].insertId;
}

export async function updatePlayer(id: number, data: Partial<InsertPlayer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set(data).where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(players).where(eq(players.id, id));
}

// ============ COACH QUERIES ============
export async function getAllCoaches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coaches).orderBy(coaches.name);
}

export async function getCoachById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coaches).where(eq(coaches.id, id)).limit(1);
  return result[0];
}

export async function getCoachByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coaches).where(eq(coaches.userId, userId)).limit(1);
  return result[0];
}

export async function createCoach(data: InsertCoach) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coaches).values(data);
  return result[0].insertId;
}

export async function updateCoach(id: number, data: Partial<InsertCoach>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coaches).set(data).where(eq(coaches.id, id));
}

export async function deleteCoach(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coaches).where(eq(coaches.id, id));
}

// ============ DAILY CHECK-IN QUERIES ============
export async function getCheckinsByPlayer(playerId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyCheckins).where(eq(dailyCheckins.playerId, playerId)).orderBy(desc(dailyCheckins.checkinDate)).limit(limit);
}

export async function getCheckinByDate(playerId: number, dateStr: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyCheckins).where(and(eq(dailyCheckins.playerId, playerId), sql`${dailyCheckins.checkinDate} = ${dateStr}`)).limit(1);
  return result[0];
}

export async function createCheckin(data: InsertDailyCheckin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailyCheckins).values(data);
  return result[0].insertId;
}

export async function getAllCheckinsToday(dateStr: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyCheckins).where(sql`${dailyCheckins.checkinDate} = ${dateStr}`);
}

// ============ COACH EVALUATION QUERIES ============
export async function getEvalsByPlayer(playerId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachEvaluations).where(eq(coachEvaluations.playerId, playerId)).orderBy(desc(coachEvaluations.evalDate)).limit(limit);
}

export async function getEvalsByCoach(coachId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachEvaluations).where(eq(coachEvaluations.coachId, coachId)).orderBy(desc(coachEvaluations.evalDate)).limit(limit);
}

export async function createEvaluation(data: InsertCoachEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachEvaluations).values(data);
  return result[0].insertId;
}

export async function getLatestEvalForPlayer(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coachEvaluations).where(eq(coachEvaluations.playerId, playerId)).orderBy(desc(coachEvaluations.evalDate)).limit(1);
  return result[0];
}

// ============ MATCH STATS QUERIES ============
export async function getMatchesByPlayer(playerId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchStats).where(eq(matchStats.playerId, playerId)).orderBy(desc(matchStats.matchDate)).limit(limit);
}

export async function createMatch(data: InsertMatchStat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchStats).values(data);
  return result[0].insertId;
}

export async function getAllMatches(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchStats).orderBy(desc(matchStats.matchDate)).limit(limit);
}

// ============ AI REPORTS QUERIES ============
export async function getReportsByPlayer(playerId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiReports).where(eq(aiReports.playerId, playerId)).orderBy(desc(aiReports.generatedAt)).limit(limit);
}

export async function createReport(data: InsertAiReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiReports).values(data);
  return result[0].insertId;
}

export async function getLatestReportForPlayer(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiReports).where(eq(aiReports.playerId, playerId)).orderBy(desc(aiReports.generatedAt)).limit(1);
  return result[0];
}

// ============ COACH NOTES QUERIES ============
export async function getNotesByCoach(coachId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachNotes).where(eq(coachNotes.coachId, coachId)).orderBy(desc(coachNotes.noteDate)).limit(limit);
}

export async function getNotesByPlayer(playerId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachNotes).where(eq(coachNotes.playerId, playerId)).orderBy(desc(coachNotes.noteDate)).limit(limit);
}

export async function createNote(data: InsertCoachNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachNotes).values(data);
  return result[0].insertId;
}

export async function updateNote(id: number, data: Partial<InsertCoachNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coachNotes).set(data).where(eq(coachNotes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coachNotes).where(eq(coachNotes.id, id));
}

// ============ DASHBOARD QUERIES ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalPlayers: 0, totalCoaches: 0, activeToday: 0, highRiskCount: 0 };
  const [playerCount] = await db.select({ count: count() }).from(players).where(eq(players.status, "active"));
  const [coachCount] = await db.select({ count: count() }).from(coaches).where(eq(coaches.status, "active"));
  const today = new Date().toISOString().split("T")[0];
  const [todayCheckins] = await db.select({ count: count() }).from(dailyCheckins).where(sql`${dailyCheckins.checkinDate} = ${today}`);
  const [highRisk] = await db.select({ count: count() }).from(aiReports).where(eq(aiReports.riskLevel, "high"));
  return {
    totalPlayers: playerCount?.count ?? 0,
    totalCoaches: coachCount?.count ?? 0,
    activeToday: todayCheckins?.count ?? 0,
    highRiskCount: highRisk?.count ?? 0,
  };
}

export async function getPlayerPerformanceSummary(playerId: number) {
  const latestEval = await getLatestEvalForPlayer(playerId);
  const latestReport = await getLatestReportForPlayer(playerId);
  const recentCheckins = await getCheckinsByPlayer(playerId, 7);
  const recentMatches = await getMatchesByPlayer(playerId, 5);
  let performanceIndex = 0;
  let readinessIndex = 0;
  if (latestEval) {
    const scores = [latestEval.technique, latestEval.fitness, latestEval.tactics, latestEval.mental, latestEval.matchIQ].filter(Boolean) as number[];
    performanceIndex = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
  if (recentCheckins.length > 0) {
    const avgFatigue = recentCheckins.reduce((sum, c) => sum + (c.fatigue || 0), 0) / recentCheckins.length;
    const avgStress = recentCheckins.reduce((sum, c) => sum + (c.stress || 0), 0) / recentCheckins.length;
    const riskScore = (avgFatigue + avgStress) / 2;
    readinessIndex = Math.max(0, 100 - (riskScore * 10));
  }
  const winRate = recentMatches.length > 0 ? (recentMatches.filter(m => m.result === "win").length / recentMatches.length) * 100 : 0;
  return {
    performanceIndex: Math.round(performanceIndex * 10) / 10,
    readinessIndex: Math.round(readinessIndex * 10) / 10,
    peakIndex: Math.round(((performanceIndex * 10) + readinessIndex) / 2 * 10) / 10,
    winRate: Math.round(winRate),
    latestEval,
    latestReport,
    recentCheckinsCount: recentCheckins.length,
    totalMatches: recentMatches.length,
  };
}
