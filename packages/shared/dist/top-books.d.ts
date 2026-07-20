import { z } from "zod";
export declare const MAX_TOP_BOOKS = 8;
export declare const setTopBooksSchema: z.ZodObject<{
    bookIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SetTopBooksData = z.infer<typeof setTopBooksSchema>;
export interface TopBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
}
