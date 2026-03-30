import { Component, inject, signal } from '@angular/core'
import { AuthStore } from '@core/auth/auth.store';
import { AppShell } from "@shared/components/app-shell/app-shell";
import { Avatar } from "@shared/components/avatar/avatar";
import { Button } from "primeng/button";
import { ImageModule } from 'primeng/image';
import { TabsModule } from 'primeng/tabs';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { EditProfileComponent } from "./edit-profile/edit-profile";

@Component({
  selector: 'app-profile',
  imports: [
    AppShell,
    Avatar,
    Button,
    ImageModule,
    TabsModule,
    DrawerModule,
    DialogModule,
    EditProfileComponent
],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {

  router = inject(Router)
  authService = inject(AuthStore)
  success = signal<boolean | null>(null)

  profile = this.authService.profile;


  followersVisible: boolean = false;
  editVisible: boolean = false;
  showEditProfile = signal(false);

  openFollowing() {
    console.log("hye")
  }
  openFollowers() {
    console.log("jola")
  }

  logOut(){
    this.authService.logout()
    this.router.navigate(["auth"])
  }

  updateUser(){
    this.authService.updateProfile({
      username: "newUsername"
    }).subscribe({
      next: ()=>{ this.success.set(true) },
      error: ()=>{ this.success.set(false) }
    })
  }
}
