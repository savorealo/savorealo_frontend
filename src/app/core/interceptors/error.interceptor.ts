import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { ToastService } from "@core/services/toast.service";
import { catchError, throwError } from "rxjs";


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
	const router = inject(Router);
	const toast = inject(ToastService);

	return next(req).pipe(
		catchError((err: HttpErrorResponse) => {
			switch (err.status) {
				case 403:
					toast.error('No tienes permiso para realizar esta acción.');
					break;
				case 404:
					router.navigate(['/not-found']);
					break;
				case 429:
					toast.warn('Demasiadas peticiones. Espera un momento.');
					break;
				case 0:
				case 503:
					toast.error('Sin conexión al servidor. Revisa tu internet.');
					break;
			}
			return throwError(() => err);
		})
	);

	return next(req);
};
