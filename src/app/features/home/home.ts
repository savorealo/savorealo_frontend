import { Component, inject } from '@angular/core'
import { AuthStore } from '@core/auth/auth.store'
import { Router } from '@angular/router';
import { Button } from "primeng/button";

@Component({
  selector: 'app-home',
  imports: [Button],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private authStore = inject(AuthStore);
  private router = inject(Router)
  currentUSer = this.authStore.user

  logout(){
    this.authStore.logout()
    this.router.navigate(["auth"])
  }
}
