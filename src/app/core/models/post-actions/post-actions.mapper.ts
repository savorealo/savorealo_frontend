// src/app/features/feed/models/post-actions.mapper.ts
import { CommentDto } from './post-actions.dto'
import { Comment } from './post-actions.model'

export function mapCommentDtoToComment(dto: CommentDto): Comment {
	return {
		id: dto.id,
		postId: dto.post_id,
		authorId: dto.user_id,
		author: {
			username: dto.author?.username ?? '',
			name: dto.author?.full_name ?? null,
			photoUrl: dto.author?.photo_url ?? null,
		},
		text: dto.text,
		createdAt: new Date(dto.created_at),
	}
}
