<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { loadManifest, getPreviewUrl } from '$lib/data';
	import type { Manifest } from '$lib/types';

	let manifest = $state<Manifest | null>(null);
	let loading = $state(true);
	let errorMsg = $state('');

	const query = $derived((page.url.searchParams.get('q') ?? '').toLowerCase().trim());

	const displayGroups = $derived.by(() => {
		if (!manifest) return [];
		if (!query) return manifest.groups.map((g) => ({ ...g, filtered: false }));
		return manifest.groups
			.map((g) => ({
				...g,
				filtered: true,
				stickers: g.stickers.filter(
					(s) =>
						s.name.toLowerCase().includes(query) ||
						s.tags?.some((t) => t.toLowerCase().includes(query)) ||
						g.name.toLowerCase().includes(query)
				)
			}))
			.filter((g) => g.stickers.length > 0);
	});

	onMount(async () => {
		try {
			manifest = await loadManifest();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Failed to load stickers';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Stickers</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="text-muted-foreground">Loading...</div>
	</div>
{:else if errorMsg}
	<div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
		<div class="text-4xl">😕</div>
		<div class="font-medium">Could not load stickers</div>
		<div class="text-sm text-muted-foreground">{errorMsg}</div>
	</div>
{:else if displayGroups.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 py-24 text-center">
		<div class="text-4xl">🔍</div>
		<div class="font-medium">No stickers found</div>
		{#if query}
			<div class="text-sm text-muted-foreground">Try a different search term</div>
		{/if}
	</div>
{:else}
	<div class="space-y-8">
		{#if query}
			<p class="text-sm text-muted-foreground">
				Results for "<span class="font-medium text-foreground">{query}</span>"
			</p>
		{/if}

		{#each displayGroups as group (group.id)}
			<section>
				<div class="mb-3 flex items-baseline justify-between">
					<div>
						<h2 class="text-lg leading-tight font-semibold">{group.name}</h2>
					</div>
					{#if !query}
						<a href="{base}/{group.id}" class="shrink-0 text-sm font-medium text-primary">
							All {group.stickers.length}
						</a>
					{/if}
				</div>

				<div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
					{#each query ? group.stickers : group.stickers.slice(0, 8) as sticker (sticker.id)}
						<a
							href="{base}/{group.id}#{sticker.id}"
							class="aspect-square overflow-hidden rounded-xl bg-accent/40 p-1 transition-transform hover:scale-105 active:scale-95"
							aria-label={sticker.name}
						>
							<img
								src={getPreviewUrl(group.id, sticker.id, sticker.hasKey, group.ext)}
								alt={sticker.name}
								class="h-full w-full object-contain"
								loading="lazy"
							/>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
