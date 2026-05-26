<script lang="ts">
	import { onMount } from 'svelte';
	import { getStickerUrl } from '$lib/data';
	import { favorites } from '$lib/favorites.svelte';
	import type { StickerGroup, Sticker } from '$lib/types';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LinkIcon from '@lucide/svelte/icons/link';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		group,
		sticker,
		onclose
	}: {
		group: StickerGroup;
		sticker: Sticker;
		onclose: () => void;
	} = $props();

	const ext = $derived(group.ext ?? 'png');

	let blob = $state<Blob | null>(null);
	let copyDone = $state(false);
	let copyUrlDone = $state(false);

	onMount(() => {
		fetchBlob();
	});

	async function fetchBlob() {
		try {
			const res = await fetch(getStickerUrl(group.id, sticker.id, false, ext));
			if (res.ok) blob = await res.blob();
		} catch {
			// ignore — drag/copy will fall back gracefully
		}
	}

	async function handleDragStart(e: DragEvent) {
		if (blob && e.dataTransfer) {
			e.dataTransfer.items.add(new File([blob], `${sticker.id}.${ext}`, { type: blob.type }));
		} else {
			const absUrl = new URL(getStickerUrl(group.id, sticker.id, false, ext), window.location.href).href;
			e.dataTransfer?.setData('text/uri-list', absUrl);
			e.dataTransfer?.setData('text/plain', absUrl);
		}
	}

	async function copyImage() {
		try {
			const b = blob ?? (await fetch(getStickerUrl(group.id, sticker.id, false, ext)).then((r) => r.blob()));
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
			copyDone = true;
			setTimeout(() => (copyDone = false), 2000);
		} catch {
			await shareSticker();
		}
	}

	async function shareSticker() {
		try {
			const b = blob ?? (await fetch(getStickerUrl(group.id, sticker.id, false, ext)).then((r) => r.blob()));
			const file = new File([b], `${sticker.id}.${ext}`, { type: b.type });
			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file] });
			} else {
				downloadSticker();
			}
		} catch {
			// user cancelled
		}
	}

	async function copyUrl() {
		const url = new URL(getStickerUrl(group.id, sticker.id, false, ext), window.location.href).href;
		await navigator.clipboard.writeText(url);
		copyUrlDone = true;
		setTimeout(() => (copyUrlDone = false), 2000);
	}

	function downloadSticker() {
		const a = document.createElement('a');
		a.href = getStickerUrl(group.id, sticker.id, false, ext);
		a.download = `${sticker.id}.${ext}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
	onclick={handleBackdrop}
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<div
		class="w-full max-w-sm rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl"
		role="dialog"
		aria-modal="true"
		aria-label={sticker.name}
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden"></div>

		<img
			src={getStickerUrl(group.id, sticker.id, false, ext)}
			alt={sticker.name}
			class="mx-auto block h-40 w-40 cursor-grab object-contain active:cursor-grabbing sm:h-48 sm:w-48"
			draggable={true}
			ondragstart={handleDragStart}
		/>

		<h3 class="mt-4 text-center text-lg font-semibold">{sticker.name}</h3>

		{#if sticker.tags && sticker.tags.length > 0}
			<div class="mt-2 flex flex-wrap justify-center gap-1">
				{#each sticker.tags as tag (tag)}
					<span class="rounded-full bg-accent px-2.5 py-0.5 text-xs">{tag}</span>
				{/each}
			</div>
		{/if}

		<div class="mt-4 grid grid-cols-2 gap-2">
			<button
				onclick={copyImage}
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
				onclick={() => favorites.toggleSticker(group.id, sticker.id)}
				class="flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-medium active:opacity-80 {favorites.isStickerFav(group.id, sticker.id) ? 'bg-red-50 text-red-500 dark:bg-red-950' : 'bg-secondary text-secondary-foreground'}"
			>
				<HeartIcon
					class="h-4 w-4 {favorites.isStickerFav(group.id, sticker.id) ? 'fill-red-500 stroke-red-500' : ''}"
				/>
				{favorites.isStickerFav(group.id, sticker.id) ? 'Unfavorite' : 'Favorite'}
			</button>
			<button
				onclick={copyUrl}
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
				onclick={shareSticker}
				class="flex flex-col items-center justify-center gap-1 rounded-xl bg-secondary py-3 text-xs font-medium text-secondary-foreground active:opacity-80"
			>
				<Share2Icon class="h-4 w-4" />
				Share
			</button>
			<button
				onclick={downloadSticker}
				class="col-span-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-secondary py-3 text-xs font-medium text-secondary-foreground active:opacity-80"
			>
				<DownloadIcon class="h-4 w-4" />
				Save
			</button>
		</div>

		<button
			onclick={onclose}
			class="mt-2 flex w-full items-center justify-center rounded-xl py-3 text-sm text-muted-foreground active:bg-accent"
		>
			<XIcon class="mr-1.5 h-3.5 w-3.5" />
			Close
		</button>
	</div>
</div>
