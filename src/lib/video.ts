const cacheEmbedYouTube = new Map<string, Promise<boolean>>();

export function extraerYouTubeId(enlace: string): string | null {
	if (enlace.includes('watch?v=')) return enlace.split('watch?v=')[1].split('&')[0];
	if (enlace.includes('youtu.be/')) return enlace.split('youtu.be/')[1].split('?')[0];
	if (enlace.includes('/shorts/')) return enlace.split('/shorts/')[1].split('?')[0];
	if (enlace.includes('/live/')) return enlace.split('/live/')[1].split('?')[0];
	return null;
}

export function cocinarEnlaceVideo(
	enlace: string,
	opciones?: { controls?: boolean }
): string | null {
	if (!enlace) return '';

	if (enlace.includes('youtube.com') || enlace.includes('youtu.be')) {
		const codigoFinal = extraerYouTubeId(enlace);
		if (!codigoFinal) return enlace;
		const params = new URLSearchParams({
			enablejsapi: '1',
			origin: window.location.origin,
			controls: opciones?.controls === false ? '0' : '1',
			modestbranding: '1',
			rel: '0',
			showinfo: '0',
			iv_load_policy: '3',
			playsinline: '1',
			fs: '0'        
		});
		return `https://www.youtube.com/embed/${codigoFinal}?${params}`;
	}


	// CASO VEO (no soporta iframe, se usa <video> nativo vía API)
	if (enlace.includes('veo.co') && enlace.includes('app.veo.co')) {
		return null;
	}

	return enlace;
}

export function chequearEmbedYouTube(videoId: string): Promise<boolean> {
	let pendiente = cacheEmbedYouTube.get(videoId);
	if (!pendiente) {
		pendiente = fetch(
			`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
		)
			.then((r) => r.ok)
			.catch(() => true); // si falla la consulta, asumir permitido
		cacheEmbedYouTube.set(videoId, pendiente);
	}
	return pendiente;
}

export async function obtenerVideoVeo(slug: string, signal?: AbortSignal): Promise<string | null> {
	const res = await fetch(`/api/veo-video?slug=${encodeURIComponent(slug)}`, { signal });
	if (!res.ok) throw new Error('Error de la API de Veo');
	const data = await res.json();
	return data.videoUrl ?? null;
}

export function formatTime(seconds: number | null | undefined): string {
	if (seconds === null || seconds === undefined) return '--:--:--';

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
