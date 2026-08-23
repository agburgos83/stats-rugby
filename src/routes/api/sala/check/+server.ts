import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { createHash } from 'crypto';

function calcularContentHash(
    partido: Record<string, unknown>,
    acciones: unknown[],
    teamAcciones: unknown[],
): string {
    const payload = JSON.stringify({ partido, acciones, teamAcciones });
    return createHash('sha256').update(payload).digest('hex');
}

export const POST: RequestHandler = async ({ request }) => {
    const { partido, acciones, teamAcciones } = await request.json();

    const contentHash = calcularContentHash(partido, acciones, teamAcciones);

    const { data } = await supabase
        .from('salas')
        .select('id')
        .eq('content_hash', contentHash)
        .maybeSingle();

    if (data) {
        return json({ existente: true, url: `/sala/${data.id}` });
    }

    return json({ existente: false });
};