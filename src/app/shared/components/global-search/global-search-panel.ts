import {
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	viewChild,
} from '@angular/core'
import { GlobalSearchStore } from '@core/store/global-search.store'

@Component({
	selector: 'app-global-search-panel',
	templateUrl: './global-search-panel.html',
})
export class GlobalSearchPanel implements OnInit, OnDestroy {
	readonly store = inject(GlobalSearchStore)

	private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput')

	readonly hasResults = computed(() =>
		this.store.users().length > 0 || this.store.posts().length > 0,
	)

	readonly showUsers = computed(() =>
		this.store.tab() !== 'posts' && this.store.users().length > 0,
	)

	readonly showPosts = computed(() =>
		this.store.tab() !== 'users' && this.store.posts().length > 0,
	)

	constructor() {
		// Auto-focus input when panel opens
		effect(() => {
			if (this.store.open()) {
				setTimeout(() => this.inputEl()?.nativeElement.focus(), 50)
			}
		})
	}

	ngOnInit(): void {
		document.addEventListener('keydown', this.handleKeydown)
	}

	ngOnDestroy(): void {
		document.removeEventListener('keydown', this.handleKeydown)
	}

	private readonly handleKeydown = (e: KeyboardEvent): void => {
		// ⌘K or Ctrl+K → open
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault()
			if (this.store.open()) {
				this.store.closePanel()
			} else {
				this.store.openPanel()
			}
			return
		}
		// Escape → close
		if (e.key === 'Escape' && this.store.open()) {
			this.store.closePanel()
		}
	}

	onInput(event: Event): void {
		const val = (event.target as HTMLInputElement).value
		this.store.setQuery(val)
	}

	onSubmit(): void {
		if (this.store.query().trim()) {
			this.store.goToExplore()
		}
	}
}
