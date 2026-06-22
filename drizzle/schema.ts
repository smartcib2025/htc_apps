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

// ============ ACADEMY SETTINGS TABLE ============
export const academySettings = mysqlTable("academy_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademySetting = typeof academySettings.$inferSelect;
export type InsertAcademySetting = typeof academySettings.$inferInsert;

// ============ USER ACCOUNTS TABLE (Login System) ============
export const userAccounts = mysqlTable("user_accounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["player", "coach", "head_coach", "admin"]).default("player").notNull(),
  playerId: int("playerId"),
  coachId: int("coachId"),
  displayName: varchar("displayName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserAccount = typeof userAccounts.$inferInsert;

// ============ AUDIT LOGS TABLE ============
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  username: varchar("username", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============ CALENDAR EVENTS TABLE ============
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["training", "match", "tournament", "meeting", "rest", "other"]).default("training").notNull(),
  eventDate: date("eventDate").notNull(),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  location: varchar("location", { length: 255 }),
  playerId: int("playerId"),
  coachId: int("coachId"),
  isAllPlayers: boolean("isAllPlayers").default(false),
  color: varchar("color", { length: 20 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ============ AWARDS TABLE ============
export const awards = mysqlTable("awards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["training", "match", "discipline", "improvement", "special"]).default("training").notNull(),
  icon: varchar("icon", { length: 50 }).default("star"),
  badgeColor: varchar("badgeColor", { length: 20 }).default("#FFD700"),
  criteria: text("criteria"),
  autoAward: boolean("autoAward").default(false),
  autoCondition: varchar("autoCondition", { length: 100 }),
  autoThreshold: int("autoThreshold"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Award = typeof awards.$inferSelect;
export type InsertAward = typeof awards.$inferInsert;

// ============ PLAYER AWARDS TABLE ============
export const playerAwards = mysqlTable("player_awards", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  awardId: int("awardId").notNull(),
  awardedBy: int("awardedBy"),
  awardedDate: date("awardedDate").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlayerAward = typeof playerAwards.$inferSelect;
export type InsertPlayerAward = typeof playerAwards.$inferInsert;

// ============ COACHING SESSIONS TABLE (Coach Compensation) ============
export const coachingSessions = mysqlTable("coaching_sessions", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  sessionDate: date("sessionDate").notNull(),
  startTime: varchar("startTime", { length: 10 }).notNull(),
  endTime: varchar("endTime", { length: 10 }).notNull(),
  hours: float("hours").notNull(),
  sessionType: mysqlEnum("sessionType", ["private", "group", "camp", "match_coaching", "other"]).default("group").notNull(),
  content: text("content"),
  playerIds: text("playerIds"),
  ratePerHour: float("ratePerHour"),
  totalAmount: float("totalAmount"),
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = typeof coachingSessions.$inferInsert;

// ============ VIDEO ANALYSIS TABLE ============
export const videoAnalysis = mysqlTable("video_analysis", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  uploadedBy: int("uploadedBy").notNull(),
  playerId: int("playerId"),
  coachId: int("coachId"),
  matchId: int("matchId"),
  duration: int("duration"), // in seconds
  uploadDate: date("uploadDate").notNull(),
  category: mysqlEnum("category", ["training", "match", "technique", "analysis", "other"]).default("training").notNull(),
  tags: text("tags"), // comma-separated
  isPublic: boolean("isPublic").default(false),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VideoAnalysis = typeof videoAnalysis.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalysis.$inferInsert;

// ============ VIDEO ANNOTATIONS TABLE ============
export const videoAnnotations = mysqlTable("video_annotations", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  createdBy: int("createdBy").notNull(),
  timestamp: int("timestamp").notNull(), // in seconds
  annotationType: mysqlEnum("annotationType", ["line", "circle", "rectangle", "text", "arrow"]).default("text").notNull(),
  content: text("content"),
  color: varchar("color", { length: 20 }).default("#FF0000"),
  x: float("x"),
  y: float("y"),
  width: float("width"),
  height: float("height"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VideoAnnotation = typeof videoAnnotations.$inferSelect;
export type InsertVideoAnnotation = typeof videoAnnotations.$inferInsert;

// ============ PLAYER STATISTICS TABLE ============
export const playerStatistics = mysqlTable("player_statistics", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  statisticDate: date("statisticDate").notNull(),
  performanceScore: float("performanceScore"), // 0-100
  readinessScore: float("readinessScore"), // 0-100
  injuryRiskScore: float("injuryRiskScore"), // 0-100 (higher = more risk)
  burnoutRiskScore: float("burnoutRiskScore"), // 0-100
  plateauRiskScore: float("plateauRiskScore"), // 0-100
  trainingHours: float("trainingHours"),
  matchesPlayed: int("matchesPlayed"),
  winPercentage: float("winPercentage"),
  averageServeSpeed: float("averageServeSpeed"),
  breakPointConversion: float("breakPointConversion"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlayerStatistic = typeof playerStatistics.$inferSelect;
export type InsertPlayerStatistic = typeof playerStatistics.$inferInsert;

// ============ INTEGRATION SETTINGS TABLE ============
export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").autoincrement().primaryKey(),
  academyId: int("academyId"),
  googleCalendarEnabled: boolean("googleCalendarEnabled").default(false),
  googleCalendarToken: text("googleCalendarToken"),
  lineNotificationsEnabled: boolean("lineNotificationsEnabled").default(false),
  lineChannelAccessToken: text("lineChannelAccessToken"),
  lineGroupId: varchar("lineGroupId", { length: 255 }),
  paymentGatewayEnabled: boolean("paymentGatewayEnabled").default(false),
  paymentProvider: mysqlEnum("paymentProvider", ["stripe", "omise", "paypal"]).default("stripe"),
  paymentApiKey: text("paymentApiKey"),
  paymentSecretKey: text("paymentSecretKey"),
  webhookUrl: text("webhookUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSetting = typeof integrationSettings.$inferInsert;

// ============ PAYMENT TRANSACTIONS TABLE ============
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  coachId: int("coachId").notNull(),
  amount: float("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("THB"),
  transactionType: mysqlEnum("transactionType", ["coaching_compensation", "bonus", "refund"]).default("coaching_compensation").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  transactionId: varchar("transactionId", { length: 255 }),
  month: varchar("month", { length: 7 }), // YYYY-MM
  approvedBy: int("approvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;


// ============ SEARCH HISTORY TABLE ============
export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  searchQuery: varchar("searchQuery", { length: 255 }).notNull(),
  searchType: mysqlEnum("searchType", ["player", "report", "coach", "match", "award"]).notNull(),
  filters: text("filters"), // JSON string
  resultsCount: int("resultsCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

// ============ NOTIFICATIONS TABLE ============
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipientRole: mysqlEnum("recipientRole", ["player", "coach", "head_coach", "admin"]).notNull(),
  notificationType: mysqlEnum("notificationType", [
    "high_risk_player",
    "upcoming_match",
    "coach_compensation",
    "evaluation_due",
    "checkin_reminder",
    "award_received",
    "system_alert",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedPlayerId: int("relatedPlayerId"),
  relatedCoachId: int("relatedCoachId"),
  relatedMatchId: int("relatedMatchId"),
  relatedTransactionId: int("relatedTransactionId"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  isRead: boolean("isRead").default(false),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


// ============ EMAIL LOGIN TABLE ============
export const emailLogins = mysqlTable("email_logins", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 255 }),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  lastLoginAt: timestamp("lastLoginAt"),
  loginAttempts: int("loginAttempts").default(0).notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLogin = typeof emailLogins.$inferSelect;
export type InsertEmailLogin = typeof emailLogins.$inferInsert;

// ============ ACCESS LOGS TABLE (for tracking all user access) ============
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId"),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 100 }),
  role: mysqlEnum("role", ["player", "coach", "head_coach", "admin"]),
  loginMethod: varchar("loginMethod", { length: 50 }).notNull(), // "email", "username", "oauth"
  action: mysqlEnum("action", [
    "login_success",
    "login_failed",
    "logout",
    "login_attempt_failed",
    "account_locked",
    "password_reset_requested",
    "password_reset_completed",
    "email_verified",
    "account_created",
  ]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  deviceInfo: text("deviceInfo"), // JSON string with device details
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  failureReason: varchar("failureReason", { length: 255 }),
  sessionId: varchar("sessionId", { length: 255 }),
  duration: int("duration"), // session duration in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;


// ============ TWO-FACTOR AUTHENTICATION (2FA) TABLES ============
export const twoFactorSettings = mysqlTable("two_factor_settings", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().unique(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  totpSecret: varchar("totpSecret", { length: 255 }),
  backupCodes: text("backupCodes"), // JSON array of backup codes
  usedBackupCodes: text("usedBackupCodes"), // JSON array of used backup codes
  enabledAt: timestamp("enabledAt"),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorSettings = typeof twoFactorSettings.$inferSelect;
export type InsertTwoFactorSettings = typeof twoFactorSettings.$inferInsert;

// ============ 2FA VERIFICATION LOGS ============
export const twoFactorLogs = mysqlTable("two_factor_logs", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  email: varchar("email", { length: 320 }),
  action: mysqlEnum("action", [
    "2fa_enabled",
    "2fa_disabled",
    "2fa_verified",
    "2fa_failed",
    "backup_code_used",
  ]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  failureReason: varchar("failureReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TwoFactorLog = typeof twoFactorLogs.$inferSelect;
export type InsertTwoFactorLog = typeof twoFactorLogs.$inferInsert;
