<script lang="ts">
	import type { ScoreBreakdown } from '../types/score.js';
	import { SCORE_MAX } from '../types/score.js';
	import { t } from '../stores/i18n.js';

	let { score }: { score: ScoreBreakdown } = $props();

	const keys = [
		{ key: 'shape' as const, max: SCORE_MAX.shape },
		{ key: 'position' as const, max: SCORE_MAX.position },
		{ key: 'proportion' as const, max: SCORE_MAX.proportion },
		{ key: 'extraLines' as const, max: SCORE_MAX.extraLines },
		{ key: 'mainLines' as const, max: SCORE_MAX.mainLines }
	];
</script>

<div class="score-panel">
	<div class="total">
		<span class="total-label">{$t.totalScore}</span>
		<span class="total-value">{score.total}<small>{$t.scorePoint}</small></span>
	</div>

	<div class="breakdown">
		{#each keys as item}
			<div class="item">
				<span class="item-label">{$t[item.key]}</span>
				<div class="bar-wrap">
					<div class="bar" style:width="{(score[item.key] / item.max) * 100}%"></div>
				</div>
				<span class="item-score">{score[item.key]} / {item.max}</span>
			</div>
		{/each}
	</div>

	<p class="notice">
		{#each $t.scoreNotice.split('\n') as line, i}
			{#if i > 0}<br />{/if}{line}
		{/each}
	</p>
</div>

<style>
	.score-panel {
		background: white;
		border: 1px solid #ddd;
		border-radius: 10px;
		padding: 1.5rem;
		max-width: 480px;
		margin: 0 auto;
	}

	.total {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.total-label { font-size: 1rem; color: #666; }

	.total-value {
		font-size: 3rem;
		font-weight: bold;
		color: #4a7fa5;
	}

	.total-value small { font-size: 1.2rem; }

	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.item {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	.item-label { font-size: 0.85rem; color: #444; }

	.bar-wrap {
		background: #eee;
		border-radius: 4px;
		height: 8px;
		overflow: hidden;
	}

	.bar {
		height: 100%;
		background: #4a7fa5;
		border-radius: 4px;
		transition: width 0.6s ease;
	}

	.item-score {
		font-size: 0.85rem;
		color: #555;
		white-space: nowrap;
	}

	.notice {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: #999;
		text-align: center;
		line-height: 1.5;
		border-top: 1px solid #eee;
		padding-top: 1rem;
	}
</style>
