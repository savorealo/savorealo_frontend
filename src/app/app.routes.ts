import { Routes } from '@angular/router'
import { authGuard, authMatchGuard } from '@core/guards/auth.guard'
import { guestGuard, guestMatchGuard } from '@core/guards/guest.guard'

export const routes: Routes = [
    {
        path: 'auth',
        title: 'Acceso | Savorealo',
        canMatch: [guestMatchGuard],
        canActivate: [guestGuard],
        loadComponent: () => import('@features/auth/auth').then(component => component.Auth),
    },
    {
        path: '',
        title: 'Inicio | Savorealo',
        pathMatch: 'full',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/feed/feed-page').then(component => component.FeedPage),
    },
    {
        path: 'explore',
        title: 'Explorar | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/explore/explore-page').then(component => component.ExplorePage),
    },
    {
        path: 'ai',
        title: 'IA Recetas | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/ai-recipes/ai-recipes-page').then(component => component.AiRecipesPage),
    },
    {
        path: 'saved',
        title: 'Guardados | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/saved/saved-page').then(component => component.SavedPage),
    },
    {
        path: 'chat',
        title: 'Mensajes | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/messages/messages-page').then(component => component.MessagesPage),
    },
    {
        path: 'profile',
        title: 'Perfil | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/profile/profile').then(component => component.Profile),
    },
    {
        path: 'notifications',
        title: 'Notificaciones | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/notifications/notifications-page').then(c => c.NotificationsPage),
    },
    {
        path: 'settings',
        title: 'Ajustes | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/settings/settings-page').then(component => component.SettingsPage),
    },
    {
        path: 'post/:id',
        title: 'Receta | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/post-detail/post-detail-page').then(c => c.PostDetailPage),
    },
    {
        path: 'cook/:id',
        title: 'Modo Cocina | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/cooking-mode/cooking-mode-page').then(c => c.CookingModePage),
    },
    {
        path: 'profile/:username',
        title: 'Perfil | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/profile/public-profile-page').then(c => c.PublicProfilePage),
    },
    {
        path: 'places',
        title: 'Lugares | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/places/places-page').then(c => c.PlacesPage),
    },
    {
        path: 'places/:id',
        title: 'Lugar | Savorealo',
        canMatch: [authMatchGuard],
        canActivate: [authGuard],
        loadComponent: () => import('@features/places/place-detail-page').then(c => c.PlaceDetailPage),
    },
    {
        path: '**',
        redirectTo: '',
    },
]
