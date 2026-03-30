import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warn';


/*TODO: Internacionalizar en el futuro */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private message = inject(MessageService);
  
  success(detail: string, summary = '¡Listo!') {
    this.show('success', summary, detail);
  }

  error(detail: string, summary = 'Algo salió mal') {
    this.show('error', summary, detail);
  }

  info(detail: string, summary = 'Aviso') {
    this.show('info', summary, detail);
  }

  warn(detail: string, summary = 'Atención') {
    this.show('warn', summary, detail);
  }

  private show(severity: ToastSeverity, summary: string, detail: string) {
    this.message.add({ severity, summary, detail, life: 3000 });
  }
}
