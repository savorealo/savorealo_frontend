// src/app/features/feed/models/post.mapper.ts
import { PostDto } from './post.dto'
import { Post, PostAuthor, PostMedia, Recipe, RecipeIngredient } from './post.model'

function mapAuthor(dto: PostDto['user']): PostAuthor {
	const isPerson = dto.user_type === 'PERSON'
	return {
		id: dto.id,
		name: isPerson
			? (dto.person_profile?.full_name ?? null)
			: (dto.business_profile?.business_name ?? null),
		username: isPerson ? (dto.person_profile?.username ?? null) : null,
		photoUrl: isPerson
			? (dto.person_profile?.photo_url ?? null)
			: (dto.business_profile?.photo_url ?? null),
	}
}

function mapMedia(dto: PostDto['post_media']): PostMedia[] {
	return dto
		.sort((a, b) => a.position - b.position)
		.map(m => ({
			id: m.id,
			url: m.media_url,
			type: m.media_type,
			position: m.position,
		}))
}

function mapRecipe(dto: NonNullable<PostDto['recipe']>): Recipe {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		steps: dto.steps,
		timeRequired: dto.time_required,
		estimatedCost: dto.estimated_cost,
		servings: dto.servings,
		difficulty: dto.difficulty,
		ingredients: dto.recipe_ingredients.map((ri): RecipeIngredient => ({
			ingredientId: ri.ingredient_id,
			name: ri.ingredient.name,
			unit: ri.ingredient.unit,
			quantity: ri.quantity,
			notes: ri.notes,
		})),
	}
}

export function mapPostDtoToPost(dto: PostDto): Post {
	return {
		id: dto.id,
		authorId: dto.user_id,
		author: mapAuthor(dto.user),
		postType: dto.post_type,
		title: dto.title,
		description: dto.description,
		categories: dto.categories ?? [],
		media: mapMedia(dto.post_media),
		recipe: dto.recipe ? mapRecipe(dto.recipe) : null,
		likesCount: dto.likes_count,
		commentsCount: dto.comments_count,
		viewsCount: dto.views_count,
		savesCount: dto.saves_count,
		liked: dto.liked,
		saved: dto.saved,
		createdAt: new Date(dto.created_at),
		updatedAt: new Date(dto.updated_at),
	}
}
