import { Component, inject, OnDestroy, output } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { AuthStore } from '@core/store/auth.store'

@Component({
	selector: 'app-explore-topbar',
	imports: [RouterLink],
	templateUrl: './explore-topbar.html',
})
export class ExploreTopbar implements OnDestroy {
	private readonly auth = inject(AuthStore)
	private readonly inputSubject = new Subject<string>()

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'

	readonly create = output<void>()
	readonly queryChange = output<string>()

	constructor() {
		this.inputSubject.pipe(
			debounceTime(350),
			distinctUntilChanged(),
		).subscribe(q => this.queryChange.emit(q))
	}

	onSearch(event: Event): void {
		this.inputSubject.next((event.target as HTMLInputElement).value)
	}

	ngOnDestroy(): void {
		this.inputSubject.complete()
	}
}
