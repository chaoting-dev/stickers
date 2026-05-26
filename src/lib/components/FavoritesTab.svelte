<script lang="ts">
	import { base } from '$app/paths';
	import { getPreviewUrl } from '$lib/data';
	import { favorites } from '$lib/favorites.svelte';
	import StickerModal from './StickerModal.svelte';
	import type { Manifest, StickerGroup, Sticker } from '$lib/types';
	import HeartIcon from '@lucide/svelte/icons/heart';

	let { manifest }: { manifest: Manifest } = $props();

	let selected = $state<{ group: StickerGroup; sticker: Sticker } | null>(null);

	const favGroups = $derived(manifest.groups.filter((g) => favorites.isGroupFav(g.id)));

	const favStickersByGroup = $derived.by(() => {
		const result: { group: StickerGroup; stickers: Sticker[] }[] = [];
		for (const group of manifest.groups) {
			const stickers = group.stickers.filter((s) => favorites.isStickerFav(group.id, s.id));
			if (stickers.length > 0) result.push({ group, stickers });
		}
		return result;
	});

	const hasFavorites = $derived(favGroups.length > 0 || favStickersByGroup.length > 0);
</script>

{#if !hasFavorites}
	<div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
		<div class="text-4xl">🤍</div>
		<div class="font-medium">No favorites yet</div>
		<div class="text-sm text-muted-foreground">
			Tap the heart icon next to a group or sticker to pin it here.
		</div>
	</div>
{:else}
	<div class="space-y-8">
		{#if favGroups.length > 0}
			<div>
				<h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Pinned Groups
				</h2>
				<div class="space-y-6">
					{#each favGroups as group (group.id)}
						<section>
							<div class="mb-3 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<h3 class="text-lg font-semibold leading-tight">{group.name}</h3>
									<button
										onclick={() => favorites.toggleGroup(group.id)}
										class="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-accent active:bg-accent"
										aria-label="Remove from favorites"
									>
										<HeartIcon class="h-4 w-4 fill-red-500 stroke-red-500" />
									</button>
								</div>
								<a href="{base}/{group.id}" class="shrink-0 text-sm font-medium text-primary">
									All {group.stickers.length}
								</a>
							</div>
							<div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
								{#each group.stickers.slice(0, 8) as sticker (sticker.id)}
									<button
										onclick={() => (selected = { group, sticker })}
										class="aspect-square overflow-hidden rounded-xl bg-accent/40 p-1 transition-transform hover:scale-105 active:scale-95"
										aria-label={sticker.name}
									>
										<img
											src={getPreviewUrl(group.id, sticker.id, sticker.hasKey, group.ext)}
											alt={sticker.name}
											class="h-full w-full object-contain"
											loading="lazy"
										/>
									</button>
								{/each}
							</div>
						</section>
					{/each}
				</div>
			</div>
		{/if}

		{#if favStickersByGroup.length > 0}
			<div>
				<h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Pinned Stickers
				</h2>
				<div class="space-y-6">
					{#each favStickersByGroup as { group, stickers } (group.id)}
						<section>
							<div class="mb-2">
								<h3 class="text-sm font-medium text-muted-foreground">{group.name}</h3>
							</div>
							<div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
								{#each stickers as sticker (sticker.id)}
									<button
										onclick={() => (selected = { group, sticker })}
										class="aspect-square overflow-hidden rounded-xl bg-accent/40 p-1 transition-transform hover:scale-105 active:scale-95"
										aria-label={sticker.name}
									>
										<img
											src={getPreviewUrl(group.id, sticker.id, sticker.hasKey, group.ext)}
											alt={sticker.name}
											class="h-full w-full object-contain"
											loading="lazy"
										/>
									</button>
								{/each}
							</div>
						</section>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

{#if selected}
	<StickerModal
		group={selected.group}
		sticker={selected.sticker}
		onclose={() => (selected = null)}
	/>
{/if}
