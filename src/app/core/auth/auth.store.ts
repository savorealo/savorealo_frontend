import { computed, inject, Injectable, signal, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LoginUser } from "@core/models/user/User";
import { AuthService } from "@core/services/auth.service";
import { User } from "@supabase/supabase-js"; /* Actualizar import por el del model */
import { catchError, finalize, map, Observable, tap, throwError } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuthStore {
	private authService = inject(AuthService);

	/* Estados privados de nuestra app */
	private readonly _user = signal<User | null>(null)
	private readonly _loading = signal(false)
	private readonly _error = signal<string | null>(null)

	// API pública de solo lectura
	readonly user = this._user.asReadonly()
	readonly loading = this._loading.asReadonly()
	readonly error = this._error.asReadonly()

	// Computed
	readonly isAuthenticated = computed(() => this._user() !== null)
	readonly currentUserId = computed(() => this._user()?.id ?? null)

	constructor(private destroyRef: DestroyRef) {
		// Rehidratar sesión al arrancar la app
		this.restoreSession()
		// Escuchar cambios de sesión (logout desde otra pestaña, token expirado, etc.)
		this.authService.onAuthStateChange().pipe(
			takeUntilDestroyed(this.destroyRef)
		).subscribe(({ session }) => {
			this._user.set(session?.user ?? null)
		})
	}

	login(user: LoginUser): Observable<void> {
		this._loading.set(true)
		this._error.set(null)
		return this.authService.login(user).pipe(
			tap(({ data, error }) => {
				if (error) throw error
				this._user.set(mapSupabaseUser(data.user!))
			}),
			catchError(err => {
				this._error.set(err.message)
				return throwError(() => err)
			}),
			finalize(() => this._loading.set(false)),
			map(() => void 0)
		)
	}

	logout(): void {
		this.authService.logout().subscribe(() => {
			this._user.set(null)
		})
	}
	private restoreSession(): void {
		this.authService.getSession().subscribe(({ data }) => {
			if (data?.session?.user) {
				this._user.set(data.session.user)
			}
		})
	}

}

function mapSupabaseUser(user: User): User {
	return user;
}

