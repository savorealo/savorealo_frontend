import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { ShoppingListService } from './shopping-list.service'
import { ToastService } from '@core/services/toast.service'
import { AppShell } from '@shared/components/app-shell/app-shell'

@Component({
	selector: 'app-shopping-list-page',
	imports: [AppShell, RouterLink, FormsModule],
	templateUrl: './shopping-list-page.html',
})
export class ShoppingListPage {
	private readonly toast = inject(ToastService)
	readonly list = inject(ShoppingListService)

	readonly confirmClear = signal(false)
	readonly checkedCount = computed(() => this.list.items().filter(i => i.checked).length)

	// ─── Input manual ────────────────────────────────────────────────
	readonly manualName     = signal('')
	readonly manualQuantity = signal('')
	readonly manualUnit     = signal('')

	addManual(): void {
		const name = this.manualName().trim()
		if (!name) return
		const qty = parseFloat(this.manualQuantity())
		this.list.addManual(name, isNaN(qty) ? undefined : qty, this.manualUnit().trim() || undefined)
		this.manualName.set('')
		this.manualQuantity.set('')
		this.manualUnit.set('')
	}

	toggleItem(key: string): void {
		this.list.toggleItem(key)
	}

	removeGroup(recipeId: string): void {
		this.list.removeRecipe(recipeId)
		this.toast.info('Ingredientes eliminados de la lista')
	}

	clearChecked(): void {
		this.list.clearChecked()
		this.toast.info('Ingredientes marcados eliminados')
	}

	clearAll(): void {
		this.list.clearAll()
		this.confirmClear.set(false)
		this.toast.info('Lista vaciada')
	}

	amazonUrl(ingredientName: string): string {
		return `https://www.amazon.es/s?k=${encodeURIComponent(ingredientName)}`
	}

	async share(): Promise<void> {
		const text = this.list.buildShareText()
		if (navigator.share) {
			try {
				await navigator.share({ title: 'Mi lista de la compra', text })
			} catch { /* usuario canceló */ }
		} else {
			await navigator.clipboard.writeText(text)
			this.toast.success('Lista copiada al portapapeles')
		}
	}
}
