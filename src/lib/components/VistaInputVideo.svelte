<script lang="ts">

interface Props {
    urlVideo: string;
    cambiarVista: () => void;
}

let { urlVideo = $bindable(), cambiarVista }: Props = $props();

function esUrlValida(texto: string): boolean {
		if (!texto) return false;

        try {
            const objetoUrl = new URL(texto);
            return objetoUrl.protocol === "http:" || objetoUrl.protocol === "https:";
        } catch {
            console.log('url no valida');
            return false;
        }
}

let botonHabilitado = $derived(esUrlValida(urlVideo));

</script>

<div class="contenedor-centrado">
<div class="tarjeta-formulario">

    <h2>Ingresá la URL del partido para analizar</h2>
	<p class="subtitulo">Acepta enlaces de YouTube, Vimeo, Veo y otras plataformas web.</p>
	
	<input 
		type="text" 
		bind:value={urlVideo} 
		placeholder="https://..."
		class="input-url"
	/>

	<div class="contenedor-boton">
		<!-- Conectamos el botón directo al estado derivado reactivo -->
		<button 
			disabled={!botonHabilitado} 
			onclick={cambiarVista} 
			class="btn-primary"
		>
			Comenzar Análisis →
		</button>
	</div>

</div>
    
</div>

<style>

.contenedor-centrado {
    display:flex;
    flex-direction: column;
    align-items: center;
    justify-content:center;
    height:85vh;
    font-family:sans-serif;
    padding: 20px;
}

.tarjeta-formulario {
		background: white;
		padding: 40px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		text-align: center;
		width: 100%;
		max-width: 500px; /* Evita que el input se estire al infinito */
		box-sizing: border-box;
	}
h2 {
		color: #1e293b;
		margin: 0 0 8px 0;
		font-size: 1.5rem;
	}

	.subtitulo {
		color: #64748b;
		margin: 0 0 24px 0;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.input-url {
		width: 100%;
		padding: 14px 16px;
		font-size: 1rem;
		border: 2px solid #cbd5e1;
		border-radius: 8px;
		margin-bottom: 24px;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}
	
	.input-url:focus {
		border-color: #2563eb; /* Borde azul al tipear */
	}

	.contenedor-boton {
		text-align: right; /* Tira el botón a la derecha adentro de la tarjeta */
	}

	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.btn-primary:hover {
		background-color: #1d4ed8;
	}

	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}
</style>
