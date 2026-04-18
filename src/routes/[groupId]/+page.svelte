<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { loadManifest, getStickerUrl, getPreviewUrl } from '$lib/data';
	import type { StickerGroup, Sticker } from '$lib/types';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LinkIcon from '@lucide/svelte/icons/link';
	import XIcon from '@lucide/svelte/icons/x';
	import { SvelteMap } from 'svelte/reactivity';

	const groupId = $derived(page.params.groupId ?? '');

	let group = $state<StickerGroup | null>(null);
	let loading = $state(true);
	let selected = $state<Sticker | null>(null);
	let searchQuery = $state('');
	let copyDone = $state(false);
	let copyUrlDone = $state(false);

	/** Cache of pre-fetched image blobs keyed by sticker id */
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

	/** Pre-fetch and cache a sticker blob so drag/copy can use actual image data */
	async function fetchBlob(sticker: Sticker): Promise<Blob | null> {
		if (blobCache.has(sticker.id)) return blobCache.get(sticker.id)!;
		try {
			const res = await fetch(getStickerUrl(groupId, sticker.id, false, ext));
			if (!res.ok) return null;
			const blob = await res.blob();
			blobCache.set(sticker.id, blob);
			return blob;
		} catch {
			return null;
		}
	}

	function openSticker(sticker: Sticker) {
		selected = sticker;
		copyDone = false;
		copyUrlDone = false;
		// Pre-fetch immediately so blob is ready before user drags from modal
		fetchBlob(sticker);
	}

	function closeModal() {
		selected = null;
	}

	function handleModalBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) closeModal();
	}

	/** dragstart handler: passes actual image bytes to the receiving app, not just a URL string */
	async function handleDragStart(e: DragEvent, sticker: Sticker) {
		// Browsers require dataTransfer to be set synchronously, so we rely on the
		// pre-fetched cache. If not cached yet, fall back to an absolute URL so
		// the target app can at least download it.
		const blob = blobCache.get(sticker.id);
		if (blob && e.dataTransfer) {
			// DataTransfer.items.add(File) passes raw image bytes — Discord and most
			// apps treat this as an actual image file, not a URL string.
			e.dataTransfer.items.add(new File([blob], `${sticker.id}.${ext}`, { type: blob.type }));
		} else {
			// Absolute URL fallback — at least lets online apps fetch the image
			const absUrl = new URL(getStickerUrl(groupId, sticker.id, false, ext), window.location.href).href;
			e.dataTransfer?.setData('text/uri-list', absUrl);
			e.dataTransfer?.setData('text/plain', absUrl);
		}
	}

	async function copyImage(sticker: Sticker) {
		try {
			const blob = (await fetchBlob(sticker))!;
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
			copyDone = true;
			setTimeout(() => (copyDone = false), 2000);
		} catch {
			// Clipboard API blocked (e.g. non-HTTPS) — fall back to share/download
			await shareSticker(sticker);
		}
	}

	async function shareSticker(sticker: Sticker) {
		try {
			const cached = await fetchBlob(sticker);
			const blob: Blob =
				cached ?? (await fetch(getStickerUrl(groupId, sticker.id, false, ext)).then((r) => r.blob()));
			const file = new File([blob], `${sticker.id}.${ext}`, { type: blob.type });
			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file] });
			} else {
				// File sharing not supported — fall back to saving
				downloadSticker(sticker);
			}
		} catch {
			// User cancelled
		}
	}

	async function copyUrl(sticker: Sticker) {
		const url = new URL(getStickerUrl(groupId, sticker.id, false, ext), window.location.href).href;
		await navigator.clipboard.writeText(url);
		copyUrlDone = true;
		setTimeout(() => (copyUrlDone = false), 2000);
	}

	function downloadSticker(sticker: Sticker) {
		const a = document.createElement('a');
		a.href = getStickerUrl(groupId, sticker.id, false, ext);
		a.download = `${sticker.id}.${ext}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}
</script>

<svelte:head>
	<title>{group?.name ?? 'Loading...'} — Stickers</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

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
			<h1 class="text-2xl font-bold">{group.name}</h1>
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
						<button
							onclick={() => openSticker(sticker)}
							onpointerenter={() => fetchBlob(sticker)}
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
						<span class="w-full truncate text-center text-xs text-muted-foreground">
							{sticker.name}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Sticker detail modal -->
{#if selected && group}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
		onclick={handleModalBackdrop}
		style="padding-bottom: env(safe-area-inset-bottom)"
	>
		<div
			class="w-full max-w-sm rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl"
			role="dialog"
			aria-modal="true"
			aria-label={selected.name}
		>
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden"></div>

			<!--
				Plain <img> without a button wrapper so iOS long-press shows the
				native "Copy Image / Save to Photos / Share" context menu.
				draggable={true} + ondragstart passes actual blob bytes on desktop.
			-->
			<img
				src={getStickerUrl(group.id, selected.id, false, ext)}
				alt={selected.name}
				class="mx-auto block h-40 w-40 cursor-grab object-contain active:cursor-grabbing sm:h-48 sm:w-48"
				draggable={true}
				ondragstart={(e) => handleDragStart(e, selected!)}
			/>

			<h3 class="mt-4 text-center text-lg font-semibold">{selected.name}</h3>

			{#if selected.tags && selected.tags.length > 0}
				<div class="mt-2 flex flex-wrap justify-center gap-1">
					{#each selected.tags as tag (tag)}
						<span class="rounded-full bg-accent px-2.5 py-0.5 text-xs">{tag}</span>
					{/each}
				</div>
			{/if}

			<div class="mt-4 grid grid-cols-2 gap-2">
				<button
					onclick={() => copyImage(selected!)}
					class="flex flex-col items-center justify-center gap-1 rounded-xl bg-primary py-3 text-xs font-medium text-primary-foreground active:opacity-80"
				>
					{#if copyDone}
						<CheckIcon class="h-4 w-4" />
						Copied!
					{:else}
						<CopyIcon class="h-4 w-4" />
						Copy Image
					{/if}
				</button>
				<button
					onclick={() => copyUrl(selected!)}
					class="flex flex-col items-center justify-center gap-1 rounded-xl bg-secondary py-3 text-xs font-medium text-secondary-foreground active:opacity-80"
				>
					{#if copyUrlDone}
						<CheckIcon class="h-4 w-4" />
						Copied!
					{:else}
						<LinkIcon class="h-4 w-4" />
						Copy URL
					{/if}
				</button>
				<button
					onclick={() => shareSticker(selected!)}
					class="flex flex-col items-center justify-center gap-1 rounded-xl bg-secondary py-3 text-xs font-medium text-secondary-foreground active:opacity-80"
				>
					<Share2Icon class="h-4 w-4" />
					Share
				</button>
				<button
					onclick={() => downloadSticker(selected!)}
					class="flex flex-col items-center justify-center gap-1 rounded-xl bg-secondary py-3 text-xs font-medium text-secondary-foreground active:opacity-80"
				>
					<DownloadIcon class="h-4 w-4" />
					Save
				</button>
			</div>

			<button
				onclick={closeModal}
				class="mt-2 flex w-full items-center justify-center rounded-xl py-3 text-sm text-muted-foreground active:bg-accent"
			>
				<XIcon class="mr-1.5 h-3.5 w-3.5" />
				Close
			</button>
		</div>
	</div>
{/if}
