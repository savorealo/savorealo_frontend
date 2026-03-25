import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
	name: 'truncate',
})
/* Archivo inspirado en:
	https://blog.bitsrc.io/how-to-use-the-truncate-pipe-in-angular-64b01f3c8411
*/

export class TruncateTextPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }


	transform(value: string, words: number): SafeHtml {
		const replacedNewLines = value?.replace(/\n/g, '<br>');
		const truncatedText = this.truncate(replacedNewLines, words);

		return this.sanitizer.bypassSecurityTrustHtml(truncatedText);
	}

	/* Trunca el texto a un número limitado de palabras
	 */
	private truncate(text: string, wordLimit: number): string {
		const words = text.split(' ');
		const truncatedWords = words.slice(0, wordLimit);
		const reaminingWords = words.slice(wordLimit);

		let trucantedText = truncatedWords.join(' ');

		if (reaminingWords.length > 0) {
			trucantedText += '...';
		}
		return trucantedText;
	}

}
