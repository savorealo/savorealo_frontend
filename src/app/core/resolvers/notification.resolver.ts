/* // ─── notificationsResolver ────────────────────────────────────────────────────
// Pre-carga notificaciones y las marca como vistas.

import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { catchError, EMPTY } from "rxjs";

export const notificationsResolver: ResolveFn<Notification[]> = () => {
	const notificationsService = inject(NotificationsService);

	return notificationsService.getAndMarkAsSeen().pipe(
		catchError(() => EMPTY)
	);
};
 */
