import { CanActivateFn } from "@angular/router";

export interface HasUnsavedChanges {
	hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanActivateFn = (_route, _state, component?: HasUnsavedChanges) => {
	if (!component?.hasUnsavedChanges()) return true;

	return confirm(
		/* TODO: internacionalizar */
		'¿Seguro que quieres salir? Los cambios no guardados se perderán.'
	);
};
