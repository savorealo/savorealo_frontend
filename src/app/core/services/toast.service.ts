import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Tipo de dato personalizado para toastseverity.
 */
export type ToastSeverity = 'success' | 'error' | 'info' | 'warn';


/*TODO: Internacionalizar en el futuro */
/**
 * Servicio que provee la lógica de negocio para los mensajes de notificación flotantes.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /**
   * Constructor de la clase o componente para inicializar dependencias.
   */
  constructor(private message: MessageService) { }

  /**
   * Método para éxito.
   */
  success(detail: string, summary = '¡Listo!') {
    this.show('success', summary, detail);
  }

  /**
   * Método para error.
   */
  error(detail: string, summary = 'Algo salió mal') {
    this.show('error', summary, detail);
  }

  /**
   * Método para info.
   */
  info(detail: string, summary = 'Aviso') {
    this.show('info', summary, detail);
  }

  /**
   * Método para warn.
   */
  warn(detail: string, summary = 'Atención') {
    this.show('warn', summary, detail);
  }

  /**
   * Método para mostrar.
   */
  private show(severity: ToastSeverity, summary: string, detail: string) {
    this.message.add({ severity, summary, detail, life: 3000 });
  }
}
