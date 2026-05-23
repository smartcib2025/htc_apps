import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("Seeding new tables...");

  // ============ USER ACCOUNTS ============
  const existingAccounts = await db.select().from(schema.userAccounts).limit(1);
  if (existingAccounts.length === 0) {
    await db.insert(schema.userAccounts).values([
      { username: "admin", passwordHash: hashPassword("admin123"), role: "admin", displayName: "ผู้ดูแลระบบ", isActive: true } as any,
      { username: "headcoach", passwordHash: hashPassword("coach123"), role: "head_coach", coachId: 1, displayName: "โค้ชวิชัย (Head)", isActive: true } as any,
      { username: "coach1", passwordHash: hashPassword("coach123"), role: "coach", coachId: 2, displayName: "โค้ชสมศรี", isActive: true } as any,
      { username: "coach2", passwordHash: hashPassword("coach123"), role: "coach", coachId: 3, displayName: "โค้ชอนันต์", isActive: true } as any,
      { username: "player1", passwordHash: hashPassword("player123"), role: "player", playerId: 1, displayName: "สมชาย ใจดี", isActive: true } as any,
      { username: "player2", passwordHash: hashPassword("player123"), role: "player", playerId: 2, displayName: "สมหญิง รักเทนนิส", isActive: true } as any,
      { username: "player3", passwordHash: hashPassword("player123"), role: "player", playerId: 3, displayName: "วิชัย เก่งกาจ", isActive: true } as any,
      { username: "player4", passwordHash: hashPassword("player123"), role: "player", playerId: 4, displayName: "นภา สดใส", isActive: true } as any,
    ]);
    console.log("✓ User accounts seeded");
  }

  // ============ AUDIT LOGS ============
  const existingLogs = await db.select().from(schema.auditLogs).limit(1);
  if (existingLogs.length === 0) {
    await db.insert(schema.auditLogs).values([
      { userId: 1, username: "admin", action: "login", entity: "user_accounts", details: "Admin logged in" },
      { userId: 2, username: "headcoach", action: "login", entity: "user_accounts", details: "Head Coach logged in" },
      { userId: 1, username: "admin", action: "create_player", entity: "players", entityId: 1, details: "Created player สมชาย ใจดี" },
      { userId: 2, username: "headcoach", action: "create_evaluation", entity: "coach_evaluations", entityId: 1, details: "Evaluated player สมชาย ใจดี" },
      { userId: 1, username: "admin", action: "update_settings", entity: "academy_settings", details: "Updated academy name" },
    ]);
    console.log("✓ Audit logs seeded");
  }

  // ============ CALENDAR EVENTS ============
  const existingEvents = await db.select().from(schema.calendarEvents).limit(1);
  if (existingEvents.length === 0) {
    const today = new Date();
    const events = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i - 5);
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) {
        events.push({ title: "วันพักผ่อน", eventType: "rest" as const, eventDate: dateStr, isAllPlayers: true, color: "#9E9E9E" });
      } else if (dayOfWeek === 6) {
        events.push({ title: "แข่งขันภายใน", eventType: "match" as const, eventDate: dateStr, startTime: "09:00", endTime: "16:00", location: "สนาม A", isAllPlayers: true, color: "#E65100" });
      } else {
        events.push({ title: "ฝึกซ้อมเช้า", eventType: "training" as const, eventDate: dateStr, startTime: "06:00", endTime: "09:00", location: "สนาม A", isAllPlayers: true, color: "#2E7D32" });
        events.push({ title: "ฝึกซ้อมบ่าย", eventType: "training" as const, eventDate: dateStr, startTime: "14:00", endTime: "17:00", location: "สนาม B", isAllPlayers: true, color: "#1565C0" });
      }
    }
    // Special events
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    events.push({ title: "Thailand Junior Open", eventType: "tournament" as const, eventDate: nextWeek.toISOString().split("T")[0], startTime: "08:00", endTime: "18:00", location: "Impact Arena", isAllPlayers: true, color: "#C62828" });
    const nextMonth = new Date(today); nextMonth.setDate(nextMonth.getDate() + 30);
    events.push({ title: "ประชุมทีมโค้ช", eventType: "meeting" as const, eventDate: nextMonth.toISOString().split("T")[0], startTime: "10:00", endTime: "12:00", location: "ห้องประชุม", isAllPlayers: false, coachId: 1, color: "#6A1B9A" });
    await db.insert(schema.calendarEvents).values(events as any);
    console.log("✓ Calendar events seeded");
  }

  // ============ AWARDS ============
  const existingAwards = await db.select().from(schema.awards).limit(1);
  if (existingAwards.length === 0) {
    await db.insert(schema.awards).values([
      { name: "นักฝึกซ้อมดีเด่น", description: "เช็คอินครบทุกวันในสัปดาห์", category: "training", icon: "star", badgeColor: "#FFD700", autoAward: true, autoCondition: "checkin_streak", autoThreshold: 7 },
      { name: "นักสู้แห่งเดือน", description: "ชนะการแข่งขัน 5 แมตช์ขึ้นไปในเดือน", category: "match", icon: "trophy", badgeColor: "#FF6F00", autoAward: true, autoCondition: "monthly_wins", autoThreshold: 5 },
      { name: "วินัยเหล็ก", description: "เช็คอินครบ 30 วันติดต่อกัน", category: "discipline", icon: "shield", badgeColor: "#1565C0", autoAward: true, autoCondition: "checkin_streak", autoThreshold: 30 },
      { name: "ก้าวกระโดด", description: "Performance Index เพิ่มขึ้น 20% ในเดือน", category: "improvement", icon: "trending-up", badgeColor: "#2E7D32", autoAward: true, autoCondition: "performance_increase", autoThreshold: 20 },
      { name: "MVP ประจำทัวร์นาเมนต์", description: "ผู้เล่นดีเด่นประจำทัวร์นาเมนต์", category: "special", icon: "emoji-events", badgeColor: "#C62828", autoAward: false },
      { name: "จิตใจเข้มแข็ง", description: "คะแนน Mental สูงสุดในทีม", category: "special", icon: "favorite", badgeColor: "#AD1457", autoAward: false },
      { name: "Ace Master", description: "ทำ Ace ได้มากที่สุดในเดือน", category: "match", icon: "flash-on", badgeColor: "#F57F17", autoAward: false },
      { name: "เพื่อนร่วมทีมดีเด่น", description: "ช่วยเหลือเพื่อนร่วมทีมอย่างดีเยี่ยม", category: "special", icon: "people", badgeColor: "#00838F", autoAward: false },
    ]);
    console.log("✓ Awards seeded");

    // ============ PLAYER AWARDS ============
    const today2 = new Date();
    await db.insert(schema.playerAwards).values([
      { playerId: 1, awardId: 1, awardedBy: 1, awardedDate: today2.toISOString().split("T")[0], note: "เช็คอินครบ 7 วันติดต่อกัน" },
      { playerId: 1, awardId: 2, awardedBy: 1, awardedDate: today2.toISOString().split("T")[0], note: "ชนะ 6 แมตช์ในเดือนนี้" },
      { playerId: 2, awardId: 1, awardedBy: 1, awardedDate: today2.toISOString().split("T")[0], note: "เช็คอินครบ 7 วันติดต่อกัน" },
      { playerId: 3, awardId: 4, awardedBy: 2, awardedDate: today2.toISOString().split("T")[0], note: "Performance เพิ่มขึ้น 25%" },
      { playerId: 4, awardId: 6, awardedBy: 2, awardedDate: today2.toISOString().split("T")[0], note: "คะแนน Mental สูงสุด 9.5" },
    ] as any);
    console.log("✓ Player awards seeded");
  }

  // ============ COACHING SESSIONS ============
  const existingSessions = await db.select().from(schema.coachingSessions).limit(1);
  if (existingSessions.length === 0) {
    const today3 = new Date();
    const sessions = [];
    for (let i = 0; i < 20; i++) {
      const d = new Date(today3);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue;
      // Coach 1 (head coach) - morning
      sessions.push({
        coachId: 1, sessionDate: dateStr, startTime: "06:00", endTime: "09:00", hours: 3,
        sessionType: "group" as const, content: "ฝึกซ้อม Forehand/Backhand + Footwork drill",
        playerIds: "1,2,3,4", ratePerHour: 800, totalAmount: 2400, status: i > 5 ? "paid" as const : "pending" as const,
      });
      // Coach 2 - afternoon
      sessions.push({
        coachId: 2, sessionDate: dateStr, startTime: "14:00", endTime: "17:00", hours: 3,
        sessionType: "group" as const, content: "ฝึก Serve + Return + Net play",
        playerIds: "1,2", ratePerHour: 700, totalAmount: 2100, status: i > 5 ? "paid" as const : "pending" as const,
      });
      // Coach 3 - private sessions
      if (dayOfWeek % 2 === 0) {
        sessions.push({
          coachId: 3, sessionDate: dateStr, startTime: "10:00", endTime: "12:00", hours: 2,
          sessionType: "private" as const, content: "Private coaching - Mental training + Match strategy",
          playerIds: "3", ratePerHour: 1200, totalAmount: 2400, status: i > 5 ? "paid" as const : "approved" as const,
        });
      }
    }
    await db.insert(schema.coachingSessions).values(sessions as any);
    console.log("✓ Coaching sessions seeded");
  }

  await connection.end();
  console.log("✅ All new tables seeded successfully!");
}

seed().catch(console.error);
