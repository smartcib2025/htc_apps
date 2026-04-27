// Demo data for the app - used when backend is not available or for demo mode

export const demoPlayers = [
  { id: 1, name: "ณัฐพล สมศรี", level: "Advanced", program: "Elite", coachId: 1, status: "active" as const },
  { id: 2, name: "สุภาพร วงศ์ดี", level: "Intermediate", program: "Junior", coachId: 1, status: "active" as const },
  { id: 3, name: "ธนกร จันทร์เพ็ญ", level: "Advanced", program: "Elite", coachId: 2, status: "active" as const },
  { id: 4, name: "พิมพ์ลภัส ทองคำ", level: "Beginner", program: "Junior", coachId: 2, status: "active" as const },
  { id: 5, name: "กิตติพงษ์ แสงทอง", level: "Advanced", program: "Pro", coachId: 1, status: "injured" as const },
  { id: 6, name: "อรุณี มาลัย", level: "Intermediate", program: "Junior", coachId: 2, status: "active" as const },
];

export const demoCoaches = [
  { id: 1, name: "โค้ชสมชาย ศรีสุข", coachRole: "head_coach" as const, specialty: "Technique & Tactics", status: "active" as const },
  { id: 2, name: "โค้ชวิภา ชัยชนะ", coachRole: "coach" as const, specialty: "Fitness & Mental", status: "active" as const },
];

export const demoCheckins = [
  { id: 1, playerId: 1, checkinDate: "2026-04-27", trainingHours: 3, fatigue: 4, confidence: 8, stress: 3, injuryStatus: false, strengthFeeling: "เสิร์ฟดีขึ้นมาก", weaknessFeeling: "แบ็คแฮนด์ยังไม่คงที่", nextGoal: "พัฒนาแบ็คแฮนด์ให้มั่นคง" },
  { id: 2, playerId: 1, checkinDate: "2026-04-26", trainingHours: 2.5, fatigue: 5, confidence: 7, stress: 4, injuryStatus: false, strengthFeeling: "ฟุตเวิร์คดี", weaknessFeeling: "เหนื่อยง่าย", nextGoal: "เพิ่มความอดทน" },
  { id: 3, playerId: 2, checkinDate: "2026-04-27", trainingHours: 2, fatigue: 3, confidence: 7, stress: 2, injuryStatus: false, strengthFeeling: "วอลเลย์ดี", weaknessFeeling: "เสิร์ฟที่สองยังอ่อน", nextGoal: "ฝึกเสิร์ฟที่สอง" },
  { id: 4, playerId: 3, checkinDate: "2026-04-27", trainingHours: 4, fatigue: 7, confidence: 6, stress: 5, injuryStatus: false, strengthFeeling: "พาวเวอร์ดี", weaknessFeeling: "ควบคุมลูกไม่ดี", nextGoal: "ลดอันฟอร์ซเอ็ดเอร์เรอร์" },
];

export const demoEvaluations = [
  { id: 1, playerId: 1, coachId: 1, technique: 8, fitness: 7, tactics: 7, mental: 8, discipline: 9, matchIQ: 7, strengthNote: "เทคนิคเสิร์ฟดีเยี่ยม ฟอร์แฮนด์มีพลัง", weaknessNote: "แบ็คแฮนด์ต้องพัฒนา ต้องเพิ่มความหลากหลายในเกม", coachComment: "นักกีฬามีศักยภาพสูง ต้องเน้นพัฒนาด้านยุทธวิธี", evalType: "weekly" as const, evalDate: "2026-04-25" },
  { id: 2, playerId: 2, coachId: 1, technique: 6, fitness: 7, tactics: 5, mental: 6, discipline: 8, matchIQ: 5, strengthNote: "มีวินัยดี ตั้งใจฝึกซ้อม", weaknessNote: "ต้องพัฒนาเกมรุก", coachComment: "ควรเพิ่มความมั่นใจในการเล่น", evalType: "weekly" as const, evalDate: "2026-04-25" },
  { id: 3, playerId: 3, coachId: 2, technique: 7, fitness: 8, tactics: 6, mental: 5, discipline: 7, matchIQ: 6, strengthNote: "ร่างกายแข็งแรง เล่นได้ทนทาน", weaknessNote: "สภาพจิตใจไม่มั่นคงในเกมสำคัญ", coachComment: "ต้องเน้นฝึกสภาพจิตใจ", evalType: "weekly" as const, evalDate: "2026-04-24" },
];

