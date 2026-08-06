import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { LIMITES_FREE } from '$lib/planes';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { partido, acciones, teamAcciones, skillsVisibles, plan = 'free' } = body;

	const limites = plan === 'free' ? LIMITES_FREE : null;

	const expiresAt =
		plan === 'free' ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() : null;

	if (!Array.isArray(skillsVisibles) || skillsVisibles.length === 0) {
		return json({ error: 'No hay skills seleccionadas.' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('salas')
		.insert({
			plan,
			partido_json: partido,
			acciones_json: acciones,
			team_acciones_json: teamAcciones,
			limites,
			expires_at: expiresAt,
			created_by: null,
			skills_visibles: skillsVisibles
		})
		.select('id')
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({
		token: data.id,
		url: `/sala/${data.id}`
	});
};

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		return json({ error: 'Falta token' }, { status: 400 });
	}

	const { data, error } = await supabase.from('salas').select('*').eq('id', token).single();

	if (error || !data) {
		return json({ error: 'Sala no encontrada' }, { status: 404 });
	}

	if (data.expires_at && new Date(data.expires_at) < new Date()) {
		return json({ error: 'Esta sala expiró', expired: true }, { status: 410 });
	}

	return json({ sala: data });
};
