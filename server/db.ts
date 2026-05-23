import { eq, desc, and, count, sql, like } from "drizzle-orm";
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
  academySettings, InsertAcademySetting,
  userAccounts, InsertUserAccount,
  auditLogs, InsertAuditLog,
  calendarEvents, InsertCalendarEvent,
  awards, InsertAward,
  playerAwards, InsertPlayerAward,
  coachingSessions, InsertCoachingSession,
  videoAnalysis, InsertVideoAnalysis,
  videoAnnotations, InsertVideoAnnotation,
  playerStatistics, InsertPlayerStatistic,
  integrationSettings, InsertIntegrationSetting,
  paymentTransactions, InsertPaymentTransaction,
  searchHistory, InsertSearchHistory,
  notifications, InsertNotification,
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

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiReports).where(eq(aiReports.id, id)).limit(1);
  return result[0];
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

// ============ ACADEMY SETTINGS QUERIES ============
export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(academySettings);
}

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(academySettings).where(eq(academySettings.settingKey, key)).limit(1);
  return result[0];
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(academySettings).where(eq(academySettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(academySettings).set({ settingValue: value }).where(eq(academySettings.settingKey, key));
  } else {
    await db.insert(academySettings).values({ settingKey: key, settingValue: value });
  }
  return { success: true };
}

// ============ USER ACCOUNTS (LOGIN) QUERIES ============
export async function getUserAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userAccounts).where(eq(userAccounts.username, username)).limit(1);
  return result[0];
}

export async function getAllUserAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAccounts).orderBy(desc(userAccounts.createdAt));
}

export async function createUserAccount(data: InsertUserAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userAccounts).values(data);
  return result[0].insertId;
}

export async function updateUserAccount(id: number, data: Partial<InsertUserAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userAccounts).set(data).where(eq(userAccounts.id, id));
}

export async function updateLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(userAccounts).set({ lastLoginAt: new Date() }).where(eq(userAccounts.id, id));
}

// ============ AUDIT LOG QUERIES ============
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByAction(action: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.action, action)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ============ CALENDAR EVENTS QUERIES ============
export async function getCalendarEventsByMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
  return db.select().from(calendarEvents).where(and(sql`${calendarEvents.eventDate} >= ${startDate}`, sql`${calendarEvents.eventDate} < ${endDate}`)).orderBy(calendarEvents.eventDate);
}

export async function getCalendarEventsByDate(dateStr: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(sql`${calendarEvents.eventDate} = ${dateStr}`).orderBy(calendarEvents.startTime);
}

export async function createCalendarEvent(data: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(data);
  return result[0].insertId;
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

// ============ AWARDS QUERIES ============
export async function getAllAwards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(awards).orderBy(awards.name);
}

export async function createAward(data: InsertAward) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(awards).values(data);
  return result[0].insertId;
}

export async function updateAward(id: number, data: Partial<InsertAward>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(awards).set(data).where(eq(awards.id, id));
}

export async function deleteAward(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(awards).where(eq(awards.id, id));
}

// ============ PLAYER AWARDS QUERIES ============
export async function getPlayerAwardsByPlayer(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playerAwards).where(eq(playerAwards.playerId, playerId)).orderBy(desc(playerAwards.awardedDate));
}

export async function getAllPlayerAwards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playerAwards).orderBy(desc(playerAwards.awardedDate));
}

export async function grantAward(data: InsertPlayerAward) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(playerAwards).values(data);
  return result[0].insertId;
}

export async function revokeAward(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(playerAwards).where(eq(playerAwards.id, id));
}

// ============ COACHING SESSIONS QUERIES ============
export async function getCoachingSessionsByCoach(coachId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachingSessions).where(eq(coachingSessions.coachId, coachId)).orderBy(desc(coachingSessions.sessionDate)).limit(limit);
}

export async function getCoachingSessionsByMonth(coachId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
  return db.select().from(coachingSessions).where(and(eq(coachingSessions.coachId, coachId), sql`${coachingSessions.sessionDate} >= ${startDate}`, sql`${coachingSessions.sessionDate} < ${endDate}`)).orderBy(coachingSessions.sessionDate);
}

export async function getAllCoachingSessionsByMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
  return db.select().from(coachingSessions).where(and(sql`${coachingSessions.sessionDate} >= ${startDate}`, sql`${coachingSessions.sessionDate} < ${endDate}`)).orderBy(coachingSessions.sessionDate);
}

export async function createCoachingSession(data: InsertCoachingSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachingSessions).values(data);
  return result[0].insertId;
}

