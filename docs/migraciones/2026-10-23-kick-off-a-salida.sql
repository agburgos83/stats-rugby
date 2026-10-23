-- Migración de datos: rename de skill 'Kick off' -> 'Salida' (AGENTS.md, ítem 40).
--
-- Contexto: el código ya solo conoce 'Salida' (FOOT_SKILLS), pero las salas
-- creadas antes del rename guardaron 'Kick off' en acciones_json y
-- skills_visibles. Por eso la sala sigue mostrando 'Kick off' en los filtros,
-- el clip no entra en el grupo 'pie' (grupoDeSkill devuelve null) y en
-- VistaAcciones queda deshabilitado al compartir.
--
-- Ejecutar en Supabase -> SQL Editor.
-- Es idempotente: correrla dos veces no cambia nada.

begin;

update salas
set
	acciones_json = replace(acciones_json::text, '"Kick off"', '"Salida"')::jsonb,
	skills_visibles = array_replace(skills_visibles, 'Kick off', 'Salida')
where
	acciones_json::text like '%"Kick off"%'
	or 'Kick off' = any(skills_visibles);

commit;

-- Verificación: debe devolver 0.
-- select count(*) from salas
-- where acciones_json::text like '%"Kick off"%'
--    or 'Kick off' = any(skills_visibles);
