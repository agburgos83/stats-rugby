import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');
	if (!slug) {
		return json({ error: 'Falta el parámetro slug' }, { status: 400 });
	}

	try {
		const res = await fetch(
			`https://app.veo.co/api/app/matches/${encodeURIComponent(slug)}/videos/`,
			{
				headers: {
					Accept: 'application/json'
				}
			}
		);

		if (!res.ok) {
			return json({ error: `Veo API respondió con ${res.status}` }, { status: res.status });
		}

		const videos: Array<{
			url: string;
			render_type: string;
			availability: string;
		}> = await res.json();

		const standard = videos.find(
			(v) => v.render_type === 'standard' && v.availability === 'available'
		);

		if (!standard) {
			return json({ error: 'No se encontró un video estándar disponible' }, { status: 404 });
		}

		return json({ videoUrl: standard.url });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'Error desconocido' }, { status: 500 });
	}
};
