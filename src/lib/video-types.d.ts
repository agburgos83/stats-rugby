/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
	YT?: {
		Player: new (element: HTMLElement | string, options?: any) => any;
	};
}
