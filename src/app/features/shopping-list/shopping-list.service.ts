import { computed, Injectable, signal } from '@angular/core'
import { Recipe } from '@core/models/post/post.model'

export interface ShoppingItem {
	key: string
	ingredientId: string
	name: string
	quantity: number
	unit: string
	notes: string | null
	recipeId: string
	recipeName: string
	checked: boolean
	addedAt: number
}

export interface ShoppingGroup {
	recipeId: string
	recipeName: string
	items: ShoppingItem[]
	allChecked: boolean
}

const STORAGE_KEY = 'savorealo:shoppingList'

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
	readonly items = signal<ShoppingItem[]>(this.load())

	readonly groups = computed<ShoppingGroup[]>(() => {
		const map = new Map<string, ShoppingGroup>()
		for (const item of this.items()) {
			if (!map.has(item.recipeId)) {
				map.set(item.recipeId, { recipeId: item.recipeId, recipeName: item.recipeName, items: [], allChecked: false })
			}
			map.get(item.recipeId)!.items.push(item)
		}
		for (const group of map.values()) {
			group.allChecked = group.items.every(i => i.checked)
		}
		return [...map.values()]
	})

	readonly totalCount    = computed(() => this.items().length)
	readonly uncheckedCount = computed(() => this.items().filter(i => !i.checked).length)

	addManual(name: string, quantity?: number, unit?: string): void {
		const key = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`
		const item: ShoppingItem = {
			key,
			ingredientId: key,
			name: name.trim(),
			quantity: quantity ?? 0,
			unit: unit?.trim() ?? '',
			notes: null,
			recipeId: 'manual',
			recipeName: 'Mis ingredientes',
			checked: false,
			addedAt: Date.now(),
		}
		this.items.update(curr => [...curr, item])
		this.save()
	}

	addFromRecipe(recipe: Recipe, postTitle: string): number {
		const recipeName = recipe.name || postTitle || 'Receta'
		const existing = new Set(this.items().map(i => i.key))
		const now = Date.now()
		const toAdd: ShoppingItem[] = []

		for (const ing of recipe.ingredients) {
			const key = `${recipe.id}_${ing.ingredientId}`
			if (!existing.has(key)) {
				toAdd.push({
					key,
					ingredientId: ing.ingredientId,
					name: ing.name,
					quantity: ing.quantity,
					unit: ing.unit,
					notes: ing.notes,
					recipeId: recipe.id,
					recipeName,
					checked: false,
					addedAt: now,
				})
			}
		}

		if (toAdd.length > 0) {
			this.items.update(curr => [...curr, ...toAdd])
			this.save()
		}
		return toAdd.length
	}

	hasRecipe(recipeId: string): boolean {
		return this.items().some(i => i.recipeId === recipeId)
	}

	toggleItem(key: string): void {
		this.items.update(curr => curr.map(i => i.key === key ? { ...i, checked: !i.checked } : i))
		this.save()
	}

	removeItem(key: string): void {
		this.items.update(curr => curr.filter(i => i.key !== key))
		this.save()
	}

	removeRecipe(recipeId: string): void {
		this.items.update(curr => curr.filter(i => i.recipeId !== recipeId))
		this.save()
	}

	clearChecked(): void {
		this.items.update(curr => curr.filter(i => !i.checked))
		this.save()
	}

	clearAll(): void {
		this.items.set([])
		this.save()
	}

	buildShareText(): string {
		const lines: string[] = ['🛒 Mi lista de la compra — Savorealo', '']
		for (const group of this.groups()) {
			lines.push(`📋 ${group.recipeName}`)
			for (const item of group.items) {
				const check = item.checked ? '✅' : '◻️'
				const qty = item.quantity ? `${item.quantity} ${item.unit}` : ''
				lines.push(`  ${check} ${item.name}${qty ? '  (' + qty + ')' : ''}`)
			}
			lines.push('')
		}
		return lines.join('\n').trim()
	}

	private save(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()))
		} catch { /* ignorar */ }
	}

	private load(): ShoppingItem[] {
		try {
			if (typeof localStorage === 'undefined') return []
			const raw = localStorage.getItem(STORAGE_KEY)
			return raw ? (JSON.parse(raw) as ShoppingItem[]) : []
		} catch { return [] }
	}
}
