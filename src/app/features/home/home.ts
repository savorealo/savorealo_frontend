import { Component, inject, OnInit } from '@angular/core'
import { AuthStore } from '@core/auth/auth.store'
import { Router } from '@angular/router';
import { Button } from "primeng/button";
import { Avatar } from "@shared/components/avatar/avatar";

@Component({
  selector: 'app-home',
  imports: [Button, Avatar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  private authStore = inject(AuthStore);
  private router = inject(Router)
  currentUSer = this.authStore.profile
  currentUserMetadata = this.authStore.user

  logout(){
    this.authStore.logout()
    this.router.navigate(["auth"])
  }

  ngOnInit(): void {
    console.log(this.currentUserMetadata()) 
  }
}
