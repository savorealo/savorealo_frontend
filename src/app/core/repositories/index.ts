// ── Base ─────────────────────────────────────────────────────────────────────
export type { BaseEntity, TimestampedEntity } from './base/base.model'
export type { IBaseRepository } from './base/base-repository'

// ── Tokens ───────────────────────────────────────────────────────────────────
export {
	COMMENT_REPOSITORY,
	REPORT_REPOSITORY,
	POST_MEDIA_REPOSITORY,
	NOTIFICATION_REPOSITORY,
	STORY_REPOSITORY,
	SETTINGS_REPOSITORY,
	PROFILE_REPOSITORY,
	POST_REPOSITORY,
	USER_REPOSITORY,
	SEARCH_REPOSITORY,
	MESSAGE_REPOSITORY,
} from './tokens/repository.tokens'

// ── Interfaces ───────────────────────────────────────────────────────────────
export type { ICommentRepository, SbCommentRow } from './comment/comment-repository'
export type { IReportRepository } from './report/report-repository'
export type { IPostMediaRepository } from './post-media/post-media-repository'
export type { INotificationRepository, RawNotificationRow } from './notification/notification-repository'
export type { IStoryRepository, StoryRow, StoryUserRow } from './story/story-repository'
export type { ISettingsRepository, GqlUserSettings } from './settings/settings-repository'
export type { IProfileRepository, GqlUpdateProfileResult } from './profile/profile-repository'
export type { IPostRepository, GqlPostNode, SavedPostsResult, ToggleLikeResult, ToggleSaveResult } from './post/post-repository'
export type { IUserRepository, GqlUser, GqlFollowUser, ToggleFollowResult, RespondFollowRequestResult } from './user/user-repository'
export type { ISearchRepository, SearchPostRow, GqlSearchUser } from './search/search-repository'
export type { IMessageRepository, ConversationRow, MessageRow } from './message/message-repository'

// ── Implementaciones ─────────────────────────────────────────────────────────
export { CommentSupabaseRepository } from './comment/comment-supabase.repository'
export { ReportSupabaseRepository } from './report/report-supabase.repository'
export { PostMediaSupabaseRepository } from './post-media/post-media-supabase.repository'
export { NotificationSupabaseRepository } from './notification/notification-supabase.repository'
export { StorySupabaseRepository } from './story/story-supabase.repository'
export { SettingsGraphqlRepository } from './settings/settings-graphql.repository'
export { ProfileGraphqlRepository } from './profile/profile-graphql.repository'
export { PostGraphqlRepository } from './post/post-graphql.repository'
export { UserGraphqlRepository } from './user/user-graphql.repository'
export { SearchHybridRepository } from './search/search-hybrid.repository'
export { MessageSupabaseRepository } from './message/message-supabase.repository'
