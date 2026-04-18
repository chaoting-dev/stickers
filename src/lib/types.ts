export interface Sticker {
	id: string;
	name: string;
	tags?: string[];
	hasKey?: boolean;
}

export interface StickerGroup {
	id: string;
	name: string;
	/** Sticker id to use as the group cover thumbnail */
	cover?: string;
	/** File extension for the main sticker files, defaults to "png" */
	ext?: string;
	stickers: Sticker[];
}

export interface Manifest {
	groups: StickerGroup[];
}
