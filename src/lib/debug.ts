export function logError(...args: unknown[]): void {
	if (import.meta.env.DEV) console.error(...args);
}