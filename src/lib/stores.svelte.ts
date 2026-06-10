import { browser } from '$app/environment';

const STORAGE_KEY = 'lupa-rugby-state';

export function loadFromStorage(): Record<string, unknown> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

export function saveToStorage(data: Record<string, unknown>): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// storage full or unavailable
	}
}

export function clearStorage(): void {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEY);
}
