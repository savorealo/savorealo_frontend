// src/app/features/feed/models/post-actions.mapper.ts
import { CommentDto, LikeResultDto } from './post-actions.dto'
import { Comment, LikeResult } from './post-actions.model'

export function mapCommentDtoToComment(dto: CommentDto): Comment {
	return {
		id: dto.id,
		postId: dto.post_id,
		authorId: dto.user_id,
		author: {
			username: dto.author.username,
			name: dto.author.full_name,
			photoUrl: dto.author.photo_url,
		},
		text: dto.text,
		createdAt: new Date(dto.created_at),
	}
}

export function mapLikeResultDtoToLikeResult(dto: LikeResultDto): LikeResult {
	return {
		liked: dto.liked,
		likesCount: dto.likes_count,
	}
}
