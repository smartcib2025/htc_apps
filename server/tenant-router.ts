import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  canManageAcademy,
  createAcademyWithOwner,
  getAcademyAccess,
  getAcademyIdFromRequest,
  getAccountIdFromRequest,
  getAcademyUsage,
  getPlanEntitlements,
  listAcademiesForPrincipal,
  updateAcademyBranding,
} from "./tenant";

async function requirePrincipal(ctx: Parameters<Parameters<typeof publicProcedure.query>[0]>[0]["ctx"]) {
  const principalId = getAccountIdFromRequest(ctx.req);
  if (!principalId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "A signed account session is required" });
  }
  const account = await db.getUserAccountById(principalId);
  if (!account || !account.isActive) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Account session is invalid or inactive" });
  }
  return { principalId, account };
}

async function requireTenant(ctx: Parameters<Parameters<typeof publicProcedure.query>[0]>[0]["ctx"]) {
  const { principalId, account } = await requirePrincipal(ctx);
  const academyId = getAcademyIdFromRequest(ctx.req);
  if (!academyId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Select an academy before using tenant data" });
  }
  const access = await getAcademyAccess(principalId, academyId);
  if (!access) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not belong to this academy" });
  }
  return { ...access, account };
}

const planCatalog = [
  {
    id: "free" as const,
    name: "Starter",
    description: "For a small academy trial or pilot program.",
    priceMonthly: 0,
    features: ["Up to 10 players", "Up to 2 coaches", "Training and calendar management"],
  },
  {
    id: "pro" as const,
    name: "Professional",
    description: "For growing academies that need analytics and video workflows.",
    priceMonthly: 49,
    features: ["Up to 250 players", "Up to 25 coaches", "Video analysis and analytics"],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    description: "For academy groups that need finance controls and larger limits.",
    priceMonthly: 149,
    features: ["Up to 5,000 players", "Up to 500 coaches", "Finance controls and priority support"],
  },
];

export const tenantRouter = router({
  plans: publicProcedure.query(() => planCatalog),

  myAcademies: publicProcedure.query(async ({ ctx }) => {
    const { principalId } = await requirePrincipal(ctx);
    return listAcademiesForPrincipal(principalId);
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens"),
      domain: z.string().max(255).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { principalId } = await requirePrincipal(ctx);
      const access = await createAcademyWithOwner({ ...input, principalId });
      if (!access) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create academy" });
      return access;
    }),

  current: publicProcedure.query(async ({ ctx }) => {
    const access = await requireTenant(ctx);
    const usage = await getAcademyUsage(access.academy.id);
    return {
      academy: access.academy,
      membership: access.membership,
      account: {
        id: access.account.id,
        username: access.account.username,
        displayName: access.account.displayName,
        role: access.account.role,
      },
      usage,
      entitlements: getPlanEntitlements(access.academy.subscriptionPlan),
    };
  }),

  branding: publicProcedure.query(async ({ ctx }) => {
    const access = await requireTenant(ctx);
    return {
      academyId: access.academy.id,
      name: access.academy.name,
      logoUrl: access.academy.logoUrl,
      primaryColor: access.academy.primaryColor,
      accentColor: access.academy.accentColor,
      domain: access.academy.domain,
    };
  }),

  updateBranding: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(255).optional(),
      logoUrl: z.string().url().nullable().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      domain: z.string().max(255).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const access = await requireTenant(ctx);
      if (!canManageAcademy(access.membership.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only academy administrators can update branding" });
      }
      return updateAcademyBranding(access.academy.id, input);
    }),

  usage: publicProcedure.query(async ({ ctx }) => {
    const access = await requireTenant(ctx);
    return {
      academyId: access.academy.id,
      usage: await getAcademyUsage(access.academy.id),
      entitlements: getPlanEntitlements(access.academy.subscriptionPlan),
      subscriptionStatus: access.academy.subscriptionStatus,
      trialEndsAt: access.academy.trialEndsAt,
    };
  }),
});
