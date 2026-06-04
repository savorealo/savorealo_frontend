import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms'
import { Observable, of, timer } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs'
import { UserService } from '@core/services/user.service'
import { validateUsernameFormat } from './username'

/** Validador síncrono de formato (feedback inmediato). */
export const usernameFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
	const value = (control.value ?? '').trim()
	if (!value) return null // `required` se encarga del vacío
	const error = validateUsernameFormat(value)
	return error ? { usernameFormat: error } : null
}

/**
 * Validador asíncrono de disponibilidad: debounce + `checkUsername` del backend.
 * Ignora valores que ya fallan el formato (evita pegar al backend en balde).
 */
export function usernameAvailableValidator(userService: UserService): AsyncValidatorFn {
	return (control: AbstractControl): Observable<ValidationErrors | null> => {
		const value = (control.value ?? '').trim()
		if (!value || validateUsernameFormat(value)) return of(null)
		return timer(400).pipe(
			switchMap(() => userService.checkUsername(value)),
			map(res => {
				if (res.valid && res.available) return null
				return { usernameUnavailable: res.reason ?? 'Ese usuario no está disponible.' }
			}),
			catchError(() => of(null)),
		)
	}
}
