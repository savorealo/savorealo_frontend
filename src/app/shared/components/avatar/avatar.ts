import { NgClass } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core'

/**
 * Define los tamaños del avatar disponibles para su visualización.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Componente que representa la imagen o avatar de perfil del usuario.
 * Si no hay una imagen válida disponible, muestra las iniciales del nombre del usuario de forma automática.
 * También soporta insignias para reflejar la presencia en línea u offline.
 */
@Component({
  selector: 'app-avatar',
  imports: [
    NgClass
  ],
  template: `
    <div
      class="avatar"
      [ngClass]="['avatar--' + size, fill ? 'avatar--fill' : '']"
      [attr.aria-label]="name || 'Avatar'"
      role="img"
    >
      @if (src && !imgError) {
        <img
          [src]="src"
          [alt]="name || 'Avatar'"
          (error)="onImgError()"
          class="avatar__img"
        />
      }
      @if(!src || imgError) {
        <span class="avatar__initials">{{ initials }}</span>
      }
 
      @if(showOnline) {
        <span class="avatar__badge avatar__badge--online"></span>
      }
      @if(showOffline) {
        <span class="avatar__badge avatar__badge--offline"></span>
      }
    </div>
  `,
  styleUrl: './avatar.scss',
})
export class Avatar implements OnChanges {
  /**
   * Ruta o URL de la imagen de perfil del usuario.
   */
  @Input() src?: string | null;

  /**
   * Nombre de usuario o nombre completo a partir del cual se extraen las iniciales.
   */
  @Input() name?: string;

  /**
   * El tamaño de visualización del componente. Por defecto es 'md'.
   */
  @Input() size: AvatarSize = "md"

  /**
   * Determina si el avatar se ajusta de forma flexible (fill) rellenando su contenedor.
   */
  @Input() fill = false;

  /**
   * Determina si el usuario está en línea, lo cual dibuja un círculo indicador verde.
   */
  @Input() online?: boolean;

  /**
   * Determina si el usuario está desconectado, lo cual dibuja un círculo indicador gris.
   */
  @Input() offline?: boolean;

  /**
   * Almacena las iniciales calculadas para el nombre de usuario provisto.
   */
  initials = '';

  /**
   * Registra si ocurrió un error al intentar cargar la imagen para activar la renderización alternativa de iniciales.
   */
  imgError = false;

  /**
   * Devuelve si debe visualizarse el estado online del usuario.
   */
  get showOnline() { return this.online === true; }

  /**
   * Devuelve si debe visualizarse el estado offline del usuario.
   */
  get showOffline() { return this.offline === true && !this.online; }

  /**
   * Responde ante cambios en las entradas del componente restableciendo el estado de error de la imagen y recalculando las iniciales.
   */
  ngOnChanges(): void {
    this.imgError = false;
    this.initials = this.getInitials(this.name);
  }

  /**
   * Manejador ejecutado ante un error en la carga de la imagen de perfil de origen para activar el fallback.
   */
  onImgError(): void {
    this.imgError = true;
  }

  /**
   * Procesa la cadena de texto de nombre provista para devolver la primera letra del primer término y la del último término.
   */
  private getInitials(name?: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
