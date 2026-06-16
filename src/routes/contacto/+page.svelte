<script lang="ts">
	let nombre = $state('');
	let email = $state('');
	let mensaje = $state('');
	let enviado = $state(false);
</script>

<section class="mx-auto max-w-3xl px-6 py-16">
	<h2 class="mb-12 text-4xl tracking-tight text-gray-900">Contacto</h2>

	{#if enviado}
		<p class="rounded-sm bg-green-50 p-6 text-green-800">
			Gracias por tu mensaje. Te responderé a la brevedad.
		</p>
	{:else}
		<form
			action="https://formspree.io/f/tu-id-aqui"
			method="POST"
			class="space-y-6"
			onsubmit={() => (enviado = true)}
		>
			<div>
				<label for="nombre" class="mb-2 block text-sm font-bold tracking-wider text-gray-700 uppercase">
					Nombre
				</label>
				<input
					type="text"
					name="nombre"
					id="nombre"
					bind:value={nombre}
					required
					class="w-full rounded-sm border-gray-300 shadow-sm transition-colors focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="email" class="mb-2 block text-sm font-bold tracking-wider text-gray-700 uppercase">
					Email
				</label>
				<input
					type="email"
					name="email"
					id="email"
					bind:value={email}
					required
					class="w-full rounded-sm border-gray-300 shadow-sm transition-colors focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="mensaje" class="mb-2 block text-sm font-bold tracking-wider text-gray-700 uppercase">
					Mensaje
				</label>
				<textarea
					name="mensaje"
					id="mensaje"
					rows="5"
					bind:value={mensaje}
					required
					class="w-full rounded-sm border-gray-300 shadow-sm transition-colors focus:border-blue-500 focus:ring-blue-500"
				></textarea>
			</div>

			<button
				type="submit"
				class="w-full bg-blue-600 py-4 font-bold tracking-widest text-white uppercase transition-colors duration-300 hover:bg-blue-700"
			>
				Enviar mensaje
			</button>
		</form>
	{/if}
</section>