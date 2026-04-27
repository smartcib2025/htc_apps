import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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

  // ============ PLAYERS ============
  players: router({
    list: protectedProcedure.query(() => db.getAllPlayers()),
    byCoach: protectedProcedure.input(z.object({ coachId: z.number() })).query(({ input }) => db.getPlayersByCoach(input.coachId)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getPlayerById(input.id)),
    byUserId: protectedProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getPlayerByUserId(input.userId)),
    myProfile: protectedProcedure.query(({ ctx }) => db.getPlayerByUserId(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255),
      level: z.string().optional(),
      program: z.string().optional(),
      coachId: z.number().optional(),
      phone: z.string().optional(),
      emergencyContact: z.string().optional(),
      dateOfBirth: z.string().optional(),
      userId: z.number().optional(),
    })).mutation(({ input }) => db.createPlayer(input as any)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      level: z.string().optional(),
      program: z.string().optional(),
      coachId: z.number().optional(),
      phone: z.string().optional(),
      status: z.enum(["active", "inactive", "injured"]).optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updatePlayer(id, data as any);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePlayer(input.id)),
    performance: protectedProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getPlayerPerformanceSummary(input.playerId)),
  }),

  // ============ COACHES ============
  coaches: router({
    list: protectedProcedure.query(() => db.getAllCoaches()),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getCoachById(input.id)),
    byUserId: protectedProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getCoachByUserId(input.userId)),
    myProfile: protectedProcedure.query(({ ctx }) => db.getCoachByUserId(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255),
      coachRole: z.enum(["coach", "head_coach", "admin"]).optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      userId: z.number().optional(),
    })).mutation(({ input }) => db.createCoach(input as any)),
    update: protectedProcedure.input(z.object({
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
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCoach(input.id)),
  }),

  // ============ DAILY CHECK-INS ============
  checkins: router({
    byPlayer: protectedProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getCheckinsByPlayer(input.playerId, input.limit)),
    byDate: protectedProcedure.input(z.object({ playerId: z.number(), date: z.string() })).query(({ input }) => db.getCheckinByDate(input.playerId, input.date)),
    today: protectedProcedure.input(z.object({ date: z.string() })).query(({ input }) => db.getAllCheckinsToday(input.date)),
    create: protectedProcedure.input(z.object({
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
    byPlayer: protectedProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getEvalsByPlayer(input.playerId, input.limit)),
    byCoach: protectedProcedure.input(z.object({ coachId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getEvalsByCoach(input.coachId, input.limit)),
    latest: protectedProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getLatestEvalForPlayer(input.playerId)),
    create: protectedProcedure.input(z.object({
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
    byPlayer: protectedProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getMatchesByPlayer(input.playerId, input.limit)),
    all: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(({ input }) => db.getAllMatches(input.limit)),
    create: protectedProcedure.input(z.object({
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
    byPlayer: protectedProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getReportsByPlayer(input.playerId, input.limit)),
    latest: protectedProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getLatestReportForPlayer(input.playerId)),
    create: protectedProcedure.input(z.object({
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
    byCoach: protectedProcedure.input(z.object({ coachId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getNotesByCoach(input.coachId, input.limit)),
    byPlayer: protectedProcedure.input(z.object({ playerId: z.number(), limit: z.number().optional() })).query(({ input }) => db.getNotesByPlayer(input.playerId, input.limit)),
    create: protectedProcedure.input(z.object({
      coachId: z.number(),
      playerId: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      noteDate: z.string(),
    })).mutation(({ input }) => db.createNote(input as any)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateNote(id, data as any);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteNote(input.id)),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(() => db.getDashboardStats()),
    playerPerformance: protectedProcedure.input(z.object({ playerId: z.number() })).query(({ input }) => db.getPlayerPerformanceSummary(input.playerId)),
  }),
});

export type AppRouter = typeof appRouter;
