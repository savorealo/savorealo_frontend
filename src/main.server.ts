import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Función de arranque (bootstrap) para la renderización del lado del servidor (SSR).
 * Inicializa la aplicación Angular utilizando el componente principal App y la configuración de servidor.
 * 
 * @param context El contexto de inicio proporcionado por el motor del servidor.
 */
const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
