import { InjectionToken } from '@angular/core'
import type { ICommentRepository } from '../comment/comment-repository'
import type { IReportRepository } from '../report/report-repository'
import type { IPostMediaRepository } from '../post-media/post-media-repository'
import type { INotificationRepository } from '../notification/notification-repository'
import type { IStoryRepository } from '../story/story-repository'
import type { ISettingsRepository } from '../settings/settings-repository'
import type { IProfileRepository } from '../profile/profile-repository'
import type { IPostRepository } from '../post/post-repository'
import type { IUserRepository } from '../user/user-repository'
import type { ISearchRepository } from '../search/search-repository'
import type { IMessageRepository } from '../message/message-repository'

export const COMMENT_REPOSITORY = new InjectionToken<ICommentRepository>('COMMENT_REPOSITORY')
export const REPORT_REPOSITORY = new InjectionToken<IReportRepository>('REPORT_REPOSITORY')
export const POST_MEDIA_REPOSITORY = new InjectionToken<IPostMediaRepository>('POST_MEDIA_REPOSITORY')
export const NOTIFICATION_REPOSITORY = new InjectionToken<INotificationRepository>('NOTIFICATION_REPOSITORY')
export const STORY_REPOSITORY = new InjectionToken<IStoryRepository>('STORY_REPOSITORY')
export const SETTINGS_REPOSITORY = new InjectionToken<ISettingsRepository>('SETTINGS_REPOSITORY')
export const PROFILE_REPOSITORY = new InjectionToken<IProfileRepository>('PROFILE_REPOSITORY')
export const POST_REPOSITORY = new InjectionToken<IPostRepository>('POST_REPOSITORY')
export const USER_REPOSITORY = new InjectionToken<IUserRepository>('USER_REPOSITORY')
export const SEARCH_REPOSITORY = new InjectionToken<ISearchRepository>('SEARCH_REPOSITORY')
export const MESSAGE_REPOSITORY = new InjectionToken<IMessageRepository>('MESSAGE_REPOSITORY')
