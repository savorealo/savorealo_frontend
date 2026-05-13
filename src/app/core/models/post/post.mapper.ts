import { PostDto, PostMediaDto, RecipeDto } from './post.dto'
import { Post, PostAuthor, PostMedia, Recipe, RecipeStep } from './post.model'

function mapAuthor(dto: PostDto['author']): PostAuthor {
	return {
		id: dto.id,
		name: dto.display_name ?? null,
		username: dto.username ?? null,
		photoUrl: dto.avatar_url ?? null,
	}
}

function mapMedia(dto: PostMediaDto[]): PostMedia[] {
	return [...dto]
		.sort((a, b) => a.position - b.position)
		.map(m => ({
			id: m.id,
			url: m.media_url,
			type: m.media_type,
			position: m.position,
		}))
}

function mapRecipe(dto: RecipeDto): Recipe {
	let steps: RecipeStep[] = []
	try {
		const parsed = JSON.parse(dto.steps)
		if (Array.isArray(parsed)) {
			steps = parsed.map((s: { step?: number; order?: number; text?: string; description?: string }, i: number) => ({
				step: s.step ?? s.order ?? i + 1,
				text: s.text ?? s.description ?? '',
			}))
		}
	} catch { steps = [] }

	return {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		steps,
		timeRequired: dto.time_required,
		estimatedCost: dto.estimated_cost ? parseFloat(dto.estimated_cost) : null,
		servings: dto.servings,
		difficulty: (dto.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | null) ?? null,
		ingredients: [],
	}
}

export function mapPostDtoToPost(dto: PostDto): Post {
	return {
		id: dto.id,
		authorId: dto.author.id,
		author: mapAuthor(dto.author),
		postType: dto.post_type,
		title: dto.title,
		description: dto.description,
		categories: [],
		media: mapMedia(dto.post_media ?? []),
		recipe: dto.recipe ? mapRecipe(dto.recipe) : null,
		likesCount: dto.likes_count ?? 0,
		commentsCount: dto.comments_count ?? 0,
		viewsCount: 0,
		savesCount: dto.saves_count ?? 0,
		liked: dto.liked ?? false,
		saved: dto.saved ?? false,
		createdAt: new Date(dto.created_at),
		updatedAt: new Date(dto.created_at),
	}
}
