export type StoryType = 'PHOTO' | 'VIDEO';

export interface Story {
  id: string;
  userId: string;
  storyType: StoryType;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
}
