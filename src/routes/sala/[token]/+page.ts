import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { data, error: dbError } = await supabase
		.from('salas')
		.select('*')
		.eq('id', params.token)
		.single();

	if (dbError || !data) throw error(404, 'Sala no encontrada');
	if (data.expires_at && new Date(data.expires_at) < new Date())
		throw error(410, 'Esta sala expiró');

	return { sala: data };
};
