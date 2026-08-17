import { describe, expect, it } from "vitest";

import { LANGUAGE_OPTIONS, getTranslation, type LanguageCode, type TranslationKey } from "../lib/i18n";

const requiredKeys: TranslationKey[] = [
  "appName",
  "home",
  "progress",
  "matches",
  "reports",
  "profile",
  "calendar",
  "checkInNow",
  "setupTitle",
  "getStarted",
  "player",
  "coach",
  "headCoach",
  "admin",
  "emailLogin",
  "login",
  "register",
  "language",
  "selectLanguage",
];

describe("three-language GUI translations", () => {
  it("offers Thai, English, and Simplified Chinese as selectable languages", () => {
    expect(LANGUAGE_OPTIONS.map((option) => option.code)).toEqual(["th", "en", "zh"]);
    expect(LANGUAGE_OPTIONS.map((option) => option.nativeLabel)).toEqual(["ไทย", "English", "中文"]);
  });

  it("provides every primary GUI label in all supported languages", () => {
    for (const language of ["th", "en", "zh"] as LanguageCode[]) {
      for (const key of requiredKeys) {
        const value = getTranslation(language, key);
        expect(value, `${language}.${key} should be translated`).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to Thai when a translation key is missing", () => {
    expect(getTranslation("en", "welcomeUser")).toBe("Welcome");
    expect(getTranslation("zh", "welcomeUser")).toBe("欢迎");
  });
});
