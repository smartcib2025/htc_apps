import { drizzle } from "drizzle-orm/mysql2";
import { players, coaches, dailyCheckins, coachEvaluations, matchStats, aiReports, coachNotes, academySettings } from "../drizzle/schema";
import { count } from "drizzle-orm";

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("DATABASE_URL not set"); process.exit(1); }
  const db = drizzle(dbUrl);

  // Check if already seeded
  const [playerCount] = await db.select({ count: count() }).from(players);
  if ((playerCount?.count ?? 0) > 0) {
    console.log("Database already has data, skipping seed.");
    process.exit(0);
  }

  console.log("Seeding database...");

  // Coaches
  await db.insert(coaches).values([
    { id: 1, name: "โค้ชสมชาย วิทยาเทนนิส", coachRole: "head_coach", specialty: "เทคนิคเสิร์ฟและวอลเลย์", phone: "081-234-5678", status: "active" },
    { id: 2, name: "โค้ชวิภา แกร่งกล้า", coachRole: "coach", specialty: "ฟิตเนสและความแข็งแรง", phone: "082-345-6789", status: "active" },
    { id: 3, name: "โค้ชธนพล ยุทธศาสตร์", coachRole: "coach", specialty: "ยุทธวิธีและเกมแข่งขัน", phone: "083-456-7890", status: "active" },
  ]);

  // Players
  await db.insert(players).values([
    { id: 1, name: "ณัฐพล เทนนิสเก่ง", level: "Advanced", program: "Pro Development", coachId: 1, dateOfBirth: new Date("2008-03-15"), phone: "091-111-2222", emergencyContact: "คุณแม่ 091-111-3333", status: "active" },
    { id: 2, name: "สมหญิง รักเทนนิส", level: "Intermediate", program: "Junior Elite", coachId: 1, dateOfBirth: new Date("2010-07-22"), phone: "091-222-3333", emergencyContact: "คุณพ่อ 091-222-4444", status: "active" },
    { id: 3, name: "ธนกร พลังแรง", level: "Advanced", program: "Pro Development", coachId: 2, dateOfBirth: new Date("2007-11-08"), phone: "091-333-4444", emergencyContact: "คุณแม่ 091-333-5555", status: "active" },
    { id: 4, name: "พิมพ์ใจ ใจสู้", level: "Beginner", program: "Foundation", coachId: 2, dateOfBirth: new Date("2012-01-30"), phone: "091-444-5555", emergencyContact: "คุณพ่อ 091-444-6666", status: "active" },
    { id: 5, name: "กิตติพงศ์ ตีแรง", level: "Intermediate", program: "Junior Elite", coachId: 3, dateOfBirth: new Date("2009-05-18"), phone: "091-555-6666", emergencyContact: "คุณแม่ 091-555-7777", status: "active" },
    { id: 6, name: "อรุณี สปีดเร็ว", level: "Advanced", program: "Pro Development", coachId: 3, dateOfBirth: new Date("2008-09-12"), phone: "091-666-7777", emergencyContact: "คุณพ่อ 091-666-8888", status: "active" },
    { id: 7, name: "วรพจน์ ฟอร์มดี", level: "Intermediate", program: "Junior Elite", coachId: 1, dateOfBirth: new Date("2011-04-25"), phone: "091-777-8888", emergencyContact: "คุณแม่ 091-777-9999", status: "injured" },
    { id: 8, name: "นภัสสร เทนนิสสาว", level: "Beginner", program: "Foundation", coachId: 3, dateOfBirth: new Date("2013-02-14"), phone: "091-888-9999", emergencyContact: "คุณพ่อ 091-888-0000", status: "active" },
  ]);

  // Daily Check-ins (last 7 days)
  const today = new Date();
  const checkinData = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];
    for (const pid of [1, 2, 3, 5, 6]) {
      checkinData.push({
        playerId: pid,
        checkinDate: new Date(dateStr),
        trainingHours: 2 + Math.floor(Math.random() * 3),
        fatigue: 2 + Math.floor(Math.random() * 6),
        confidence: 4 + Math.floor(Math.random() * 5),
        stress: 1 + Math.floor(Math.random() * 5),
        injuryStatus: false,
        strengthFeeling: ["ฟอร์แฮนด์ดี", "เสิร์ฟแม่น", "วอลเลย์คม", "ฟุตเวิร์คดี", "แบ็คแฮนด์มั่นคง"][Math.floor(Math.random() * 5)],
        weaknessFeeling: ["แบ็คแฮนด์ยังอ่อน", "เสิร์ฟที่สองไม่มั่นใจ", "ต้องพัฒนาเกมเน็ต", "ควบคุมลูกไม่ดี", "สมาธิหลุดง่าย"][Math.floor(Math.random() * 5)],
        nextGoal: ["ฝึกเสิร์ฟ", "พัฒนาแบ็คแฮนด์", "เพิ่มความแข็งแรง", "ฝึกยุทธวิธี", "ลด UE"][Math.floor(Math.random() * 5)],
      });
    }
  }
  await db.insert(dailyCheckins).values(checkinData);

  // Evaluations
  await db.insert(coachEvaluations).values([
    { playerId: 1, coachId: 1, technique: 8, fitness: 7, tactics: 7, mental: 8, discipline: 9, matchIQ: 7, strengthNote: "เทคนิคเสิร์ฟดีเยี่ยม ฟอร์แฮนด์มีพลัง", weaknessNote: "แบ็คแฮนด์ต้องพัฒนา", coachComment: "นักกีฬามีศักยภาพสูง ต้องเน้นพัฒนาด้านยุทธวิธี", evalType: "weekly", evalDate: new Date(today.getTime() - 2 * 86400000) },
    { playerId: 2, coachId: 1, technique: 6, fitness: 7, tactics: 5, mental: 6, discipline: 8, matchIQ: 5, strengthNote: "มีวินัยดี ตั้งใจฝึกซ้อม", weaknessNote: "ต้องพัฒนาเกมรุก", coachComment: "ควรเพิ่มความมั่นใจในการเล่น", evalType: "weekly", evalDate: new Date(today.getTime() - 2 * 86400000) },
    { playerId: 3, coachId: 2, technique: 7, fitness: 8, tactics: 6, mental: 5, discipline: 7, matchIQ: 6, strengthNote: "ร่างกายแข็งแรง เล่นได้ทนทาน", weaknessNote: "สภาพจิตใจไม่มั่นคงในเกมสำคัญ", coachComment: "ต้องเน้นฝึกสภาพจิตใจ", evalType: "weekly", evalDate: new Date(today.getTime() - 3 * 86400000) },
    { playerId: 5, coachId: 3, technique: 6, fitness: 6, tactics: 7, mental: 7, discipline: 7, matchIQ: 7, strengthNote: "เข้าใจเกมดี มียุทธวิธีหลากหลาย", weaknessNote: "ต้องเพิ่มพลังในการตี", coachComment: "พัฒนาดีขึ้นต่อเนื่อง", evalType: "weekly", evalDate: new Date(today.getTime() - 2 * 86400000) },
    { playerId: 6, coachId: 3, technique: 8, fitness: 7, tactics: 7, mental: 6, discipline: 8, matchIQ: 7, strengthNote: "เสิร์ฟแรงและแม่นยำ ฟุตเวิร์คดี", weaknessNote: "ต้องพัฒนาสภาพจิตใจในเกมกดดัน", coachComment: "มีศักยภาพสูง ต้องเน้นเรื่อง mental", evalType: "weekly", evalDate: new Date(today.getTime() - 1 * 86400000) },
  ]);

  // Match Stats
  await db.insert(matchStats).values([
    { playerId: 1, matchDate: new Date(today.getTime() - 7 * 86400000), opponent: "นักกีฬาจากสโมสร A", tournament: "Bangkok Junior Open", servePercent: 68, winners: 24, unforcedErrors: 12, result: "win", score: "6-4, 7-5" },
    { playerId: 1, matchDate: new Date(today.getTime() - 12 * 86400000), opponent: "นักกีฬาจากสโมสร B", tournament: "Bangkok Junior Open", servePercent: 55, winners: 18, unforcedErrors: 22, result: "loss", score: "4-6, 6-7" },
    { playerId: 3, matchDate: new Date(today.getTime() - 9 * 86400000), opponent: "นักกีฬาจากสโมสร C", tournament: "Thailand Youth Cup", servePercent: 72, winners: 30, unforcedErrors: 15, result: "win", score: "6-2, 6-3" },
    { playerId: 5, matchDate: new Date(today.getTime() - 5 * 86400000), opponent: "นักกีฬาจากสโมสร D", tournament: "Pattaya Open", servePercent: 60, winners: 20, unforcedErrors: 18, result: "win", score: "7-5, 6-4" },
    { playerId: 6, matchDate: new Date(today.getTime() - 4 * 86400000), opponent: "นักกีฬาจากสโมสร E", tournament: "Pattaya Open", servePercent: 65, winners: 22, unforcedErrors: 14, result: "win", score: "6-3, 6-2" },
  ]);

  // AI Reports
  await db.insert(aiReports).values([
    { playerId: 1, reportType: "weekly", summary: "ณัฐพลแสดงผลงานที่ดีขึ้นอย่างต่อเนื่อง เทคนิคเสิร์ฟพัฒนาขึ้นอย่างเห็นได้ชัด", strengths: "เสิร์ฟแรงและแม่นยำ, ฟอร์แฮนด์มีพลัง, มีวินัยในการฝึกซ้อม", weaknesses: "แบ็คแฮนด์ไม่คงที่, ยุทธวิธีในเกมยังจำกัด", actionPlan: "1. ฝึกแบ็คแฮนด์ 30 นาที/วัน\n2. ศึกษาวิดีโอยุทธวิธี\n3. ฝึกวอลเลย์สัปดาห์ละ 3 ครั้ง", goals: "เพิ่มอัตราชนะแบ็คแฮนด์ 20%, ลด UE ลง 15%", performanceIndex: 7.4, readinessIndex: 75, peakIndex: 74.5, riskLevel: "low", riskType: null },
    { playerId: 3, reportType: "weekly", summary: "ธนกรมีสมรรถภาพทางกายที่ดีเยี่ยม แต่สภาพจิตใจยังเป็นจุดอ่อนสำคัญ", strengths: "ร่างกายแข็งแรง, เสิร์ฟมีพลัง, ทนทานในเกมยาว", weaknesses: "สภาพจิตใจไม่มั่นคง, ความเครียดสูง", actionPlan: "1. ฝึกสมาธิทุกวัน 15 นาที\n2. ปรึกษานักจิตวิทยาการกีฬา\n3. ลดปริมาณการฝึกซ้อม 10%", goals: "ลดระดับความเครียดลง 30%, เพิ่มความมั่นใจในเกม", performanceIndex: 6.4, readinessIndex: 50, peakIndex: 57, riskLevel: "medium", riskType: "burnout" },
    { playerId: 6, reportType: "weekly", summary: "อรุณีมีพัฒนาการที่ดีมาก เสิร์ฟแรงขึ้นและฟุตเวิร์คดีขึ้น", strengths: "เสิร์ฟแรง, ฟุตเวิร์คดี, มีวินัย", weaknesses: "ต้องพัฒนา mental game", actionPlan: "1. ฝึกสมาธิก่อนแข่ง\n2. เพิ่มเกมวอลเลย์", goals: "ชนะ 3 ทัวร์นาเมนต์ในไตรมาสนี้", performanceIndex: 7.2, readinessIndex: 70, peakIndex: 71, riskLevel: "low", riskType: null },
  ]);

  // Coach Notes
  await db.insert(coachNotes).values([
    { coachId: 1, playerId: 1, title: "ฝึกเสิร์ฟพิเศษ", content: "ณัฐพลฝึกเสิร์ฟ flat serve ได้ดีมาก ความเร็วเพิ่มขึ้น 10% จากสัปดาห์ก่อน", noteDate: new Date(today.getTime() - 1 * 86400000) },
    { coachId: 2, playerId: 3, title: "ปรับโปรแกรมฟิตเนส", content: "ธนกรมีอาการเหนื่อยสะสม ปรับลดความเข้มข้นการฝึก 20% ในสัปดาห์นี้", noteDate: new Date(today.getTime() - 2 * 86400000) },
    { coachId: 3, playerId: 5, title: "พัฒนายุทธวิธี", content: "กิตติพงศ์เริ่มเข้าใจการเล่นแบบ serve-and-volley ได้ดีขึ้น", noteDate: new Date(today.getTime() - 1 * 86400000) },
  ]);

  // Academy Settings
  await db.insert(academySettings).values([
    { settingKey: "academy_name", settingValue: "Hanuman Tennis Academy" },
    { settingKey: "academy_address", settingValue: "123 ถนนเทนนิส แขวงกีฬา เขตสุขภาพ กรุงเทพฯ 10110" },
    { settingKey: "academy_phone", settingValue: "02-123-4567" },
    { settingKey: "academy_email", settingValue: "info@hanuman-tennis.com" },
    { settingKey: "programs", settingValue: JSON.stringify(["Foundation", "Junior Elite", "Pro Development", "Adult Fitness"]) },
    { settingKey: "levels", settingValue: JSON.stringify(["Beginner", "Intermediate", "Advanced", "Professional"]) },
    { settingKey: "training_hours", settingValue: "06:00-20:00" },
    { settingKey: "max_players_per_coach", settingValue: "8" },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
