"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushSubscriptionSchema = void 0;
const zod_1 = require("zod");
// Shape of a browser PushSubscription (the JSON produced by `subscription.toJSON()`).
exports.pushSubscriptionSchema = zod_1.z.object({
    endpoint: zod_1.z.string().url(),
    keys: zod_1.z.object({
        p256dh: zod_1.z.string().min(1),
        auth: zod_1.z.string().min(1),
    }),
});
