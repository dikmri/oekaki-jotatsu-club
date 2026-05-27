<script lang="ts">
	import { onMount } from 'svelte';
	import type { Difficulty } from '../types/difficulty.js';
	import { renderOverlay } from '../image-processing/overlay-renderer.js';

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
		// まず結果を描画してからアニメーション
		renderOverlay(canvas, referenceCanvas, userCanvas, difficulty);
		// 短い遅延後にマージアニメーション
		setTimeout(() => (phase = 'merged'), 600);
	});
</script>

<div class="overlay-wrapper">
	<div class="animation-container" class:merged={phase === 'merged'}>
		<div class="panel left-panel">
			<p class="panel-label">お手本</p>
			<canvas
				width={referenceCanvas.width}
				height={referenceCanvas.height}
				class="panel-canvas"
				style="--img: url({referenceCanvas.toDataURL()})"
			></canvas>
		</div>
		<div class="panel right-panel">
			<p class="panel-label">あなたの模写</p>
			<canvas
				width={userCanvas.width}
				height={userCanvas.height}
				class="panel-canvas"
				style="--img: url({userCanvas.toDataURL()})"
			></canvas>
		</div>
	</div>

	<div class="result-canvas-wrap" class:visible={phase === 'merged'}>
		<p class="panel-label center">重ね合わせ結果</p>
		<canvas bind:this={canvas} width={600} height={600} class="result-canvas"></canvas>
		<div class="legend">
			<span class="leg black">■ 一致</span>
			<span class="leg blue">■ ユーザー線</span>
			<span class="leg red">■ ズレ線</span>
			<span class="leg yellow">■ 描き漏れ</span>
		</div>
	</div>
</div>

<style>
	.overlay-wrapper {
		position: relative;
		overflow: hidden;
	}

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

	.panel-label.center {
		text-align: center;
	}

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
