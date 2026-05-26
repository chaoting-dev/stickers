<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { loadManifest, getStickerUrl, getPreviewUrl } from '$lib/data';
	import { favorites } from '$lib/favorites.svelte';
	import StickerModal from '$lib/components/StickerModal.svelte';
	import type { StickerGroup, Sticker } from '$lib/types';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import { SvelteMap } from 'svelte/reactivity';

	const groupId = $derived(page.params.groupId ?? '');

	let group = $state<StickerGroup | null>(null);
	let loading = $state(true);
	let selected = $state<Sticker | null>(null);
	let searchQuery = $state('');

	/** Cache of pre-fetched image blobs keyed by sticker id (hover optimization) */
	const blobCache = new SvelteMap<string, Blob>();

	const ext = $derived(group?.ext ?? 'png');

	const filteredStickers = $derived.by(() => {
		if (!group) return [];
		const q = searchQuery.toLowerCase().trim();
		if (!q) return group.stickers;
		return group.stickers.filter(
			(s) => s.name.toLowerCase().includes(q) || s.tags?.some((t) => t.toLowerCase().includes(q))
		);
	});

	onMount(async () => {
		try {
			const manifest = await loadManifest();
			group = manifest.groups.find((g) => g.id === groupId) ?? null;

			const hash = window.location.hash.slice(1);
			if (hash) {
				setTimeout(() => {
					document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}, 100);
			}
		} finally {
			loading = false;
		}
	});

	async function prefetchBlob(sticker: Sticker) {
		if (blobCache.has(sticker.id)) return;
		try {
			const res = await fetch(getStickerUrl(groupId, sticker.id, false, ext));
			if (res.ok) blobCache.set(sticker.id, await res.blob());
		} catch {
			// ignore
		}
	}
</script>

<svelte:head>
	<title>{group?.name ?? 'Loading...'} — Stickers</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="text-muted-foreground">Loading...</div>
	</div>
{:else if !group}
	<div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
		<div class="text-4xl">😕</div>
		<div class="font-medium">Pack not found</div>
	</div>
{:else}
	<div class="space-y-4">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-bold">{group.name}</h1>
				<button
					onclick={() => favorites.toggleGroup(group!.id)}
					class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent active:bg-accent"
					aria-label={favorites.isGroupFav(group.id)
						? 'Remove group from favorites'
						: 'Add group to favorites'}
				>
					<HeartIcon
						class="h-5 w-5 transition-colors {favorites.isGroupFav(group.id)
							? 'fill-red-500 stroke-red-500'
							: 'stroke-muted-foreground'}"
					/>
				</button>
			</div>
			<p class="mt-0.5 text-sm text-muted-foreground">{group.stickers.length} stickers</p>
		</div>

		<input
			type="search"
			placeholder="Search in {group.name}..."
			bind:value={searchQuery}
			class="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
		/>

		{#if filteredStickers.length === 0}
			<div class="py-16 text-center text-muted-foreground">No stickers match "{searchQuery}"</div>
		{:else}
			<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
				{#each filteredStickers as sticker (sticker.id)}
					<div id={sticker.id} class="flex flex-col items-center gap-1">
						<div class="relative w-full">
							<button
								onclick={() => (selected = sticker)}
								onpointerenter={() => prefetchBlob(sticker)}
								class="aspect-square w-full overflow-hidden rounded-2xl bg-accent/40 p-1.5 transition-transform hover:scale-105 active:scale-95"
								aria-label={sticker.name}
							>
								<img
									src={getPreviewUrl(group.id, sticker.id, sticker.hasKey, ext)}
									alt={sticker.name}
									class="pointer-events-none h-full w-full object-contain"
									loading="lazy"
								/>
							</button>
							<button
								onclick={() => favorites.toggleSticker(group!.id, sticker.id)}
								class="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background active:bg-background"
								aria-label={favorites.isStickerFav(group.id, sticker.id)
									? 'Remove from favorites'
									: 'Add to favorites'}
							>
								<HeartIcon
									class="h-3.5 w-3.5 transition-colors {favorites.isStickerFav(group.id, sticker.id)
										? 'fill-red-500 stroke-red-500'
										: 'stroke-muted-foreground'}"
								/>
							</button>
						</div>
						<span class="w-full truncate text-center text-xs text-muted-foreground">
							{sticker.name}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

{#if selected && group}
	<StickerModal {group} sticker={selected} onclose={() => (selected = null)} />
{/if}
