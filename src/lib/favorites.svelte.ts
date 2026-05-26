const STORAGE_KEY = 'sticker-favorites';
const TAB_KEY = 'sticker-last-tab';

interface FavoritesData {
	groups: string[];
	stickers: { groupId: string; stickerId: string }[];
}

function load(): FavoritesData {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { groups: [], stickers: [] };
		const parsed = JSON.parse(raw);
		return {
			groups: Array.isArray(parsed.groups) ? parsed.groups : [],
			stickers: Array.isArray(parsed.stickers) ? parsed.stickers : []
		};
	} catch {
		return { groups: [], stickers: [] };
	}
}

let data = $state<FavoritesData>(load());

function save() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const favorites = {
	get groups() {
		return data.groups;
	},
	get stickers() {
		return data.stickers;
	},

	isGroupFav(groupId: string): boolean {
		return data.groups.includes(groupId);
	},

	toggleGroup(groupId: string) {
		data.groups = data.groups.includes(groupId)
			? data.groups.filter((id) => id !== groupId)
			: [...data.groups, groupId];
		save();
	},

	isStickerFav(groupId: string, stickerId: string): boolean {
		return data.stickers.some((s) => s.groupId === groupId && s.stickerId === stickerId);
	},

	toggleSticker(groupId: string, stickerId: string) {
		data.stickers = data.stickers.some((s) => s.groupId === groupId && s.stickerId === stickerId)
			? data.stickers.filter((s) => !(s.groupId === groupId && s.stickerId === stickerId))
			: [...data.stickers, { groupId, stickerId }];
		save();
	}
};

export function getLastTab(): 'all' | 'favorites' {
	try {
		const v = localStorage.getItem(TAB_KEY);
		return v === 'favorites' ? 'favorites' : 'all';
	} catch {
		return 'all';
	}
}

export function setLastTab(tab: 'all' | 'favorites') {
	try {
		localStorage.setItem(TAB_KEY, tab);
	} catch {
		// ignore
	}
}
