export interface UpdateUserSettingsDto {
  isPrivate?: boolean;
  language?: string;
  notifyLikes?: boolean;
  notifyComments?: boolean;
  notifyFollows?: boolean;
  theme?: string;
}
