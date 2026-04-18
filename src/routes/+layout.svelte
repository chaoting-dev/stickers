<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	let { children } = $props();

	let searchQuery = $state('');
	let searchOpen = $state(false);

	const isHome = $derived(
		page.url.pathname === base + '/' ||
			page.url.pathname === base ||
			page.url.pathname === base + ''
	);

	function openSearch() {
		// Pre-populate with current query when opening on home page
		searchQuery = page.url.searchParams.get('q') ?? '';
		searchOpen = true;
		if (!isHome) goto(`${base}/`);
	}

	function submitSearch(e: Event) {
		e.preventDefault();
		const q = searchQuery.trim();
		goto(q ? `${base}/?q=${encodeURIComponent(q)}` : `${base}/`);
		searchOpen = false;
	}

	function clearSearch() {
		searchQuery = '';
		goto(`${base}/`);
		searchOpen = false;
	}

	function goBack() {
		history.back();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-svh flex-col">
	<header
		class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		style="padding-top: env(safe-area-inset-top)"
	>
		<div class="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
			{#if !isHome && !searchOpen}
				<button
					onclick={goBack}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-accent active:bg-accent"
					aria-label="Go back"
				>
					<ChevronLeftIcon class="h-5 w-5" />
				</button>
			{/if}

			{#if searchOpen}
				<form onsubmit={submitSearch} class="flex flex-1 items-center gap-2">
					<input
						{@attach (el) => { el.focus(); }}
						type="search"
						placeholder="Search stickers..."
						bind:value={searchQuery}
						class="h-10 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
					/>
					<button
						type="button"
						onclick={clearSearch}
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-accent active:bg-accent"
						aria-label="Clear search"
					>
						<XIcon class="h-4 w-4" />
					</button>
				</form>
			{:else}
				<a href="{base}/" class="mr-auto text-base font-semibold tracking-tight">Stickers</a>
				<button
					onclick={openSearch}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-accent active:bg-accent"
					aria-label="Search"
				>
					<SearchIcon class="h-5 w-5" />
				</button>
			{/if}
		</div>
	</header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-4">
		{@render children()}
	</main>

	<div style="height: env(safe-area-inset-bottom)"></div>
</div>
