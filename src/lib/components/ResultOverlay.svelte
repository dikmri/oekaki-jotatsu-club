<script lang="ts">
	import { onMount } from 'svelte';
	import type { Difficulty } from '../types/difficulty.js';
	import { renderOverlay } from '../image-processing/overlay-renderer.js';
	import { t } from '../stores/i18n.js';

	let {
		referenceCanvas,
		userCanvas,
		difficulty,
		overlayCanvasRef = $bindable<HTMLCanvasElement | null>(null)
	}: {
		referenceCanvas: HTMLCanvasElement;
		userCanvas: HTMLCanvasElement;
		difficulty: Difficulty;
		overlayCanvasRef?: HTMLCanvasElement | null;
	} = $props();

	let canvas: HTMLCanvasElement;
	let phase = $state<'split' | 'merged'>('split');

	onMount(() => {
		overlayCanvasRef = canvas;
		renderOverlay(canvas, referenceCanvas, userCanvas, difficulty);
		setTimeout(() => (phase = 'merged'), 600);
	});
</script>

<div class="overlay-wrapper">
	<div class="animation-container" class:merged={phase === 'merged'}>
		<div class="panel">
			<p class="panel-label">{$t.overlayReference}</p>
			<canvas
				width={referenceCanvas.width}
				height={referenceCanvas.height}
				class="panel-canvas"
				style="--img: url({referenceCanvas.toDataURL()})"
			></canvas>
		</div>
		<div class="panel">
			<p class="panel-label">{$t.overlayUser}</p>
			<canvas
				width={userCanvas.width}
				height={userCanvas.height}
				class="panel-canvas"
				style="--img: url({userCanvas.toDataURL()})"
			></canvas>
		</div>
	</div>

	<div class="result-canvas-wrap" class:visible={phase === 'merged'}>
		<p class="panel-label center">{$t.overlayResult}</p>
		<canvas bind:this={canvas} width={600} height={600} class="result-canvas"></canvas>
		<div class="legend">
			<span class="leg black">■ {$t.legendMatch}</span>
			<span class="leg blue">■ {$t.legendUser}</span>
			<span class="leg red">■ {$t.legendExtra}</span>
			<span class="leg yellow">■ {$t.legendMissing}</span>
		</div>
	</div>
</div>

<style>
	.overlay-wrapper { position: relative; overflow: hidden; }

	.animation-container {
		display: flex;
		gap: 2rem;
		justify-content: center;
		transition: opacity 0.8s ease, transform 0.8s ease;
	}

	.animation-container.merged {
		opacity: 0;
		pointer-events: none;
		transform: scale(0.9);
	}

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-canvas {
		width: 240px;
		height: 240px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-image: var(--img);
		background-size: cover;
	}

	.panel-label {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	.panel-label.center { text-align: center; }

	.result-canvas-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transition: opacity 0.6s ease;
		pointer-events: none;
	}

	.result-canvas-wrap.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.result-canvas {
		width: 100%;
		max-width: 480px;
		height: auto;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.legend {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
		font-size: 0.8rem;
	}

	.leg { display: flex; align-items: center; gap: 0.25rem; }
	.leg.black { color: #000; }
	.leg.blue { color: #3264dc; }
	.leg.red { color: #dc3232; }
	.leg.yellow { color: #b49614; }
</style>
