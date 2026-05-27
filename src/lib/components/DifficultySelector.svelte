<script lang="ts">
	import type { Difficulty } from '../types/difficulty.js';
	import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from '../types/difficulty.js';

	let {
		selected = $bindable<Difficulty | null>(null)
	}: {
		selected?: Difficulty | null;
	} = $props();

	const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
</script>

<div class="selector">
	{#each difficulties as diff}
		<button
			class="option"
			class:active={selected === diff}
			onclick={() => (selected = diff)}
		>
			<span class="label">{DIFFICULTY_LABELS[diff]}</span>
			<span class="desc">{DIFFICULTY_DESCRIPTIONS[diff]}</span>
		</button>
	{/each}
</div>

<style>
	.selector {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 1.5rem;
		border: 2px solid #ccc;
		border-radius: 10px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 140px;
	}

	.option:hover {
		border-color: #888;
		background: #f8f8f8;
	}

	.option.active {
		border-color: #4a7fa5;
		background: #eef4fa;
	}

	.label {
		font-size: 1.1rem;
		font-weight: bold;
		color: #333;
	}

	.desc {
		font-size: 0.75rem;
		color: #666;
		text-align: center;
		line-height: 1.4;
	}
</style>
