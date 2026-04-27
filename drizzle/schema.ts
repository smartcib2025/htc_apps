import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, date } from "drizzle-orm/mysql-core";

// ============ USERS TABLE ============
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ PLAYERS TABLE ============
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  level: varchar("level", { length: 100 }),
  program: varchar("program", { length: 100 }),
  coachId: int("coachId"),
  avatarUrl: text("avatarUrl"),
  dateOfBirth: date("dateOfBirth"),
  phone: varchar("phone", { length: 20 }),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "injured"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// ============ COACHES TABLE ============
export const coaches = mysqlTable("coaches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  coachRole: mysqlEnum("coachRole", ["coach", "head_coach", "admin"]).default("coach").notNull(),
  specialty: varchar("specialty", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

// ============ DAILY CHECK-INS TABLE ============
export const dailyCheckins = mysqlTable("daily_checkins", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  checkinDate: date("checkinDate").notNull(),
  trainingHours: float("trainingHours"),
  fatigue: int("fatigue"),
  confidence: int("confidence"),
  stress: int("stress"),
  injuryStatus: boolean("injuryStatus").default(false),
  injuryDescription: text("injuryDescription"),
  strengthFeeling: text("strengthFeeling"),
  weaknessFeeling: text("weaknessFeeling"),
  nextGoal: text("nextGoal"),
  mode: mysqlEnum("mode", ["weekly", "monthly", "tournament"]).default("weekly"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = typeof dailyCheckins.$inferInsert;

// ============ COACH EVALUATIONS TABLE ============
export const coachEvaluations = mysqlTable("coach_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  coachId: int("coachId").notNull(),
  technique: int("technique"),
  fitness: int("fitness"),
  tactics: int("tactics"),
  mental: int("mental"),
  discipline: int("discipline"),
  matchIQ: int("matchIQ"),
  strengthNote: text("strengthNote"),
  weaknessNote: text("weaknessNote"),
  coachComment: text("coachComment"),
  evalType: mysqlEnum("evalType", ["weekly", "monthly", "tournament"]).default("weekly"),
  evalDate: date("evalDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachEvaluation = typeof coachEvaluations.$inferSelect;
export type InsertCoachEvaluation = typeof coachEvaluations.$inferInsert;

// ============ MATCH STATS TABLE ============
export const matchStats = mysqlTable("match_stats", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  matchDate: date("matchDate").notNull(),
  opponent: varchar("opponent", { length: 255 }),
  tournament: varchar("tournament", { length: 255 }),
  servePercent: float("servePercent"),
  winners: int("winners"),
  unforcedErrors: int("unforcedErrors"),
  result: mysqlEnum("result", ["win", "loss"]),
  score: varchar("score", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchStat = typeof matchStats.$inferSelect;
export type InsertMatchStat = typeof matchStats.$inferInsert;

// ============ AI REPORTS TABLE ============
export const aiReports = mysqlTable("ai_reports", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  reportType: mysqlEnum("reportType", ["weekly", "monthly", "tournament"]).default("weekly"),
  summary: text("summary"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  actionPlan: text("actionPlan"),
  goals: text("goals"),
  performanceIndex: float("performanceIndex"),
  readinessIndex: float("readinessIndex"),
  peakIndex: float("peakIndex"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).default("low"),
  riskType: varchar("riskType", { length: 100 }),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type AiReport = typeof aiReports.$inferSelect;
export type InsertAiReport = typeof aiReports.$inferInsert;

// ============ COACH NOTES TABLE ============
export const coachNotes = mysqlTable("coach_notes", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  playerId: int("playerId"),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  noteDate: date("noteDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachNote = typeof coachNotes.$inferSelect;
export type InsertCoachNote = typeof coachNotes.$inferInsert;
