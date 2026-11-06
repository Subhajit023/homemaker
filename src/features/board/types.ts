export type Post = {
  id: string;
  /** Author */
  memberId: string;
  text: string;
  /** Optional photo as a JPEG data URI, or ''. */
  photo: string;
  /** emoji → member ids who reacted with it */
  reactions: Record<string, string[]>;
  /** Member ids this post is kept secret from (surprises). */
  hiddenFrom: string[];
  createdAt: number;
};

export const REACTIONS = ['❤️', '😂', '👍', '🙏', '🎉'];

