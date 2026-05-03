"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteAuditSchema = exports.rawSiteAuditSchema = void 0;
const zod_1 = require("zod");
const siteAuditShape = {
    score: zod_1.z.number().finite(),
    is_good_fit: zod_1.z.boolean(),
    site_type: zod_1.z.string().min(2).max(120),
    recommended_ai_type: zod_1.z.array(zod_1.z.string().min(2).max(60)).min(1).max(4),
    why_fit: zod_1.z.array(zod_1.z.string().min(8).max(220)).min(2).max(5),
    friction_points: zod_1.z.array(zod_1.z.string().min(8).max(220)).min(2).max(6),
    upsell_opportunities: zod_1.z.array(zod_1.z.string().min(8).max(220)).min(1).max(5),
    phase_one_plan: zod_1.z.array(zod_1.z.string().min(8).max(220)).min(3).max(5),
    example_user_flows: zod_1.z
        .array(zod_1.z.object({
        user_intent: zod_1.z.string().min(8).max(160),
        ai_action: zod_1.z.string().min(8).max(220),
        business_value: zod_1.z.string().min(8).max(220),
    }))
        .min(3)
        .max(3),
    summary: zod_1.z.string().min(20).max(500),
};
exports.rawSiteAuditSchema = zod_1.z.object(siteAuditShape);
exports.siteAuditSchema = exports.rawSiteAuditSchema.extend({
    score: zod_1.z.number().int().min(1).max(10),
});
