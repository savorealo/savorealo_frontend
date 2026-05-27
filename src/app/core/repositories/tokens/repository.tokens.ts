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

/**
 * Variable o constante para c o m m e n t r e p o s i t o r y.
 */
export const COMMENT_REPOSITORY = new InjectionToken<ICommentRepository>('COMMENT_REPOSITORY')
/**
 * Variable o constante para r e p o r t r e p o s i t o r y.
 */
export const REPORT_REPOSITORY = new InjectionToken<IReportRepository>('REPORT_REPOSITORY')
/**
 * Variable o constante para p o s t m e d i a r e p o s i t o r y.
 */
export const POST_MEDIA_REPOSITORY = new InjectionToken<IPostMediaRepository>('POST_MEDIA_REPOSITORY')
/**
 * Variable o constante para n o t i f i c a t i o n r e p o s i t o r y.
 */
export const NOTIFICATION_REPOSITORY = new InjectionToken<INotificationRepository>('NOTIFICATION_REPOSITORY')
/**
 * Variable o constante para s t o r y r e p o s i t o r y.
 */
export const STORY_REPOSITORY = new InjectionToken<IStoryRepository>('STORY_REPOSITORY')
/**
 * Variable o constante para s e t t i n g s r e p o s i t o r y.
 */
export const SETTINGS_REPOSITORY = new InjectionToken<ISettingsRepository>('SETTINGS_REPOSITORY')
/**
 * Variable o constante para p r o f i l e r e p o s i t o r y.
 */
export const PROFILE_REPOSITORY = new InjectionToken<IProfileRepository>('PROFILE_REPOSITORY')
/**
 * Variable o constante para p o s t r e p o s i t o r y.
 */
export const POST_REPOSITORY = new InjectionToken<IPostRepository>('POST_REPOSITORY')
/**
 * Variable o constante para u s e r r e p o s i t o r y.
 */
export const USER_REPOSITORY = new InjectionToken<IUserRepository>('USER_REPOSITORY')
/**
 * Variable o constante para s e a r c h r e p o s i t o r y.
 */
export const SEARCH_REPOSITORY = new InjectionToken<ISearchRepository>('SEARCH_REPOSITORY')
/**
 * Variable o constante para m e s s a g e r e p o s i t o r y.
 */
export const MESSAGE_REPOSITORY = new InjectionToken<IMessageRepository>('MESSAGE_REPOSITORY')