export async function updateCoachingSession(id: number, data: Partial<InsertCoachingSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coachingSessions).set(data).where(eq(coachingSessions.id, id));
}

export async function deleteCoachingSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coachingSessions).where(eq(coachingSessions.id, id));
}

// ============ EXPORT DATA QUERIES ============
export async function getExportPlayerSummary(playerId: number) {
  const player = await getPlayerById(playerId);
  const evals = await getEvalsByPlayer(playerId, 50);
  const checkins = await getCheckinsByPlayer(playerId, 90);
  const matches = await getMatchesByPlayer(playerId, 50);
  const reports = await getReportsByPlayer(playerId, 10);
  const pAwards = await getPlayerAwardsByPlayer(playerId);
  return { player, evals, checkins, matches, reports, awards: pAwards };
}

export async function getExportAttendanceReport(year: number, month: number) {
  const db = await getDb();
  if (!db) return { players: [], checkins: [] };
  const allPlayers = await getAllPlayers();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
  const monthCheckins = await db.select().from(dailyCheckins).where(and(sql`${dailyCheckins.checkinDate} >= ${startDate}`, sql`${dailyCheckins.checkinDate} < ${endDate}`)).orderBy(dailyCheckins.checkinDate);
  return { players: allPlayers, checkins: monthCheckins };
}

export async function getExportCoachCompensation(coachId: number, year: number, month: number) {
  const coach = await getCoachById(coachId);
  const sessions = await getCoachingSessionsByMonth(coachId, year, month);
  const totalHours = sessions.reduce((sum, s) => sum + (s.hours || 0), 0);
  const totalAmount = sessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  return { coach, sessions, totalHours, totalAmount };
}

// ============ VIDEO ANALYSIS FUNCTIONS ============
export async function createVideoAnalysis(data: InsertVideoAnalysis): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create video: database not available");
    return;
  }
  try {
    await db.insert(videoAnalysis).values(data);
  } catch (error) {
    console.error("[Database] Error creating video:", error);
    throw error;
  }
}

export async function getVideoAnalysisList(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(videoAnalysis).limit(limit).offset(offset);
  } catch (error) {
    console.error("[Database] Error fetching videos:", error);
    return [];
  }
}

export async function getVideoById(videoId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(videoAnalysis).where(eq(videoAnalysis.id, videoId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error fetching video:", error);
    return null;
  }
}

export async function updateVideoViewCount(videoId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const video = await getVideoById(videoId);
    if (video) {
      await db.update(videoAnalysis).set({ viewCount: (video.viewCount || 0) + 1 }).where(eq(videoAnalysis.id, videoId));
    }
  } catch (error) {
    console.error("[Database] Error updating view count:", error);
  }
}

export async function createVideoAnnotation(data: InsertVideoAnnotation): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(videoAnnotations).values(data);
  } catch (error) {
    console.error("[Database] Error creating annotation:", error);
    throw error;
  }
}

export async function getVideoAnnotations(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(videoAnnotations).where(eq(videoAnnotations.videoId, videoId));
  } catch (error) {
    console.error("[Database] Error fetching annotations:", error);
    return [];
  }
}

// ============ PLAYER STATISTICS FUNCTIONS ============
export async function createPlayerStatistic(data: InsertPlayerStatistic): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(playerStatistics).values(data);
  } catch (error) {
    console.error("[Database] Error creating statistic:", error);
    throw error;
  }
}

export async function getPlayerStatisticsTrend(playerId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await db.select().from(playerStatistics)
      .where(and(
        eq(playerStatistics.playerId, playerId),
        sql`${playerStatistics.statisticDate} >= ${startDate.toISOString().split('T')[0]}`
      ))
      .orderBy(desc(playerStatistics.statisticDate));
  } catch (error) {
    console.error("[Database] Error fetching statistics:", error);
    return [];
  }
}

export async function getLatestPlayerStatistic(playerId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(playerStatistics)
      .where(eq(playerStatistics.playerId, playerId))
      .orderBy(desc(playerStatistics.statisticDate))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error fetching latest statistic:", error);
    return null;
  }
}

export async function getHighRiskPlayers(riskThreshold: number = 70) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(playerStatistics)
      .where(sql`${playerStatistics.injuryRiskScore} >= ${riskThreshold}`)
      .orderBy(desc(playerStatistics.injuryRiskScore));
  } catch (error) {
    console.error("[Database] Error fetching high risk players:", error);
    return [];
  }
}

