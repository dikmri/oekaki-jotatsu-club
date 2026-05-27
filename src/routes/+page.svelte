<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import DifficultySelector from '$lib/components/DifficultySelector.svelte';
	import { practiceStore } from '$lib/stores/practice-state.js';
	import { t, toggleLang } from '$lib/stores/i18n.js';
	import type { Difficulty } from '$lib/types/difficulty.js';

	let selected = $state<Difficulty | null>(null);

	function start() {
		if (!selected) return;
		practiceStore.setDifficulty(selected);
		goto(`${base}/practice`);
	}
</script>

<main class="top">
	<button class="lang-btn" onclick={toggleLang}>{$t.langSwitch}</button>

	<header class="hero">
		<h1>{$t.appName}</h1>
		<p class="tagline">
			{#each $t.tagline.split('\n') as line, i}
				{#if i > 0}<br />{/if}{line}
			{/each}
		</p>
	</header>

	<section class="difficulty-section">
		<h2>{$t.chooseDifficulty}</h2>
		<DifficultySelector bind:selected />
	</section>

	<button class="start-btn" disabled={!selected} onclick={start}>
		{$t.startPractice}
	</button>

	<footer class="info">
		<p>
			{#each $t.footerNote.split('\n') as line, i}
				{#if i > 0}<br />{/if}{line}
			{/each}
		</p>
	</footer>
</main>

<style>
	.top {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2.5rem;
		padding: 2rem;
		position: relative;
	}

	.lang-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.35rem 0.9rem;
		border: 1px solid #bbb;
		border-radius: 20px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
		color: #555;
		transition: background 0.15s;
	}

	.lang-btn:hover { background: #f0f0f0; }

	.hero { text-align: center; }

	h1 {
		font-size: 2.4rem;
		margin: 0 0 0.5rem;
		color: #2c3e50;
	}

	.tagline {
		font-size: 1rem;
		color: #666;
		line-height: 1.7;
		margin: 0;
	}

	.difficulty-section { text-align: center; }

	h2 {
		font-size: 1.1rem;
		color: #555;
		margin: 0 0 1rem;
		font-weight: normal;
	}

	.start-btn {
		padding: 0.8rem 3rem;
		font-size: 1.2rem;
		font-weight: bold;
		background: #4a7fa5;
		color: white;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.start-btn:disabled {
		background: #aac;
		cursor: not-allowed;
	}

	.start-btn:not(:disabled):hover { background: #3a6a8c; }

	.info {
		font-size: 0.75rem;
		color: #999;
		text-align: center;
		line-height: 1.6;
	}

	.info p { margin: 0; }
</style>
