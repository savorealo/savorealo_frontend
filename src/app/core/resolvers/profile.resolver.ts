/* // ─── profileResolver ─────────────────────────────────────────────────────────
// Pre-carga el perfil del usuario por :username.
// Si no existe, redirige al 404.

import { inject } from "@angular/core";
import { ResolveFn, Router } from "@angular/router";
import { User } from "@core/models/user/User";
import { catchError, EMPTY } from "rxjs";

export const profileResolver: ResolveFn<User> = (route) => {
	const profileService = inject(ProfileService);
	const router = inject(Router);
	const username = route.paramMap.get('username')!;

	return profileService.getByUsername(username).pipe(
		catchError(() => {
			router.navigate(['/not-found']);
			return EMPTY;
		})
	);
};
 */
