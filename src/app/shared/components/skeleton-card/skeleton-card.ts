import { Component } from '@angular/core'
import { Skeleton } from 'primeng/skeleton'

@Component({
	selector: 'app-skeleton-card',
	imports: [Skeleton],
	template: `
		<article class="mx-auto grid w-full max-w-[500px] gap-4 rounded-2xl border border-outline bg-surface-container p-4 shadow-1">
			<header class="flex items-center gap-3">
				<p-skeleton shape="circle" size="3rem" />
				<div class="grid flex-1 gap-2">
					<p-skeleton width="42%" height="0.9rem" />
					<p-skeleton width="28%" height="0.75rem" />
				</div>
				<p-skeleton shape="circle" size="2.25rem" />
			</header>
			<div class="grid gap-2">
				<p-skeleton width="90%" />
				<p-skeleton width="70%" />
			</div>
			<p-skeleton width="100%" height="13rem" borderRadius="12px" />
			<footer class="flex gap-3">
				<p-skeleton width="5rem" height="2.25rem" borderRadius="999px" />
				<p-skeleton width="5rem" height="2.25rem" borderRadius="999px" />
				<p-skeleton width="5rem" height="2.25rem" borderRadius="999px" />
			</footer>
		</article>
	`,
})
export class SkeletonCard {}
