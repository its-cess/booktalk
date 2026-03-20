export type NotificationType =
  | "POST_LIKE"
  | "COMMENT"
  | "MENTION_POST"
  | "MENTION_COMMENT";

export interface NotificationActor {
  id: string;
  username: string;
  displayName: string;
}

export interface GroupedNotification {
  // ID of the most recent notification in the group (used for mark-read)
  id: string;
  // All notification IDs in this group (for bulk mark-read)
  ids: string[];
  type: NotificationType;
  postId: string;
  commentId?: string;
  // Up to 2 most recent actors
  actors: NotificationActor[];
  // Total number of actors (for "and X others" display)
  totalActors: number;
  read: boolean;
  createdAt: string;
}
