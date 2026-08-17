import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LanguageCode = "th" | "en" | "zh";

type TranslationKey =
  | "appName"
  | "academyTagline"
  | "hello"
  | "helloCoach"
  | "dashboard"
  | "home"
  | "progress"
  | "team"
  | "matches"
  | "reports"
  | "profile"
  | "settings"
  | "tools"
  | "newFeatures"
  | "adminManagement"
  | "about"
  | "editProfile"
  | "notificationsSettings"
  | "changeRole"
  | "version"
  | "videoAnalysis"
  | "statisticsAnalytics"
  | "integrations"
  | "adminUsers"
  | "academySettings"
  | "calendarDescription"
  | "awardsDescription"
  | "videoDescription"
  | "statisticsDescription"
  | "integrationsDescription"
  | "settings"
  | "calendar"
  | "awards"
  | "recordMatch"
  | "checkIn"
  | "checkInToday"
  | "checkInNow"
  | "notCheckedIn"
  | "performance"
  | "weeklyCheckIns"
  | "riskScore"
  | "trainingHours"
  | "latestEvaluation"
  | "technique"
  | "fitness"
  | "tactics"
  | "mental"
  | "matchIQ"
  | "setupTitle"
  | "setupSubtitle"
  | "fullName"
  | "chooseRole"
  | "getStarted"
  | "player"
  | "coach"
  | "headCoach"
  | "admin"
  | "playerDescription"
  | "coachDescription"
  | "headCoachDescription"
  | "adminDescription"
  | "emailLogin"
  | "login"
  | "register"
  | "username"
  | "email"
  | "password"
  | "confirmPassword"
  | "forgotPassword"
  | "back"
  | "language"
  | "selectLanguage"
  | "thai"
  | "english"
  | "chinese"
  | "save"
  | "cancel"
  | "close"
  | "logout"
  | "search"
  | "notifications"
  | "advancedSearch"
  | "academyManagement"
  | "welcomeUser";

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: "th", label: "Thai", nativeLabel: "ไทย" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
];

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  th: {
    appName: "Hanuman Tennis Academy",
    academyTagline: "ระบบติดตามการฝึกซ้อมเทนนิส",
    hello: "สวัสดี",
    helloCoach: "สวัสดี โค้ช",
    dashboard: "Dashboard",
    home: "หน้าหลัก",
    progress: "ความก้าวหน้า",
    team: "ทีม",
    matches: "แข่งขัน",
    reports: "รายงาน",
    profile: "โปรไฟล์",
    settings: "ตั้งค่า",
    tools: "เครื่องมือ",
    newFeatures: "ฟีเจอร์ใหม่",
    adminManagement: "การจัดการ (Admin)",
    about: "เกี่ยวกับ",
    editProfile: "แก้ไขโปรไฟล์",
    notificationsSettings: "การแจ้งเตือน",
    changeRole: "เปลี่ยนบทบาท",
    version: "เวอร์ชัน",
    videoAnalysis: "วิดีโอวิเคราะห์",
    statisticsAnalytics: "สถิติและวิเคราะห์",
    integrations: "การเชื่อมต่อ",
    adminUsers: "จัดการผู้ใช้",
    academySettings: "ตั้งค่าสถาบัน",
    calendarDescription: "ตารางฝึกซ้อมและการแข่งขัน",
    awardsDescription: "ดูรางวัลและอันดับนักกีฬา",
    videoDescription: "อัปโหลดและวิเคราะห์วิดีโอ",
    statisticsDescription: "แนวโน้มประสิทธิภาพและความเสี่ยง",
    integrationsDescription: "Google Calendar, Line, Payment",
    calendar: "ปฏิทิน",
    awards: "รางวัล",
    recordMatch: "บันทึกแข่ง",
    checkIn: "เช็คอิน",
    checkInToday: "เช็คอินวันนี้",
    checkInNow: "เช็คอินเลย",
    notCheckedIn: "ยังไม่เช็คอิน",
    performance: "Performance",
    weeklyCheckIns: "เช็คอินสัปดาห์นี้",
    riskScore: "Risk Score",
    trainingHours: "ชั่วโมงฝึกซ้อม",
    latestEvaluation: "การประเมินล่าสุด",
    technique: "Technique",
    fitness: "Fitness",
    tactics: "Tactics",
    mental: "Mental",
    matchIQ: "MatchIQ",
    setupTitle: "เริ่มต้นใช้งาน",
    setupSubtitle: "ระบบติดตามการฝึกซ้อมเทนนิส",
    fullName: "ชื่อของคุณ",
    chooseRole: "เลือกบทบาท",
    getStarted: "เริ่มใช้งาน",
    player: "นักกีฬา",
    coach: "โค้ช",
    headCoach: "Head Coach",
    admin: "ผู้ดูแลระบบ",
    playerDescription: "บันทึกการฝึกซ้อม เช็คอิน ดูความก้าวหน้า",
    coachDescription: "ประเมินนักกีฬา บันทึกโน้ต ดูทีม",
    headCoachDescription: "Dashboard ภาพรวม วิเคราะห์ทีม",
    adminDescription: "จัดการผู้ใช้ ตั้งค่าระบบ",
    emailLogin: "เข้าสู่ระบบด้วยอีเมล",
    login: "เข้าสู่ระบบ",
    register: "สมัครสมาชิก",
    username: "ชื่อผู้ใช้",
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    forgotPassword: "ลืมรหัสผ่าน?",
    back: "กลับ",
    language: "ภาษา",
    selectLanguage: "เลือกภาษา",
    thai: "ไทย",
    english: "อังกฤษ",
    chinese: "จีน",
    save: "บันทึก",
    cancel: "ยกเลิก",
    close: "ปิด",
    logout: "ออกจากระบบ",
    search: "ค้นหา",
    notifications: "การแจ้งเตือน",
    advancedSearch: "ค้นหาขั้นสูง",
    academyManagement: "ระบบจัดการ Hanuman Tennis Academy",
    welcomeUser: "ยินดีต้อนรับ",
  },
  en: {
    appName: "Hanuman Tennis Academy",
    academyTagline: "Tennis training tracking system",
    hello: "Hello",
    helloCoach: "Hello, Coach",
    dashboard: "Dashboard",
    home: "Home",
    progress: "Progress",
    team: "Team",
    matches: "Matches",
    reports: "Reports",
    profile: "Profile",
    settings: "Settings",
    tools: "Tools",
    newFeatures: "New features",
    adminManagement: "Administration",
    about: "About",
    editProfile: "Edit profile",
    notificationsSettings: "Notifications",
    changeRole: "Change role",
    version: "Version",
    videoAnalysis: "Video analysis",
    statisticsAnalytics: "Statistics & analytics",
    integrations: "Integrations",
    adminUsers: "Manage users",
    academySettings: "Academy settings",
    calendarDescription: "Training and match schedule",
    awardsDescription: "View awards and player rankings",
    videoDescription: "Upload and analyze videos",
    statisticsDescription: "Performance trends and risk insights",
    integrationsDescription: "Google Calendar, Line, payments",
    calendar: "Calendar",
    awards: "Awards",
    recordMatch: "Match record",
    checkIn: "Check-in",
    checkInToday: "Today's check-in",
    checkInNow: "Check in now",
    notCheckedIn: "Not checked in",
    performance: "Performance",
    weeklyCheckIns: "Weekly check-ins",
    riskScore: "Risk Score",
    trainingHours: "Training hours",
    latestEvaluation: "Latest evaluation",
    technique: "Technique",
    fitness: "Fitness",
    tactics: "Tactics",
    mental: "Mental",
    matchIQ: "Match IQ",
    setupTitle: "Get started",
    setupSubtitle: "Tennis training tracking system",
    fullName: "Your name",
    chooseRole: "Choose a role",
    getStarted: "Get started",
    player: "Player",
    coach: "Coach",
    headCoach: "Head Coach",
    admin: "Administrator",
    playerDescription: "Log training, check in, and track progress",
    coachDescription: "Evaluate players, write notes, and view the team",
    headCoachDescription: "Overview dashboard and team analytics",
    adminDescription: "Manage users and academy settings",
    emailLogin: "Email login",
    login: "Login",
    register: "Register",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    back: "Back",
    language: "Language",
    selectLanguage: "Select language",
    thai: "Thai",
    english: "English",
    chinese: "Chinese",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    logout: "Log out",
    search: "Search",
    notifications: "Notifications",
    advancedSearch: "Advanced search",
    academyManagement: "Hanuman Tennis Academy management system",
    welcomeUser: "Welcome",
  },
  zh: {
    appName: "Hanuman 网球学院",
    academyTagline: "网球训练追踪系统",
    hello: "你好",
    helloCoach: "你好，教练",
    dashboard: "仪表盘",
    home: "首页",
    progress: "进步情况",
    team: "团队",
    matches: "比赛",
    reports: "报告",
    profile: "个人资料",
    settings: "设置",
    tools: "工具",
    newFeatures: "新功能",
    adminManagement: "管理",
    about: "关于",
    editProfile: "编辑资料",
    notificationsSettings: "通知",
    changeRole: "切换角色",
    version: "版本",
    videoAnalysis: "视频分析",
    statisticsAnalytics: "统计与分析",
    integrations: "集成",
    adminUsers: "用户管理",
    academySettings: "学院设置",
    calendarDescription: "训练与比赛日程",
    awardsDescription: "查看奖励与运动员排名",
    videoDescription: "上传并分析视频",
    statisticsDescription: "表现趋势与风险分析",
    integrationsDescription: "Google 日历、Line、支付",
    calendar: "日历",
    awards: "奖励",
    recordMatch: "记录比赛",
    checkIn: "签到",
    checkInToday: "今日签到",
    checkInNow: "立即签到",
    notCheckedIn: "尚未签到",
    performance: "表现",
    weeklyCheckIns: "本周签到",
    riskScore: "风险评分",
    trainingHours: "训练小时",
    latestEvaluation: "最近评估",
    technique: "技术",
    fitness: "体能",
    tactics: "战术",
    mental: "心理",
    matchIQ: "比赛理解",
    setupTitle: "开始使用",
    setupSubtitle: "网球训练追踪系统",
    fullName: "您的姓名",
    chooseRole: "选择角色",
    getStarted: "开始使用",
    player: "运动员",
    coach: "教练",
    headCoach: "主教练",
    admin: "管理员",
    playerDescription: "记录训练、签到并查看进步",
    coachDescription: "评估运动员、记录笔记并查看团队",
    headCoachDescription: "总览仪表盘与团队分析",
    adminDescription: "管理用户和学院设置",
    emailLogin: "邮箱登录",
    login: "登录",
    register: "注册",
    username: "用户名",
    email: "邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    forgotPassword: "忘记密码？",
    back: "返回",
    language: "语言",
    selectLanguage: "选择语言",
    thai: "泰语",
    english: "英语",
    chinese: "中文",
    save: "保存",
    cancel: "取消",
    close: "关闭",
    logout: "退出登录",
    search: "搜索",
    notifications: "通知",
    advancedSearch: "高级搜索",
    academyManagement: "Hanuman 网球学院管理系统",
    welcomeUser: "欢迎",
  },
};

const STORAGE_KEY = "@hanuman-tennis/language";

export function getTranslation(language: LanguageCode, key: TranslationKey, params?: Record<string, string | number>) {
  const template = translations[language][key] ?? translations.th[key] ?? key;
  return interpolate(template, params);
}

type TranslationParams = Record<string, string | number>;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  languageOptions: typeof LANGUAGE_OPTIONS;
  isLanguageReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("th");
  const [isLanguageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === "th" || stored === "en" || stored === "zh") {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLanguageReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the in-memory language even when persistence is unavailable.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      return getTranslation(language, key, params);
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, languageOptions: LANGUAGE_OPTIONS, isLanguageReady }),
    [language, setLanguage, t, isLanguageReady],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export type { TranslationKey };
