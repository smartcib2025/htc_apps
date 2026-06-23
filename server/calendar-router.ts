import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { calendarEvents, eventParticipants, eventReminders } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Calendar Event Management Router
 */
export const calendarRouter = router({
  /**
   * Create a new calendar event
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        eventType: z.enum(["training", "match", "tournament", "meeting", "rest", "other"]),
        eventDate: z.string(), // YYYY-MM-DD
        startTime: z.string().optional(), // HH:MM
        endTime: z.string().optional(), // HH:MM
        location: z.string().optional(),
        playerId: z.number().optional(),
        coachId: z.number().optional(),
        isAllPlayers: z.boolean().default(false),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create event
      const result = await db.insert(calendarEvents).values({
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        eventDate: new Date(input.eventDate),
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        playerId: input.playerId,
        coachId: input.coachId,
        isAllPlayers: input.isAllPlayers ? 1 : 0,
        color: input.color || "#0a7ea4",
        createdBy: ctx.user?.id,
      } as any);

      return { success: true, eventId: (result as any)[0]?.insertId };
    }),

  /**
   * Get all events for a date range
   */
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        playerId: z.number().optional(),
        coachId: z.number().optional(),
        eventType: z.enum(["training", "match", "tournament", "meeting", "rest", "other"]).optional(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      let query = (db.select().from(calendarEvents) as any);

      // Filter by date range
      query = query.where(
        and(
          gte(calendarEvents.eventDate as any, startDate),
          lte(calendarEvents.eventDate as any, endDate)
        ) as any
      );

      // Filter by playerId if provided
      if (input.playerId) {
        query = query.where(eq(calendarEvents.playerId as any, input.playerId));
      }

      // Filter by coachId if provided
      if (input.coachId) {
        query = query.where(eq(calendarEvents.coachId as any, input.coachId));
      }

      // Filter by eventType if provided
      if (input.eventType) {
        query = query.where(eq(calendarEvents.eventType as any, input.eventType));
      }

      const events = await query;

      // Get participants for each event
      const eventsWithParticipants = await Promise.all(
        events.map(async (event: any) => {
          const participants = await db
            .select()
            .from(eventParticipants)
            .where(eq(eventParticipants.eventId as any, event.id));

          return {
            ...event,
            participants,
          };
        })
      );

      return eventsWithParticipants;
    }),

  /**
   * Get a specific event by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const event = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id as any, input.id))
        .limit(1);

      if (!event[0]) {
        throw new Error("Event not found");
      }

      // Get participants
      const participants = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId as any, input.id));

      // Get reminders
      const reminders = await db
        .select()
        .from(eventReminders)
        .where(eq(eventReminders.eventId as any, input.id));

      return {
        ...event[0],
        participants,
        reminders,
      };
    }),

  /**
   * Update an event
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(["training", "match", "tournament", "meeting", "rest", "other"]).optional(),
        eventDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        playerId: z.number().optional(),
        coachId: z.number().optional(),
        isAllPlayers: z.boolean().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, any> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.eventDate !== undefined) updateData.eventDate = new Date(input.eventDate);
      if (input.startTime !== undefined) updateData.startTime = input.startTime;
      if (input.endTime !== undefined) updateData.endTime = input.endTime;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.playerId !== undefined) updateData.playerId = input.playerId;
      if (input.coachId !== undefined) updateData.coachId = input.coachId;
      if (input.isAllPlayers !== undefined) updateData.isAllPlayers = input.isAllPlayers ? 1 : 0;
      if (input.color !== undefined) updateData.color = input.color;

      updateData.updatedAt = new Date();

      await (db
        .update(calendarEvents)
        .set(updateData)
        .where(eq(calendarEvents.id as any, input.id)) as any);

      return { success: true };
    }),

  /**
   * Delete an event
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete participants
      await (db
        .delete(eventParticipants)
        .where(eq(eventParticipants.eventId as any, input.id)) as any);

      // Delete reminders
      await (db
        .delete(eventReminders)
        .where(eq(eventReminders.eventId as any, input.id)) as any);

      // Delete event
      await (db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id as any, input.id)) as any);

      return { success: true };
    }),

  /**
   * Get events by month
   */
  byMonth: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        playerId: z.number().optional(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      let query = (db.select().from(calendarEvents) as any);

      query = query.where(
        and(
          gte(calendarEvents.eventDate as any, startDate),
          lte(calendarEvents.eventDate as any, endDate)
        ) as any
      );

      if (input.playerId) {
        query = query.where(eq(calendarEvents.playerId as any, input.playerId));
      }

      const events = await query;

      // Group events by date
      const eventsByDate: Record<string, any[]> = {};
      events.forEach((event: any) => {
        const dateStr = event.eventDate.toISOString().split("T")[0];
        if (!eventsByDate[dateStr]) {
          eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push(event);
      });

      return eventsByDate;
    }),

  /**
   * Get upcoming events
   */
  upcoming: protectedProcedure
    .input(
      z.object({
        playerId: z.number().optional(),
        coachId: z.number().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = (db.select().from(calendarEvents) as any);

      query = query.where(gte(calendarEvents.eventDate as any, today));

      if (input.playerId) {
        query = query.where(eq(calendarEvents.playerId as any, input.playerId));
      }

      if (input.coachId) {
        query = query.where(eq(calendarEvents.coachId as any, input.coachId));
      }

      const events = await query.limit(input.limit);

      return events;
    }),

  /**
   * Set event reminder
   */
  setReminder: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        userId: z.number(),
        reminderType: z.enum(["email", "push", "sms"]),
        minutesBefore: z.number().default(15),
      })
    )
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(eventReminders).values({
        eventId: input.eventId,
        userId: input.userId,
        reminderType: input.reminderType,
        minutesBefore: input.minutesBefore,
        sent: 0,
      } as any);

      return { success: true };
    }),
});
