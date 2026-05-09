import { Component, inject, OnInit } from '@angular/core'
import { AuthStore } from '@core/store/auth.store'
import { Router } from '@angular/router';
import { AppShell } from "@shared/components/app-shell/app-shell";

@Component({
  selector: 'app-home',
  imports: [AppShell],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  private authStore = inject(AuthStore);
  private router = inject(Router)
  currentUSer = this.authStore.profile

  ngOnInit(): void {
    console.log(this.currentUSer())
  }

  logout(){
    this.authStore.logout()
    this.router.navigate(["/auth"])
  }
}
