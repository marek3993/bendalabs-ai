import { z } from "zod";

const siteAuditShape = {
  score: z.number().finite(),
  is_good_fit: z.boolean(),
  site_type: z.string().min(2).max(120),
  demo_override: z.literal("bazos").optional(),
  recommended_ai_type: z.array(z.string().min(2).max(60)).min(1).max(4),
  why_fit: z.array(z.string().min(8).max(220)).min(2).max(5),
  friction_points: z.array(z.string().min(8).max(220)).min(2).max(6),
  upsell_opportunities: z.array(z.string().min(8).max(220)).min(1).max(5),
  phase_one_plan: z.array(z.string().min(8).max(220)).min(3).max(5),
  example_user_flows: z
    .array(
      z.object({
        user_intent: z.string().min(8).max(160),
        ai_action: z.string().min(8).max(220),
        business_value: z.string().min(8).max(220),
      }),
    )
    .min(3)
    .max(3),
  summary: z.string().min(20).max(500),
};

export const rawSiteAuditSchema = z.object(siteAuditShape);

export const siteAuditSchema = rawSiteAuditSchema.extend({
  score: z.number().int().min(1).max(10),
});

export type RawSiteAudit = z.infer<typeof rawSiteAuditSchema>;
export type SiteAudit = z.infer<typeof siteAuditSchema>;
