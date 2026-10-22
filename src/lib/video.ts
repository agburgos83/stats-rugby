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
	opciones?: { controls?: boolean; mute?: boolean; autoplay?: boolean }
): string | null {
	if (!enlace) return '';

	if (enlace.includes('youtube.com') || enlace.includes('youtu.be')) {
		const codigoFinal = extraerYouTubeId(enlace);
		if (!codigoFinal) return enlace;
		const params = new URLSearchParams({
			autoplay: opciones?.autoplay ? '1' : '0',
			enablejsapi: '1',
			origin: window.location.origin,
			controls: opciones?.controls === false ? '0' : '1',
			mute: opciones?.mute ? '1' : '0',
			modestbranding: '1',
			rel: '0',
			showinfo: '0',
			iv_load_policy: '3',
			playsinline: '1',
			fs: opciones?.controls === false ? '0' : '1'
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

// ─────────────────────────────────────────────────────────────────────────
// REPRODUCTOR DE VIDEO: atajos de teclado + control del player de YouTube
//
// En la app hay dos tipos de video:
//   • Veo      → un <video> nativo de nuestra página (lo controlamos entero)
//   • YouTube → un iframe con la web de YouTube adentro. Desde afuera no se
//                puede tocar el video: solo se le pueden "mandar cartitas"
//                con postMessage.
//
// Acá se resuelve lo que no funcionaba:
//
//   1) LAS FLECHAS: en un <video controls>, el navegador mueve el video un
//      1% de su duración con cada flecha (en un partido de 90 min son ~54 s)
//      y solo las escucha si el <video> tiene el foco. Si el foco está en un
//      botón de la botonera, las flechas no hacen nada. Por eso acá escuchamos
//      las teclas en TODA la página y nos las apropiamos con preventDefault.
//
//   2) YOUTUBE: el player solo contesta "¿en qué minuto estás?" si le
//      preguntamos (si dejamos de preguntar deja de contestar), y el salto
//      necesita el minuto exacto de destino: no existe "adelantá 5", solo
//      "ponete en el minuto 120".
// ─────────────────────────────────────────────────────────────────────────

/** Segundos que salta una flecha (← / →). */
export const PASO_VIDEO = 5;

/** Segundos que salta una flecha con Shift. */
export const PASO_VIDEO_SHIFT = 15;

/** Segundos que salta una flecha con Ctrl/Cmd (ajuste fino). */
export const PASO_VIDEO_CTRL = 1;

/** Origen del iframe de YouTube: solo aceptamos mensajes que vengan de acá. */
const ORIGEN_YT = 'https://www.youtube.com';

/** Máximo de segundos que se le "adivinan" al player cuando está reproduciendo. */
const MAX_EXTRAPOLACION = 1.2;

/** Vida útil (ms) de un salto pedido antes de que el player estuviera listo. */
const VENTANA_SALTO_PENDIENTE = 2000;

/**
 * Control del player de YouTube (el que vive dentro del iframe).
 * Es el "secretario" que sabe en qué minuto está el video y le manda órdenes.
 */
export interface ControlYouTube {
	/** Empieza a escuchar al player y a preguntarle la posición. Devuelve el cleanup. */
	conectar(): () => void;
	/** Minuto en el que está el video ahora (null si el player no está listo). */
	tiempoActual(): number | null;
	/** Salta delta segundos (positivo = adelante). NO reanuda la reproducción. */
	saltar(delta: number): void;
}

export function crearControlYouTube(iframe: HTMLIFrameElement | null): ControlYouTube {
	// Último minuto que nos reportó el player (null = todavía no lo知道了).
	let tiempo: number | null = null;
	// Estado del player: 1 = reproduciendo, 2 = pausado, 3 = cargando.
	let estado = -1;
	// Cuándo nos contestó el player por última vez (para saber cuánto pasó).
	let marca = 0;
	// Salto pedido antes de que el player estuviera listo (guardamos SOLO el último).
	let pendiente: { delta: number; hasta: number } | null = null;
	// Timer del heartbeat que le pregunta la posición cada 1 s.
	let timer: ReturnType<typeof setInterval> | null = null;

	/**
	 * Manda una ORDEN al player ("pausá", "ponete en el minuto 120").
	 * Es lo único que se puede hacer desde afuera del iframe.
	 */
	function enviar(func: string, args: unknown[] = []): void {
		if (!iframe?.contentWindow) return;
		iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGEN_YT);
	}

	/**
	 * Manda la PREGUNTA "¿en qué minuto estás?".
	 * YouTube solo responde si le preguntamos: si dejamos de preguntar deja de
	 * contestar (verificado: 12 s sin preguntar → 0 respuestas). Por eso el
	 * heartbeat de `conectar()` no tiene fecha de vencimiento.
	 */
	function preguntar(): void {
		if (!iframe?.contentWindow) return;
		iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), ORIGEN_YT);
	}

	/**
	 * Escucha las respuestas del player. Cada respuesta trae el minuto actual
	 * y si está reproduciendo. Acá es donde guardamos el "currentTime".
	 */
	function alRecibir(event: MessageEvent): void {
		// Solo nos interesan los mensajes que vêm de YouTube.
		if (event.origin !== ORIGEN_YT) return;

		let data: { event?: string; info?: { currentTime?: number; playerState?: number } };
		try {
			data = JSON.parse(event.data);
		} catch {
			return; // mensaje que no es JSON nuestro
		}
		if (data.event !== 'infoDelivery' || !data.info) return;

		// Guardamos el último tiempo conocido y cuándo lo supimos.
		if (typeof data.info.currentTime === 'number') {
			tiempo = data.info.currentTime;
			marca = Date.now();
		}
		if (typeof data.info.playerState === 'number') estado = data.info.playerState;

		// El player recién contestó y había un salto pendiente → lo aplicamos.
		if (pendiente && tiempo !== null) {
			const { delta, hasta } = pendiente;
			pendiente = null;
			if (Date.now() <= hasta) {
				enviar('seekTo', [Math.max(0, tiempo + delta), true]);
			}
		}
	}

	/**
	 * Arranca a escuchar al player y a preguntarle la posición cada 1 s.
	 * Devuelve la función de limpieza (hay que llamarla al desmontar el
	 * componente, si no queda el listener y el heartbeat colgados).
	 */
	function conectar(): () => void {
		if (!iframe) return () => {};
		window.addEventListener('message', alRecibir);
		preguntar();
		timer = setInterval(preguntar, 1000);
		return () => {
			window.removeEventListener('message', alRecibir);
			if (timer) clearInterval(timer);
			timer = null;
		};
	}

	/**
	 * Minuto en el que está el video ahora.
	 * Si está reproduciendo, el minuto avanza solo: le sumamos los segundos
	 * que pasaron desde la última respuesta, con tope de 1,2 s (sin tope el
	 * desvío medido llegó a 4 s y el salto caía en cualquier lado).
	 */
	function tiempoActual(): number | null {
		if (tiempo === null) return null;
		if (estado === 1) {
			const transcurrido = (Date.now() - marca) / 1000;
			return tiempo + Math.min(transcurrido, MAX_EXTRAPOLACION);
		}
		return tiempo;
	}

	/**
	 * Salta delta segundos (positivo = adelante).
	 * YouTube no tiene "adelantá 5", solo "ponete en el minuto X" → hay que
	 * calcular X a partir de dónde estamos.
	 * NO mandamos "seguí reproducindo": si el analista pausó el video para
	 * marcar una acción, tiene que seguir pausado.
	 */
	function saltar(delta: number): void {
		const base = tiempoActual();
		if (base === null) {
			// El player todavía no está listo: guardamos SOLO el último salto
			// (no una lista) y lo aplicamos en cuanto conteste.
			pendiente = { delta, hasta: Date.now() + VENTANA_SALTO_PENDIENTE };
			preguntar();
			return;
		}
		enviar('seekTo', [Math.max(0, base + delta), true]);
	}

	return { conectar, tiempoActual, saltar };
}

export interface OpcionesAtajosVideo {
	/** <video> nativo de Veo, o null si el video es de YouTube. */
	nativo: () => HTMLVideoElement | null;
	/** Control del player de YouTube, o null si el video es de Veo. */
	youtube: () => ControlYouTube | null;
}

/**
 * ¿El foco está en un campo de texto? Ahí no queremos secuestrar las flechas
 * (por ejemplo, para escribir la URL del video).
 */
function esCampoEditable(destino: EventTarget | null): boolean {
	if (!(destino instanceof HTMLElement)) return false;
	const tag = destino.tagName.toLowerCase();
	return tag === 'input' || tag === 'textarea' || tag === 'select' || destino.isContentEditable;
}

/**
 * Instala los atajos de teclado del reproductor y devuelve la función de
 * limpieza.
 *
 * Escuchamos en `window` con capture:true para que la tecla llegue aunque el
 * foco esté en un botón de la botonera (si no, el <video> nunca la ve).
 * preventDefault + stopPropagation le sacan la tecla al navegador: sin eso
 * Chrome mueve el video un 1% de su duración (~54 s en un partido de 90 min).
 */
export function activarAtajosVideo(opts: OpcionesAtajosVideo): () => void {
	function handler(event: KeyboardEvent): void {
		// Otra cosa ya lo manejó, o el usuario está usando Alt (atajos del browser).
		if (event.defaultPrevented || event.altKey) return;
		// Si está escribiendo en un campo de texto, las flechas son suyas.
		if (esCampoEditable(event.target)) return;

		// Cuántos segundos saltar según la tecla y los modificadores.
		let paso: number;
		if (event.key === 'ArrowRight') paso = PASO_VIDEO;
		else if (event.key === 'ArrowLeft') paso = -PASO_VIDEO;
		else return;

		if (event.shiftKey) paso = paso > 0 ? PASO_VIDEO_SHIFT : -PASO_VIDEO_SHIFT;
		if (event.ctrlKey || event.metaKey) paso = paso > 0 ? PASO_VIDEO_CTRL : -PASO_VIDEO_CTRL;

		const video = opts.nativo();
		const youtube = opts.youtube();
		if (!video && !youtube) return; // en esta vista no hay video

		// "Esta tecla es mía": se la sacamos al navegador.
		event.preventDefault();
		event.stopPropagation();

		if (video) {
			// Veo: el video es nuestro, lo movemos a mano.
			const duracion = Number.isFinite(video.duration) ? video.duration : Infinity;
			const destino = Math.min(Math.max(video.currentTime + paso, 0), duracion);
			video.currentTime = destino;
			// Si llegó al final, que no siga "corriendo" en el vacío.
			if (destino >= duracion && !video.paused) video.pause();
		} else {
			// YouTube: el video está en un iframe, le mandamos la orden.
			youtube?.saltar(paso);
		}
	}

	window.addEventListener('keydown', handler, true);
	return () => window.removeEventListener('keydown', handler, true);
}
