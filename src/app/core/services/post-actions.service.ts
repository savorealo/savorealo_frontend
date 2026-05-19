import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

export interface LikeChanged {
	postId: string
	liked: boolean
	likesCount: number
}

export interface SaveChanged {
	postId: string
	saved: boolean
	savesCount: number
}

export interface FollowChanged {
	userId: string
	following: boolean
	requested: boolean
}

export interface CommentCountChanged {
	postId: string
	delta: number
}

@Injectable({ providedIn: 'root' })
export class PostActionsService {
	readonly likeChanged$ = new Subject<LikeChanged>()
	readonly saveChanged$ = new Subject<SaveChanged>()
	readonly followChanged$ = new Subject<FollowChanged>()
	readonly commentCountChanged$ = new Subject<CommentCountChanged>()
}
