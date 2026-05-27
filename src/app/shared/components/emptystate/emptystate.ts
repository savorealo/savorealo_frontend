import { Component, Input } from '@angular/core'
import { NgIf } from '@angular/common'
import { ButtonComponent } from '../button/button';

/**
 * Uso:
 * <!-- Uso -->
<app-empty-state
  icon="pi pi-book"
  title="Aún no hay recetas"
  description="Sé el primero en publicar algo delicioso."
  actionLabel="Crear receta"
  [onAction]="goToCreate"
/>

<app-empty-state
  icon="pi pi-users"
  title="Sin seguidores todavía"
  description="Comparte tu perfil para que te descubran."
/>

<app-empty-state
  icon="pi pi-search"
  title="Sin resultados"
  description="Prueba con otro término de búsqueda."
/>
*/


@Component({
  selector: 'app-emptystate',
  imports: [ButtonComponent, NgIf],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">

      <div class="text-5xl">
        @if (icon.startsWith('pi ')) {
          <i [class]="icon"></i>
        } @else {
          {{ icon }}
        }
      </div>

      <div class="flex flex-col gap-1 max-w-xs">
        <h3 class="text-title-md font-bold text-on-surface">
          {{ title }}
        </h3>
        @if(description) {
          <p class="text-body-sm text-on-surface-muted">
            {{ description }}
          </p>
        }
      </div>
      <app-button
        *ngIf="actionLabel"
        [label]="actionLabel"
        variant="primary"
        size="sm"
        (click)="onAction()"
      />
    </div>
  `,
})
export class Emptystate {
  /**
   * Propiedad para gestionar icon.
   */
  @Input() icon = 'pi pi-inbox';
  /**
   * Propiedad para gestionar título.
   */
  @Input() title = 'Nada por aquí';
  /**
   * Propiedad para gestionar descripción.
   */
  @Input() description = '';
  /**
   * Propiedad para gestionar action label.
   */
  @Input() actionLabel = '';
  /**
   * Propiedad para gestionar evento de action.
   */
  @Input() onAction: () => void = () => { };
}