export const demoMatches = [
  { id: 1, playerId: 1, matchDate: "2026-04-20", opponent: "นักกีฬาจากสโมสร A", tournament: "Bangkok Junior Open", servePercent: 68, winners: 24, unforcedErrors: 12, result: "win" as const, score: "6-4, 7-5" },
  { id: 2, playerId: 1, matchDate: "2026-04-15", opponent: "นักกีฬาจากสโมสร B", tournament: "Bangkok Junior Open", servePercent: 55, winners: 18, unforcedErrors: 22, result: "loss" as const, score: "4-6, 6-7" },
  { id: 3, playerId: 3, matchDate: "2026-04-18", opponent: "นักกีฬาจากสโมสร C", tournament: "Thailand Youth Cup", servePercent: 72, winners: 30, unforcedErrors: 15, result: "win" as const, score: "6-2, 6-3" },
];

export const demoReports = [
  {
    id: 1, playerId: 1, reportType: "weekly" as const,
    summary: "ณัฐพลแสดงผลงานที่ดีขึ้นอย่างต่อเนื่องในสัปดาห์นี้ เทคนิคเสิร์ฟพัฒนาขึ้นอย่างเห็นได้ชัด แต่ยังต้องพัฒนาแบ็คแฮนด์และยุทธวิธีในเกม",
    strengths: "เสิร์ฟแรงและแม่นยำ, ฟอร์แฮนด์มีพลัง, มีวินัยในการฝึกซ้อม",
    weaknesses: "แบ็คแฮนด์ไม่คงที่, ยุทธวิธีในเกมยังจำกัด, ต้องพัฒนาเกมที่เน็ต",
    actionPlan: "1. ฝึกแบ็คแฮนด์ 30 นาที/วัน\n2. ศึกษาวิดีโอยุทธวิธี\n3. ฝึกวอลเลย์สัปดาห์ละ 3 ครั้ง\n4. ฝึกสมาธิก่อนแข่ง",
    goals: "เพิ่มอัตราชนะแบ็คแฮนด์ 20%, ลด UE ลง 15%",
    performanceIndex: 7.4, readinessIndex: 75, peakIndex: 74.5,
    riskLevel: "low" as const, riskType: null,
    generatedAt: "2026-04-25",
  },
  {
    id: 2, playerId: 3, reportType: "weekly" as const,
    summary: "ธนกรมีสมรรถภาพทางกายที่ดีเยี่ยม แต่สภาพจิตใจยังเป็นจุดอ่อนสำคัญ ความเครียดสูงและความเชื่อมั่นต่ำอาจส่งผลต่อผลงานในการแข่งขัน",
    strengths: "ร่างกายแข็งแรง, เสิร์ฟมีพลัง, ทนทานในเกมยาว",
    weaknesses: "สภาพจิตใจไม่มั่นคง, ความเครียดสูง, ขาดสมาธิในเกมสำคัญ",
    actionPlan: "1. ฝึกสมาธิทุกวัน 15 นาที\n2. ปรึกษานักจิตวิทยาการกีฬา\n3. ลดปริมาณการฝึกซ้อม 10%\n4. เพิ่มเวลาพักผ่อน",
    goals: "ลดระดับความเครียดลง 30%, เพิ่มความมั่นใจในเกม",
    performanceIndex: 6.4, readinessIndex: 50, peakIndex: 57,
    riskLevel: "medium" as const, riskType: "burnout",
    generatedAt: "2026-04-24",
  },
];

export function calculatePerformanceIndex(eval_: { technique?: number | null; fitness?: number | null; tactics?: number | null; mental?: number | null; matchIQ?: number | null }) {
  const scores = [eval_.technique, eval_.fitness, eval_.tactics, eval_.mental, eval_.matchIQ].filter((s): s is number => s != null);
  return scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
}

export function calculateRiskScore(checkins: Array<{ fatigue?: number | null; stress?: number | null; confidence?: number | null; injuryStatus?: boolean | null }>) {
  if (checkins.length === 0) return { level: "low" as const, score: 0 };
  const avgFatigue = checkins.reduce((s, c) => s + (c.fatigue || 0), 0) / checkins.length;
  const avgStress = checkins.reduce((s, c) => s + (c.stress || 0), 0) / checkins.length;
  const avgConfidence = checkins.reduce((s, c) => s + (c.confidence || 0), 0) / checkins.length;
  const hasInjury = checkins.some(c => c.injuryStatus);
  let score = ((avgFatigue + avgStress) / 2) * 10;
  if (avgConfidence < 5) score += 15;
  if (hasInjury) score += 25;
  score = Math.min(100, Math.max(0, score));
  const level = score >= 70 ? "high" as const : score >= 40 ? "medium" as const : "low" as const;
  return { level, score: Math.round(score) };
}

export function getRiskColor(level: "low" | "medium" | "high") {
  switch (level) {
    case "high": return "#C62828";
    case "medium": return "#F57F17";
    case "low": return "#2E7D32";
  }
}
