/* // ─── feedResolver ─────────────────────────────────────────────────────────────
// Pre-carga la primera página del feed.
// Usa catchError para devolver feed vacío en lugar de crashear.

import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { catchError, EMPTY } from "rxjs";

export const feedResolver: ResolveFn<FeedData> = () => {
	const feedService = inject(FeedService);

	return feedService.getInitialFeed().pipe(
		catchError(() => EMPTY)
	);
};
 */
