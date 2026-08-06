<script lang="ts">
	let nombre = $state('');
	let email = $state('');
	let mensaje = $state('');
	let enviado = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const data = new FormData(form);
		try {
			const res = await fetch(form.action, {
				method: 'POST',
				body: data,
				headers: { Accept: 'application/json' }
			});
			if (res.ok) enviado = true;
			else alert('Error al enviar. Podés escribirme a agburgos83@gmail.com');
		} catch {
			alert('Error de conexión. Podés escribirme a agburgos83@gmail.com');
		}
	}
</script>

<svelte:head>
	<title>Contacto — Stats Rugby</title>
	<meta name="description" content="Contactate con el desarrollador de Stats Rugby." />
</svelte:head>

<section class="pagina-contenido">
	<h2 class="pagina-titulo">Contacto</h2>

	{#if enviado}
		<p class="alerta-exito">Gracias por tu mensaje. Te responderé a la brevedad.</p>
	{:else}
		<form
			action="https://formspree.io/f/xbdvqqba"
			method="POST"
			class="formulario"
			onsubmit={handleSubmit}
		>
			<div>
				<label for="nombre" class="label-form"> Nombre </label>
				<input
					type="text"
					name="nombre"
					id="nombre"
					bind:value={nombre}
					required
					class="input-form"
				/>
			</div>

			<div>
				<label for="email" class="label-form"> Email </label>
				<input
					type="email"
					name="email"
					id="email"
					bind:value={email}
					required
					class="input-form"
				/>
			</div>

			<div>
				<label for="mensaje" class="label-form"> Mensaje </label>
				<textarea
					name="mensaje"
					id="mensaje"
					rows="5"
					bind:value={mensaje}
					required
					class="input-form"
				></textarea>
			</div>

			<button type="submit" class="btn-enviar"> Enviar mensaje </button>
		</form>
	{/if}
</section>

<style>
	.alerta-exito {
		background-color: #f0fdf4;
		color: #166534;
		padding: 1.5rem;
		border-radius: 2px;
	}

	.formulario {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.label-form {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #374151;
		text-transform: uppercase;
	}

	.input-form {
		width: 100%;
		border: 1px solid #d1d5db;
		border-radius: 2px;
		padding: 0.5rem 0.75rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		font-family: inherit;
		font-size: inherit;
	}

	.input-form:focus {
		outline: none;
		border-color: #0068ce;
		box-shadow: 0 0 0 3px rgba(0, 104, 206, 0.3);
	}

	.btn-enviar {
		width: 100%;
		background-color: #0068ce;
		color: white;
		border: none;
		padding: 1rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		transition: background-color 0.3s;
		font-family: inherit;
		font-size: inherit;
	}

	.btn-enviar:hover {
		background-color: #0050a0;
	}
</style>
