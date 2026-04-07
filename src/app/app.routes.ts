import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { Auth } from "@features/auth/auth";
import { Home } from '@features/home/home';
import { Profile } from '@features/profile/profile';


export const routes: Routes = [
    {
        path: "auth",
        component: Auth
    },
    {
        path: "",
        component: Home,
        canActivate: [authGuard]
    },
    {
        path: "profile",
        component: Profile,
        canActivate: [authGuard]
    }
];
