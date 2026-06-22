import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { emailAuthRouter } from "./email-auth-router";
import { twoFARouter } from "./2fa-router";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  emailAuth: emailAuthRouter,
  twoFA: twoFARouter,

  // ============ PLAYERS ============
  players: router({
    all: publicProcedure.query(() => db.getAllPlayers()),
    list: publicProcedure.query(() => db.getAllPlayers()),
    byCoach: publicProcedure.input(z.object({ coachId: z.number() })).query(({ input }) => db.getPlayersByCoach(input.coachId)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getPlayerById(input.id)),
    byUserId: publicProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getPlayerByUserId(input.userId)),
    create: publicProcedure.input(z.object({
      name: z.string().min(1).max(255),
      level: z.string().optional(),
      program: z.string().optional(),
      coachId: z.number().optional(),
      phone: z.string().optional(),
      emergencyContact: z.string().optional(),
      dateOfBirth: z.string().optional(),
      userId: z.number().optional(),
      status: z.enum(["active", "inactive", "injured"]).optional(),
    })).mutation(({ input }) => db.createPlayer(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      level: z.string().optional(),
      program: z.string().optional(),
      coachId: z.number().optional(),
      phone: z.string().optional(),
      emergencyContact: z.string().optional(),
      status: z.enum(["active", "inactive", "injured"]).optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updatePlayer(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePlayer(input.id)),
    performance: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getPlayerPerformanceSummary(input.playerId)),
  }),

  // ============ COACHES ============
  coaches: router({
    all: publicProcedure.query(() => db.getAllCoaches()),
    list: publicProcedure.query(() => db.getAllCoaches()),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getCoachById(input.id)),
    byUserId: publicProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getCoachByUserId(input.userId)),
    create: publicProcedure.input(z.object({
      name: z.string().min(1).max(255),
      coachRole: z.enum(["coach", "head_coach", "admin"]).optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      userId: z.number().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })).mutation(({ input }) => db.createCoach(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      coachRole: z.enum(["coach", "head_coach", "admin"]).optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateCoach(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCoach(input.id)),
  }),

  // ============ DAILY CHECK-INS ============
  checkins: router({
    byPlayer: publicProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getCheckinsByPlayer(input.playerId, input.limit)),
    byDate: publicProcedure.input(z.object({ playerId: z.number(), date: z.string() })).query(({ input }) => db.getCheckinByDate(input.playerId, input.date)),
    today: publicProcedure.input(z.object({ date: z.string() })).query(({ input }) => db.getAllCheckinsToday(input.date)),
    create: publicProcedure.input(z.object({
      playerId: z.number(),
      checkinDate: z.string(),
      trainingHours: z.number().optional(),
      fatigue: z.number().min(1).max(10).optional(),
      confidence: z.number().min(1).max(10).optional(),
      stress: z.number().min(1).max(10).optional(),
      injuryStatus: z.boolean().optional(),
      injuryDescription: z.string().optional(),
      strengthFeeling: z.string().optional(),
      weaknessFeeling: z.string().optional(),
      nextGoal: z.string().optional(),
      mode: z.enum(["weekly", "monthly", "tournament"]).optional(),
    })).mutation(({ input }) => db.createCheckin(input as any)),
  }),

  // ============ COACH EVALUATIONS ============
  evaluations: router({
    byPlayer: publicProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getEvalsByPlayer(input.playerId, input.limit)),
    byCoach: publicProcedure.input(z.object({ coachId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getEvalsByCoach(input.coachId, input.limit)),
    latest: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getLatestEvalForPlayer(input.playerId)),
    create: publicProcedure.input(z.object({
      playerId: z.number(),
      coachId: z.number(),
      technique: z.number().min(1).max(10).optional(),
      fitness: z.number().min(1).max(10).optional(),
      tactics: z.number().min(1).max(10).optional(),
      mental: z.number().min(1).max(10).optional(),
      discipline: z.number().min(1).max(10).optional(),
      matchIQ: z.number().min(1).max(10).optional(),
      strengthNote: z.string().optional(),
      weaknessNote: z.string().optional(),
      coachComment: z.string().optional(),
      evalType: z.enum(["weekly", "monthly", "tournament"]).optional(),
      evalDate: z.string(),
    })).mutation(({ input }) => db.createEvaluation(input as any)),
  }),

  // ============ MATCH STATS ============
  matches: router({
    byPlayer: publicProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getMatchesByPlayer(input.playerId, input.limit)),
    all: publicProcedure.input(z.object({ limit: z.number().optional() })).query(({ input }) => db.getAllMatches(input.limit)),
    create: publicProcedure.input(z.object({
      playerId: z.number(),
      matchDate: z.string(),
      opponent: z.string().optional(),
      tournament: z.string().optional(),
      servePercent: z.number().optional(),
      winners: z.number().optional(),
      unforcedErrors: z.number().optional(),
      result: z.enum(["win", "loss"]).optional(),
      score: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => db.createMatch(input as any)),
  }),

  // ============ AI REPORTS ============
  reports: router({
    byId: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getReportById(input.id)),
    byPlayer: publicProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getReportsByPlayer(input.playerId, input.limit)),
    latest: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getLatestReportForPlayer(input.playerId)),
    create: publicProcedure.input(z.object({
      playerId: z.number(),
      reportType: z.enum(["weekly", "monthly", "tournament"]).optional(),
      summary: z.string().optional(),
      strengths: z.string().optional(),
      weaknesses: z.string().optional(),
      actionPlan: z.string().optional(),
      goals: z.string().optional(),
      performanceIndex: z.number().optional(),
      readinessIndex: z.number().optional(),
      peakIndex: z.number().optional(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
      riskType: z.string().optional(),
    })).mutation(({ input }) => db.createReport(input as any)),
  }),

  // ============ COACH NOTES ============
  notes: router({
    byCoach: publicProcedure.input(z.object({ coachId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getNotesByCoach(input.coachId, input.limit)),
    byPlayer: publicProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getNotesByPlayer(input.playerId, input.limit)),
    create: publicProcedure.input(z.object({
      coachId: z.number(),
      playerId: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      noteDate: z.string(),
    })).mutation(({ input }) => db.createNote(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateNote(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteNote(input.id)),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: publicProcedure.query(() => db.getDashboardStats()),
    playerPerformance: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getPlayerPerformanceSummary(input.playerId)),
  }),

  // ============ ACADEMY SETTINGS ============
  settings: router({
    all: publicProcedure.query(() => db.getAllSettings()),
    get: publicProcedure.input(z.object({ key: z.string() })).query(({ input }) => db.getSetting(input.key)),
    set: publicProcedure.input(z.object({ key: z.string(), value: z.string() })).mutation(({ input }) => db.setSetting(input.key, input.value)),
  }),

  // ============ USER ACCOUNTS (LOGIN) ============
  accounts: router({
    login: publicProcedure.input(z.object({ username: z.string(), password: z.string() })).mutation(async ({ input }) => {
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(input.password).digest("hex");
      const account = await db.getUserAccountByUsername(input.username);
      if (!account || account.passwordHash !== hash || !account.isActive) {
        return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
      }
      await db.updateLastLogin(account.id);
      await db.createAuditLog({ userId: account.id, username: account.username, action: "login", entity: "user_accounts", details: `User ${account.username} logged in` });
      return { success: true, account: { id: account.id, username: account.username, role: account.role, displayName: account.displayName, playerId: account.playerId, coachId: account.coachId } };
    }),
    all: publicProcedure.query(() => db.getAllUserAccounts()),
    create: publicProcedure.input(z.object({
      username: z.string().min(3).max(100),
      password: z.string().min(4),
      role: z.enum(["player", "coach", "head_coach", "admin"]),
      playerId: z.number().optional(),
      coachId: z.number().optional(),
      displayName: z.string().optional(),
    })).mutation(async ({ input }) => {
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(input.password).digest("hex");
      const { password, ...rest } = input;
      return db.createUserAccount({ ...rest, passwordHash: hash } as any);
    }),
    update: publicProcedure.input(z.object({
      id: z.number(),
      displayName: z.string().optional(),
      role: z.enum(["player", "coach", "head_coach", "admin"]).optional(),
      isActive: z.boolean().optional(),
      password: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, password, ...data } = input;
      const updateData: any = { ...data };
      if (password) {
        const crypto = await import("crypto");
        updateData.passwordHash = crypto.createHash("sha256").update(password).digest("hex");
      }
      return db.updateUserAccount(id, updateData);
    }),
  }),

  // ============ AUDIT LOGS ============
  auditLogs: router({
    all: publicProcedure.input(z.object({ limit: z.number().optional() })).query(({ input }) => db.getAuditLogs(input.limit)),
    byUser: publicProcedure.input(z.object({ userId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getAuditLogsByUser(input.userId, input.limit)),
    byAction: publicProcedure.input(z.object({ action: z.string(), limit: z.number().optional() })).query(({ input }) => db.getAuditLogsByAction(input.action, input.limit)),
    create: publicProcedure.input(z.object({
      userId: z.number().optional(),
      username: z.string().optional(),
      action: z.string(),
      entity: z.string().optional(),
      entityId: z.number().optional(),
      details: z.string().optional(),
    })).mutation(({ input }) => db.createAuditLog(input as any)),
  }),

  // ============ CALENDAR EVENTS ============
  calendar: router({
    byMonth: publicProcedure.input(z.object({ year: z.number(), month: z.number() })).query(({ input }) => db.getCalendarEventsByMonth(input.year, input.month)),
    byDate: publicProcedure.input(z.object({ date: z.string() })).query(({ input }) => db.getCalendarEventsByDate(input.date)),
    create: publicProcedure.input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      eventType: z.enum(["training", "match", "tournament", "meeting", "rest", "other"]),
      eventDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      playerId: z.number().optional(),
      coachId: z.number().optional(),
      isAllPlayers: z.boolean().optional(),
      color: z.string().optional(),
      createdBy: z.number().optional(),
    })).mutation(({ input }) => db.createCalendarEvent(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      eventType: z.enum(["training", "match", "tournament", "meeting", "rest", "other"]).optional(),
      eventDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      color: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateCalendarEvent(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCalendarEvent(input.id)),
  }),

  // ============ AWARDS ============
  awards: router({
    all: publicProcedure.query(() => db.getAllAwards()),
    create: publicProcedure.input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      category: z.enum(["training", "match", "discipline", "improvement", "special"]),
      icon: z.string().optional(),
      badgeColor: z.string().optional(),
      criteria: z.string().optional(),
      autoAward: z.boolean().optional(),
      autoCondition: z.string().optional(),
      autoThreshold: z.number().optional(),
    })).mutation(({ input }) => db.createAward(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(["training", "match", "discipline", "improvement", "special"]).optional(),
      icon: z.string().optional(),
      badgeColor: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateAward(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteAward(input.id)),
    playerAwards: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getPlayerAwardsByPlayer(input.playerId)),
    allPlayerAwards: publicProcedure.query(() => db.getAllPlayerAwards()),
    grant: publicProcedure.input(z.object({
      playerId: z.number(),
      awardId: z.number(),
      awardedBy: z.number().optional(),
      awardedDate: z.string(),
      note: z.string().optional(),
    })).mutation(({ input }) => db.grantAward(input as any)),
    revoke: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.revokeAward(input.id)),
  }),

  // ============ COACHING SESSIONS (COMPENSATION) ============
  coachingSessions: router({
    byCoach: publicProcedure.input(z.object({ coachId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getCoachingSessionsByCoach(input.coachId, input.limit)),
    byMonth: publicProcedure.input(z.object({ coachId: z.number(), year: z.number(), month: z.number() })).query(({ input }) => db.getCoachingSessionsByMonth(input.coachId, input.year, input.month)),
    allByMonth: publicProcedure.input(z.object({ year: z.number(), month: z.number() })).query(({ input }) => db.getAllCoachingSessionsByMonth(input.year, input.month)),
    create: publicProcedure.input(z.object({
      coachId: z.number(),
      sessionDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      hours: z.number(),
      sessionType: z.enum(["private", "group", "camp", "match_coaching", "other"]),
      content: z.string().optional(),
      playerIds: z.string().optional(),
      ratePerHour: z.number().optional(),
      totalAmount: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => db.createCoachingSession(input as any)),
    update: publicProcedure.input(z.object({
      id: z.number(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      hours: z.number().optional(),
      sessionType: z.enum(["private", "group", "camp", "match_coaching", "other"]).optional(),
      content: z.string().optional(),
      ratePerHour: z.number().optional(),
      totalAmount: z.number().optional(),
      status: z.enum(["pending", "approved", "paid"]).optional(),
      approvedBy: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateCoachingSession(id, data as any);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCoachingSession(input.id)),
    compensation: publicProcedure.input(z.object({ coachId: z.number(), year: z.number(), month: z.number() })).query(({ input }) => db.getExportCoachCompensation(input.coachId, input.year, input.month)),
  }),

  // ============ VIDEO ANALYSIS ============
  videos: router({
    list: publicProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() })).query(({ input }) => db.getVideoAnalysisList(input.limit, input.offset)),
    byId: publicProcedure.input(z.object({ videoId: z.number() })).query(({ input }) => db.getVideoById(input.videoId)),
    create: publicProcedure.input(z.object({ title: z.string(), description: z.string().optional(), videoUrl: z.string(), uploadedBy: z.number(), playerId: z.number().optional(), coachId: z.number().optional(), category: z.enum(["training", "match", "technique", "analysis", "other"]).optional(), tags: z.string().optional() })).mutation(({ input }) => db.createVideoAnalysis({ ...input, uploadDate: new Date() } as any)),
    updateViewCount: publicProcedure.input(z.object({ videoId: z.number() })).mutation(({ input }) => db.updateVideoViewCount(input.videoId)),
  }),

  annotations: router({
    list: publicProcedure.input(z.object({ videoId: z.number() })).query(({ input }) => db.getVideoAnnotations(input.videoId)),
    create: publicProcedure.input(z.object({ videoId: z.number(), createdBy: z.number(), timestamp: z.number(), annotationType: z.enum(["line", "circle", "rectangle", "text", "arrow"]), content: z.string().optional(), color: z.string().optional(), x: z.number().optional(), y: z.number().optional(), width: z.number().optional(), height: z.number().optional() })).mutation(({ input }) => db.createVideoAnnotation(input as any)),
  }),

  // ============ STATISTICS & ANALYTICS ============
  statistics: router({
    trend: publicProcedure.input(z.object({ playerId: z.number(), days: z.number().optional() })).query(({ input }) => db.getPlayerStatisticsTrend(input.playerId, input.days)),
    latest: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getLatestPlayerStatistic(input.playerId)),
    highRisk: publicProcedure.input(z.object({ threshold: z.number().optional() })).query(({ input }) => db.getHighRiskPlayers(input.threshold)),
    create: publicProcedure.input(z.object({ playerId: z.number(), performanceScore: z.number().optional(), readinessScore: z.number().optional(), injuryRiskScore: z.number().optional(), burnoutRiskScore: z.number().optional(), plateauRiskScore: z.number().optional(), trainingHours: z.number().optional(), matchesPlayed: z.number().optional(), winPercentage: z.number().optional() })).mutation(({ input }) => db.createPlayerStatistic({ ...input, statisticDate: new Date() } as any)),
  }),

  // ============ INTEGRATION SETTINGS ============
  integration: router({
    settings: publicProcedure.input(z.object({ academyId: z.number().optional() })).query(({ input }) => db.getIntegrationSettings(input.academyId)),
    updateSettings: publicProcedure.input(z.object({ googleCalendarEnabled: z.boolean().optional(), lineNotificationsEnabled: z.boolean().optional(), paymentGatewayEnabled: z.boolean().optional(), paymentProvider: z.enum(["stripe", "omise", "paypal"]).optional(), academyId: z.number().optional() })).mutation(({ input }) => db.updateIntegrationSettings(input as any, input.academyId)),
  }),

  // ============ PAYMENT TRANSACTIONS ============
  payments: router({
    coachTransactions: publicProcedure.input(z.object({ coachId: z.number(), month: z.string().optional() })).query(({ input }) => db.getCoachPaymentTransactions(input.coachId, input.month)),
    monthlyReport: publicProcedure.input(z.object({ month: z.string() })).query(({ input }) => db.getMonthlyCompensationReport(input.month)),
    create: publicProcedure.input(z.object({ coachId: z.number(), amount: z.number(), transactionType: z.enum(["coaching_compensation", "bonus", "refund"]), month: z.string() })).mutation(({ input }) => db.createPaymentTransaction({ ...input, status: "pending" } as any)),
    updateStatus: publicProcedure.input(z.object({ transactionId: z.number(), status: z.enum(["pending", "processing", "completed", "failed"]), approvedBy: z.number().optional() })).mutation(({ input }) => db.updatePaymentTransactionStatus(input.transactionId, input.status, input.approvedBy)),
  }),

  // ============ EXPORT DATA ============
  export: router({
    playerSummary: publicProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getExportPlayerSummary(input.playerId)),
    attendance: publicProcedure.input(z.object({ year: z.number(), month: z.number() })).query(({ input }) => db.getExportAttendanceReport(input.year, input.month)),
    coachCompensation: publicProcedure.input(z.object({ coachId: z.number(), year: z.number(), month: z.number() })).query(({ input }) => db.getExportCoachCompensation(input.coachId, input.year, input.month)),
  }),

  // ============ SEARCH & FILTERING ============
  search: router({
    players: publicProcedure.input(z.object({ query: z.string(), filters: z.object({ level: z.string().optional(), status: z.enum(["active", "inactive", "injured"]).optional(), program: z.string().optional() }).optional() })).query(({ input }) => db.searchPlayers(input.query, input.filters)),
    history: publicProcedure.input(z.object({ userId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getSearchHistory(input.userId, input.limit)),
    addToHistory: publicProcedure.input(z.object({ userId: z.number(), searchQuery: z.string(), searchType: z.enum(["player", "report", "coach", "match", "award"]), filters: z.string().optional(), resultsCount: z.number().optional() })).mutation(({ input }) => db.addSearchHistory(input as any)),
  }),

  // ============ NOTIFICATIONS ============
  notifications: router({
    list: publicProcedure.input(z.object({ userId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getNotifications(input.userId, input.limit)),
    unread: publicProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getUnreadNotifications(input.userId)),
    create: publicProcedure.input(z.object({ userId: z.number(), recipientRole: z.enum(["player", "coach", "head_coach", "admin"]), notificationType: z.enum(["high_risk_player", "upcoming_match", "coach_compensation", "evaluation_due", "checkin_reminder", "award_received", "system_alert"]), title: z.string(), message: z.string(), priority: z.enum(["low", "medium", "high", "critical"]).optional(), relatedPlayerId: z.number().optional(), relatedCoachId: z.number().optional(), relatedMatchId: z.number().optional() })).mutation(({ input }) => db.createNotification(input as any)),
    markAsRead: publicProcedure.input(z.object({ notificationId: z.number() })).mutation(({ input }) => db.markNotificationAsRead(input.notificationId)),
    highRiskAlerts: publicProcedure.input(z.object({ academyId: z.number() })).query(({ input }) => db.getHighRiskPlayerNotifications(input.academyId)),
    upcomingMatches: publicProcedure.input(z.object({ coachId: z.number() })).query(({ input }) => db.getUpcomingMatchNotifications(input.coachId)),
    compensationAlerts: publicProcedure.input(z.object({ headCoachId: z.number() })).query(({ input }) => db.getCoachCompensationNotifications(input.headCoachId)),
  }),
});

export type AppRouter = typeof appRouter;
