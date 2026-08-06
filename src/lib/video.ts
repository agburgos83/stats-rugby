export function cocinarEnlaceVideo(enlace: string): string | null {
	if (!enlace) return '';

	// CASO YOUTUBE
	if (enlace.includes('youtube.com') || enlace.includes('youtu.be')) {
		let codigoFinal = '';

		if (enlace.includes('watch?v=')) {
			// [.split('watch?v=')[1]] extrae el ID, y el [.split('&')[0]] limpia parámetros extras
			codigoFinal = enlace.split('watch?v=')[1].split('&')[0];
		} else if (enlace.includes('youtu.be/')) {
			codigoFinal = enlace.split('youtu.be/')[1].split('?')[0];
		} else if (enlace.includes('/shorts/')) {
			codigoFinal = enlace.split('/shorts/')[1].split('?')[0];
		} else if (enlace.includes('/live/')) {
			codigoFinal = enlace.split('/live/')[1].split('?')[0];
		}

		// Si logramos sacar el ID, armamos la URL de embed oficial
		return codigoFinal
			? 'https://www.youtube.com/embed/' +
					codigoFinal +
					'?enablejsapi=1&origin=' +
					encodeURIComponent(window.location.origin)
			: enlace;
	}

	// CASO VEO (no soporta iframe, se usa <video> nativo vía API)
	if (enlace.includes('veo.co') && enlace.includes('app.veo.co')) {
		return null;
	}

	return enlace;
}

export function formatTime(seconds: number | null | undefined): string {
	if (seconds === null || seconds === undefined) return '--:--:--';

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
