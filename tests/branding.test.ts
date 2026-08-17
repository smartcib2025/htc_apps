import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readPngDimensions(path: string) {
  const buffer = readFileSync(path);
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const projectRoot = resolve(__dirname, "..");
const assetDir = resolve(projectRoot, "assets/images");
const requiredAssets = [
  "icon.png",
  "splash-icon.png",
  "favicon.png",
  "android-icon-foreground.png",
  "android-icon-background.png",
  "android-icon-monochrome.png",
];

describe("Hanuman Tennis Association branding", () => {
  it("includes the replacement logo in every configured branding asset", () => {
    for (const asset of requiredAssets) {
      const path = resolve(assetDir, asset);
      expect(existsSync(path), `${asset} should exist`).toBe(true);
      const dimensions = readPngDimensions(path);
      expect(dimensions.width, `${asset} should have a width`).toBeGreaterThan(0);
      expect(dimensions.height, `${asset} should have a height`).toBeGreaterThan(0);
    }
  });

  it("uses the shared logo assets in Expo configuration", () => {
    const config = readFileSync(resolve(projectRoot, "app.config.ts"), "utf8");

    expect(config).toContain('icon: "./assets/images/icon.png"');
    expect(config).toContain('favicon: "./assets/images/favicon.png"');
    expect(config).toContain('image: "./assets/images/splash-icon.png"');
    expect(config).toContain('foregroundImage: "./assets/images/android-icon-foreground.png"');
    expect(config).toContain('backgroundImage: "./assets/images/android-icon-background.png"');
    expect(config).toContain('monochromeImage: "./assets/images/android-icon-monochrome.png"');
    expect(config).toContain('backgroundColor: "#001A4D"');
  });

  it("uses the shared icon in the setup screen", () => {
    const setup = readFileSync(resolve(projectRoot, "app/setup.tsx"), "utf8");
    expect(setup).toContain('require("@/assets/images/icon.png")');
  });
});
