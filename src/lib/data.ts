import { base } from '$app/paths';
import type { Manifest } from './types';

let cached: Promise<Manifest> | null = null;

export function loadManifest(): Promise<Manifest> {
	if (!cached) {
		cached = fetch(`${base}/stickers/manifest.json`)
			.then((r) => {
				if (!r.ok) throw new Error(`Failed to load manifest: ${r.status}`);
				return r.json();
			})
			.catch((e) => {
				cached = null;
				throw e;
			});
	}
	return cached;
}

export function getStickerUrl(groupId: string, stickerId: string, key = false): string {
	const suffix = key ? '_key' : '';
	return `${base}/stickers/${groupId}/${stickerId}${suffix}.png`;
}

/** Returns the best preview URL: _key.png if available, otherwise main .png */
export function getPreviewUrl(groupId: string, stickerId: string, hasKey = false): string {
	return getStickerUrl(groupId, stickerId, hasKey);
}