// ============ INTEGRATION SETTINGS FUNCTIONS ============
export async function getIntegrationSettings(academyId?: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const query = academyId 
      ? await db.select().from(integrationSettings).where(eq(integrationSettings.academyId, academyId))
      : await db.select().from(integrationSettings).limit(1);
    return query[0] || null;
  } catch (error) {
    console.error("[Database] Error fetching integration settings:", error);
    return null;
  }
}

export async function updateIntegrationSettings(data: Partial<InsertIntegrationSetting>, academyId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const settings = await getIntegrationSettings(academyId);
    if (settings) {
      await db.update(integrationSettings).set(data).where(eq(integrationSettings.id, settings.id));
    } else {
      await db.insert(integrationSettings).values(data as InsertIntegrationSetting);
    }
  } catch (error) {
    console.error("[Database] Error updating integration settings:", error);
    throw error;
  }
}

// ============ PAYMENT TRANSACTION FUNCTIONS ============
export async function createPaymentTransaction(data: InsertPaymentTransaction): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(paymentTransactions).values(data);
  } catch (error) {
    console.error("[Database] Error creating payment transaction:", error);
    throw error;
  }
}

export async function getCoachPaymentTransactions(coachId: number, month?: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    const conditions = [eq(paymentTransactions.coachId, coachId)];
    if (month) {
      conditions.push(eq(paymentTransactions.month, month));
    }
    return await db.select().from(paymentTransactions)
      .where(and(...conditions))
      .orderBy(desc(paymentTransactions.createdAt));
  } catch (error) {
    console.error("[Database] Error fetching payment transactions:", error);
    return [];
  }
}

export async function getMonthlyCompensationReport(month: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.month, month))
      .orderBy(desc(paymentTransactions.amount));
  } catch (error) {
    console.error("[Database] Error fetching compensation report:", error);
    return [];
  }
}

export async function updatePaymentTransactionStatus(transactionId: number, status: string, approvedBy?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(paymentTransactions)
      .set({ status: status as any, approvedBy })
      .where(eq(paymentTransactions.id, transactionId));
  } catch (error) {
    console.error("[Database] Error updating payment transaction:", error);
    throw error;
  }
}


// ============ SEARCH HISTORY ============
export async function addSearchHistory(data: InsertSearchHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add search history: database not available");
    return;
  }
  try {
    await db.insert(searchHistory).values(data);
  } catch (error) {
    console.error("[Database] Error adding search history:", error);
  }
}

export async function getSearchHistory(userId: number, limit: number = 10): Promise<(typeof searchHistory.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Error getting search history:", error);
    return [];
  }
}

export async function searchPlayers(query: string, filters?: any): Promise<(typeof players.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const conditions: any[] = [];
    
    if (query) {
      conditions.push(like(players.name, `%${query}%`));
    }
    
    if (filters?.level) {
      conditions.push(eq(players.level, filters.level));
    }
    
    if (filters?.status) {
      conditions.push(eq(players.status, filters.status));
    }
    
    if (filters?.program) {
      conditions.push(eq(players.program, filters.program));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(players)
        .where(and(...conditions))
        .limit(50);
    } else {
      return await db
        .select()
        .from(players)
        .limit(50);
    }
  } catch (error) {
    console.error("[Database] Error searching players:", error);
    return [];
  }
}

// ============ NOTIFICATIONS ============
export async function createNotification(data: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return;
  }
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error("[Database] Error creating notification:", error);
  }
}

export async function getNotifications(userId: number, limit: number = 20): Promise<(typeof notifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Error getting notifications:", error);
    return [];
  }
}

export async function getUnreadNotifications(userId: number): Promise<(typeof notifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.priority), desc(notifications.createdAt));
  } catch (error) {
    console.error("[Database] Error getting unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification: database not available");
    return;
  }
  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("[Database] Error marking notification as read:", error);
  }
}

export async function getHighRiskPlayerNotifications(academyId: number): Promise<(typeof notifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.notificationType, "high_risk_player"))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (error) {
    console.error("[Database] Error getting high risk notifications:", error);
    return [];
  }
}

export async function getUpcomingMatchNotifications(coachId: number): Promise<(typeof notifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.notificationType, "upcoming_match"))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (error) {
    console.error("[Database] Error getting match notifications:", error);
    return [];
  }
}

export async function getCoachCompensationNotifications(headCoachId: number): Promise<(typeof notifications.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.notificationType, "coach_compensation"))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (error) {
    console.error("[Database] Error getting compensation notifications:", error);
    return [];
  }
}
