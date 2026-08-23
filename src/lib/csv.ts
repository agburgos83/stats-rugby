export function parseCSV(texto: string): string[][] {
	const filas: string[][] = [];
	let fila: string[] = [];
	let campo = '';
	let entreComillas = false;

	for (let i = 0; i < texto.length; i++) {
		const ch = texto[i];
		if (entreComillas) {
			if (ch === '"') {
				if (texto[i + 1] === '"') {
					campo += '"';
					i++;
				} else {
					entreComillas = false;
				}
			} else {
				campo += ch;
			}
		} else if (ch === '"') {
			entreComillas = true;
		} else if (ch === ',') {
			fila.push(campo);
			campo = '';
		} else if (ch === '\n' || ch === '\r') {
			if (ch === '\r' && texto[i + 1] === '\n') i++;
			fila.push(campo);
			campo = '';
			if (fila.length > 1 || fila[0] !== '') filas.push(fila);
			fila = [];
		} else {
			campo += ch;
		}
	}
	if (campo !== '' || fila.length > 0) {
		fila.push(campo);
		filas.push(fila);
	}
	return filas;
}