import { Routes } from '@angular/router'
import { authGuard } from '@core/guards/auth.guard'
import { guestGuard } from '@core/guards/guest.guard'

export const routes: Routes = [

	// Rutas públicas — redirige al feed si ya tiene sesión
	{
		path: 'auth',
		canActivate: [guestGuard],
		children: [
			{
				path: 'login',
				loadComponent: () =>
					import('@features/auth/login/login.component')
						.then(m => m.LoginComponent),
			},
			{
				path: 'register',
				loadComponent: () =>
					import('@features/auth/register/register.component')
						.then(m => m.RegisterComponent),
			},
			{ path: '', redirectTo: 'login', pathMatch: 'full' },
		],
	},

	// Rutas privadas — redirige a login si no tiene sesión
	{
		path: '',
		canActivate: [authGuard],
		children: [
			{
				path: 'feed',
				loadComponent: () =>
					import('@features/feed/feed-page.component')
						.then(m => m.FeedPageComponent),
			},
			{
				path: 'profile/:id',
				loadChildren: () =>
					import('@features/profile/profile.routes')
						.then(m => m.PROFILE_ROUTES),
			},
			{ path: '', redirectTo: 'feed', pathMatch: 'full' },
		],
	},

	// Cualquier ruta desconocida → feed (el guard decide si hay sesión)
	{ path: '**', redirectTo: 'feed' },
]
