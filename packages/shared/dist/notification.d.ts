export type NotificationType = "POST_LIKE" | "COMMENT" | "MENTION_POST" | "MENTION_COMMENT" | "FOLLOW";
export interface NotificationActor {
    id: string;
    username: string;
    displayName: string;
}
export interface GroupedNotification {
    id: string;
    ids: string[];
    type: NotificationType;
    postId?: string;
    commentId?: string;
    actors: NotificationActor[];
    totalActors: number;
    read: boolean;
    createdAt: string;
}
