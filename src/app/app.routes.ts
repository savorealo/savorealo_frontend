import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { Auth } from "@features/auth/auth";
import { Home } from '@features/home/home';


export const routes: Routes = [
    {
        path: "auth",
        component: Auth
    },
    {
        path: "",
        component: Home,
        canActivate: [authGuard]
    }
];
