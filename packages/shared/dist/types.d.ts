export interface User {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
}
export interface Post {
    id: string;
    authorId: string;
    content: string;
    bookTitle?: string;
    bookAuthor?: string;
    hasSpoilers: boolean;
    createdAt: Date;
}
