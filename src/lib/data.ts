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

/**
 * Returns the URL for a sticker file.
 * Key files (_key) are always .png; main files use the provided ext (default "png").
 */
export function getStickerUrl(
	groupId: string,
	stickerId: string,
	key = false,
	ext = 'png'
): string {
	if (key) return `${base}/stickers/${groupId}/${stickerId}_key.png`;
	return `${base}/stickers/${groupId}/${stickerId}.${ext}`;
}

/** Returns the best preview URL: _key.png if available, otherwise main file. */
export function getPreviewUrl(
	groupId: string,
	stickerId: string,
	hasKey = false,
	ext = 'png'
): string {
	return getStickerUrl(groupId, stickerId, hasKey, ext);
}
