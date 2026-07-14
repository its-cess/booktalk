import { z } from "zod";
/** Name of the auto-created, non-deletable system shelf. */
export declare const WANT_TO_READ = "Want to Read";
export declare const createShelfSchema: z.ZodObject<{
    name: z.ZodString;
    isPrivate: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateShelfData = z.infer<typeof createShelfSchema>;
export declare const updateShelfSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    isPrivate: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type UpdateShelfData = z.infer<typeof updateShelfSchema>;
export declare const addShelfItemSchema: z.ZodObject<{
    bookId: z.ZodString;
}, z.core.$strip>;
export type AddShelfItemData = z.infer<typeof addShelfItemSchema>;
/** A shelf as shown in a list (profile grid): count + a few cover previews. */
export interface ShelfSummary {
    id: string;
    name: string;
    isSystem: boolean;
    isPrivate: boolean;
    itemCount: number;
    coverUrls: (string | null)[];
    createdAt: string;
}
export interface ShelfBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    addedAt: string;
}
/** A single shelf with its books (shelf detail view). */
export interface ShelfWithBooks {
    id: string;
    name: string;
    isSystem: boolean;
    isPrivate: boolean;
    createdAt: string;
    owner: {
        id: string;
        username: string;
        displayName: string;
    };
    books: ShelfBook[];
}
/** A shelf plus whether it contains a given book — powers the add-to-shelf menu. */
export interface ShelfMembership {
    id: string;
    name: string;
    isSystem: boolean;
    containsBook: boolean;
}
