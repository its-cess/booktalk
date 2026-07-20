import { z } from "zod";
export declare const pushSubscriptionSchema: z.ZodObject<{
    endpoint: z.ZodString;
    keys: z.ZodObject<{
        p256dh: z.ZodString;
        auth: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
