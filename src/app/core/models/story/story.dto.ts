import { StoryType } from './story.model';

export interface CreateStoryDto {
  storyType: StoryType;
  mediaUrl: string;
  expiresAt: string;
}
