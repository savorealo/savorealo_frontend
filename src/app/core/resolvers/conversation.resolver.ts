/* // ─── conversationResolver ─────────────────────────────────────────────────────
// Pre-carga una conversación por :conversationId.
// Si el usuario no tiene acceso (403), redirige a la bandeja de entrada.

import { inject } from "@angular/core";
import { ResolveFn, Router } from "@angular/router";
import { Conversation } from "@core/models/conversation/conversation.model";
import { catchError, EMPTY } from "rxjs";

export const conversationResolver: ResolveFn<Conversation> = (route) => {
	const messagesService = inject(MessagesService);
	const router = inject(Router);
	const conversationId = route.paramMap.get('conversationId')!;

	return messagesService.getConversation(conversationId).pipe(
		catchError((err) => {
			if (err.status === 403) {
				router.navigate(['/messages']);
			} else {
				router.navigate(['/not-found']);
			}
			return EMPTY;
		})
	);
};
 */
