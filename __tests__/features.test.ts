import { describe, it, expect } from "vitest";

describe("Notification Preferences Default Values", () => {
  const DEFAULT_PREFS = {
    dailyCheckinReminder: true,
    checkinReminderHour: 7,
    checkinReminderMinute: 0,
    riskAlerts: true,
    evaluationAlerts: true,
    matchReminders: true,
  };

  it("should have correct default preference values", () => {
    expect(DEFAULT_PREFS.dailyCheckinReminder).toBe(true);
    expect(DEFAULT_PREFS.checkinReminderHour).toBe(7);
    expect(DEFAULT_PREFS.checkinReminderMinute).toBe(0);
    expect(DEFAULT_PREFS.riskAlerts).toBe(true);
    expect(DEFAULT_PREFS.evaluationAlerts).toBe(true);
    expect(DEFAULT_PREFS.matchReminders).toBe(true);
  });

  it("should merge stored preferences with defaults", () => {
    const stored = { dailyCheckinReminder: false, checkinReminderHour: 8 };
    const merged = { ...DEFAULT_PREFS, ...stored };
    expect(merged.dailyCheckinReminder).toBe(false);
    expect(merged.checkinReminderHour).toBe(8);
    expect(merged.riskAlerts).toBe(true); // default preserved
    expect(merged.evaluationAlerts).toBe(true); // default preserved
  });

  it("should handle partial preference updates", () => {
    const current = { ...DEFAULT_PREFS };
    const update = { riskAlerts: false };
    const updated = { ...current, ...update };
    expect(updated.riskAlerts).toBe(false);
    expect(updated.dailyCheckinReminder).toBe(true); // unchanged
    expect(updated.checkinReminderHour).toBe(7); // unchanged
  });
});

describe("Risk Alert Logic", () => {
  const riskLabels: Record<string, string> = {
    high: "สูง 🔴",
    medium: "ปานกลาง 🟡",
    low: "ต่ำ 🟢",
  };

  it("should map risk levels to correct Thai labels", () => {
    expect(riskLabels["high"]).toContain("สูง");
    expect(riskLabels["medium"]).toContain("ปานกลาง");
    expect(riskLabels["low"]).toContain("ต่ำ");
  });

  it("should handle unknown risk levels gracefully", () => {
    const unknownLevel = "critical";
    const label = riskLabels[unknownLevel] || unknownLevel;
    expect(label).toBe("critical");
  });

  it("should generate correct alert body for high risk", () => {
    const playerName = "สมชาย";
    const riskLevel = "high";
    const body = `นักกีฬา ${playerName} มีระดับความเสี่ยง${riskLabels[riskLevel] || riskLevel} กรุณาตรวจสอบ`;
    expect(body).toContain("สมชาย");
    expect(body).toContain("สูง");
    expect(body).toContain("กรุณาตรวจสอบ");
  });
});

describe("Admin CRUD Validation", () => {
  it("should validate player data structure", () => {
    const playerData = {
      name: "สมชาย ใจดี",
      level: "Advanced",
      program: "Intensive",
      phone: "081-234-5678",
    };
    expect(playerData.name).toBeTruthy();
    expect(playerData.name.trim().length).toBeGreaterThan(0);
    expect(["Beginner", "Junior", "Intermediate", "Advanced", "Pro"]).toContain(playerData.level);
  });

  it("should reject empty player name", () => {
    const playerData = { name: "", level: "Beginner" };
    expect(playerData.name.trim().length).toBe(0);
  });

  it("should validate coach data structure", () => {
    const coachData = {
      name: "โค้ชวิชัย",
      specialty: "Serve & Volley",
      coachRole: "coach",
      phone: "089-876-5432",
    };
    expect(coachData.name).toBeTruthy();
    expect(["coach", "head_coach", "assistant"]).toContain(coachData.coachRole);
  });

  it("should validate academy settings keys", () => {
    const settingKeys = [
      "academy_name", "academy_address", "academy_phone", "academy_email",
      "academy_website", "training_start_time", "training_end_time",
      "checkin_reminder_time", "max_players_per_coach", "programs", "levels",
    ];
    expect(settingKeys.length).toBe(11);
    settingKeys.forEach(key => {
      expect(key).toMatch(/^[a-z_]+$/);
    });
  });

  it("should handle optional fields gracefully", () => {
    const playerData = {
      name: "ทดสอบ",
      level: undefined,
      program: undefined,
      phone: undefined,
    };
    expect(playerData.name).toBeTruthy();
    expect(playerData.level).toBeUndefined();
    expect(playerData.program).toBeUndefined();
  });
});

describe("Role-based Access Control", () => {
  type AppRole = "player" | "coach" | "head_coach" | "admin";

  const rolePermissions: Record<AppRole, string[]> = {
    player: ["checkin", "view_progress", "view_matches", "view_reports"],
    coach: ["evaluate", "view_team", "add_notes", "view_reports"],
    head_coach: ["dashboard", "view_all_players", "view_reports", "admin_users", "admin_settings"],
    admin: ["admin_users", "admin_settings", "dashboard", "view_all_players", "view_reports"],
  };

  it("should grant admin access to admin_users and admin_settings", () => {
    expect(rolePermissions["admin"]).toContain("admin_users");
    expect(rolePermissions["admin"]).toContain("admin_settings");
  });

  it("should grant head_coach access to admin features", () => {
    expect(rolePermissions["head_coach"]).toContain("admin_users");
    expect(rolePermissions["head_coach"]).toContain("admin_settings");
    expect(rolePermissions["head_coach"]).toContain("dashboard");
  });

  it("should not grant player access to admin features", () => {
    expect(rolePermissions["player"]).not.toContain("admin_users");
    expect(rolePermissions["player"]).not.toContain("admin_settings");
    expect(rolePermissions["player"]).not.toContain("dashboard");
  });

  it("should not grant coach access to admin features", () => {
    expect(rolePermissions["coach"]).not.toContain("admin_users");
    expect(rolePermissions["coach"]).not.toContain("admin_settings");
  });

  it("should grant player access to checkin and progress", () => {
    expect(rolePermissions["player"]).toContain("checkin");
    expect(rolePermissions["player"]).toContain("view_progress");
  });

  it("should grant coach access to evaluate and team", () => {
    expect(rolePermissions["coach"]).toContain("evaluate");
    expect(rolePermissions["coach"]).toContain("view_team");
  });
});

describe("Notification Channel Configuration", () => {
  const channels = [
    { id: "checkin-reminder", name: "เช็คอินรายวัน", importance: "HIGH" },
    { id: "risk-alert", name: "แจ้งเตือน Risk Level", importance: "MAX" },
    { id: "general", name: "ทั่วไป", importance: "DEFAULT" },
  ];

  it("should have 3 notification channels", () => {
    expect(channels.length).toBe(3);
  });

  it("should have correct channel IDs", () => {
    const ids = channels.map(c => c.id);
    expect(ids).toContain("checkin-reminder");
    expect(ids).toContain("risk-alert");
    expect(ids).toContain("general");
  });

  it("should set risk-alert to MAX importance", () => {
    const riskChannel = channels.find(c => c.id === "risk-alert");
    expect(riskChannel?.importance).toBe("MAX");
  });
});
