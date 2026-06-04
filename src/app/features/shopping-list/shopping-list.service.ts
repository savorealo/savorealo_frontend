import { computed, Injectable, signal } from '@angular/core'
import { Recipe } from '@core/models/post/post.model'

/**
 * Estructura de datos que representa a un ingrediente o artículo dentro de la lista de compras del usuario.
 */
export interface ShoppingItem {
	/**
	 * Clave identificadora única del artículo en la lista.
	 */
	key: string

	/**
	 * Identificador del ingrediente relacionado en el sistema.
	 */
	ingredientId: string

	/**
	 * Nombre o descripción legible del ingrediente.
	 */
	name: string

	/**
	 * Cantidad requerida del ingrediente.
	 */
	quantity: number

	/**
	 * Unidad de medida del ingrediente (ej. g, ml, unidades).
	 */
	unit: string

	/**
	 * Anotaciones o detalles adicionales sobre el ingrediente.
	 */
	notes: string | null

	/**
	 * Identificador de la receta a la que pertenece este artículo ('manual' para artículos añadidos por el usuario).
	 */
	recipeId: string

	/**
	 * Título legible de la receta origen.
	 */
	recipeName: string

	/**
	 * Indica si el artículo ha sido tachado o comprado.
	 */
	checked: boolean

	/**
	 * Marca de tiempo milisegundos que registra la fecha en que se añadió.
	 */
	addedAt: number
}

/**
 * Agrupación de artículos de compra bajo una misma receta origen.
 */
export interface ShoppingGroup {
	/**
	 * Identificador único de la receta origen.
	 */
	recipeId: string

	/**
	 * Nombre legible de la receta origen.
	 */
	recipeName: string

	/**
	 * Conjunto de artículos asociados a esta agrupación.
	 */
	items: ShoppingItem[]

	/**
	 * Indica si todos los artículos de esta agrupación han sido comprados.
	 */
	allChecked: boolean
}

/**
 * Clave utilizada para persistir el estado de la lista de compras en localStorage.
 */
const STORAGE_KEY = 'savorealo:shoppingList'

/**
 * Servicio inyectable global para gestionar de forma reactiva la lista de la compra del usuario.
 * Proporciona persistencia en localStorage, adición por recetas, tachado y generación de texto para compartir.
 */
@Injectable({ providedIn: 'root' })
export class ShoppingListService {
	/**
	 * Señal reactiva que contiene todos los artículos de la lista de compras.
	 */
	readonly items = signal<ShoppingItem[]>(this.load())

	/**
	 * Señal calculada que estructura y agrupa los artículos según su receta original.
	 */
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

	/**
	 * Señal calculada con el número total de artículos en la lista de compras.
	 */
	readonly totalCount    = computed(() => this.items().length)

	/**
	 * Señal calculada con el número de artículos pendientes por comprar.
	 */
	readonly uncheckedCount = computed(() => this.items().filter(i => !i.checked).length)

	/**
	 * Agrega de manera manual un ingrediente personalizado a la sección Mis Ingredientes.
	 * @param name Nombre del artículo.
	 * @param quantity Cantidad opcional.
	 * @param unit Unidad opcional.
	 */
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

	/**
	 * Añade de golpe a la lista todos los ingredientes que pertenezcan a una receta dada.
	 * @param recipe La receta que contiene los ingredientes.
	 * @param postTitle El título opcional del post.
	 * @returns El número de artículos nuevos que han sido insertados.
	 */
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

	/**
	 * Comprueba si ya existen ingredientes en la lista pertenecientes a una determinada receta.
	 * @param recipeId El identificador de la receta.
	 */
	hasRecipe(recipeId: string): boolean {
		return this.items().some(i => i.recipeId === recipeId)
	}

	/**
	 * Alterna el estado tachado (checked) de un artículo individual según su clave única.
	 * @param key Clave única del artículo.
	 */
	toggleItem(key: string): void {
		this.items.update(curr => curr.map(i => i.key === key ? { ...i, checked: !i.checked } : i))
		this.save()
	}

	/**
	 * Elimina un artículo individual de la lista de compras según su clave.
	 * @param key Clave única del artículo.
	 */
	removeItem(key: string): void {
		this.items.update(curr => curr.filter(i => i.key !== key))
		this.save()
	}

	/**
	 * Quita de la lista de compras todos los ingredientes asociados a una receta origen en concreto.
	 * @param recipeId El identificador de la receta origen.
	 */
	removeRecipe(recipeId: string): void {
		this.items.update(curr => curr.filter(i => i.recipeId !== recipeId))
		this.save()
	}

	/**
	 * Purga todos los artículos tachados de la lista de la compra.
	 */
	clearChecked(): void {
		this.items.update(curr => curr.filter(i => !i.checked))
		this.save()
	}

	/**
	 * Elimina de manera completa todos los artículos de la lista de compras.
	 */
	clearAll(): void {
		this.items.set([])
		this.save()
	}

	/**
	 * Genera un bloque de texto formateado listo para ser compartido por portapapeles o redes sociales.
	 */
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

	/**
	 * Guarda de manera persistente los artículos actuales en el almacenamiento local (localStorage).
	 */
	private save(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()))
		} catch { /* ignorar */ }
	}

	/**
	 * Recupera el listado serializado de artículos de compra desde localStorage si existe.
	 */
	private load(): ShoppingItem[] {
		try {
			if (typeof localStorage === 'undefined') return []
			const raw = localStorage.getItem(STORAGE_KEY)
			return raw ? (JSON.parse(raw) as ShoppingItem[]) : []
		} catch { return [] }
	}
}
