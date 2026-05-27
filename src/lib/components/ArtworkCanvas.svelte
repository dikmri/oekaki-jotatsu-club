<script lang="ts">
	import { onMount } from 'svelte';
	import type { Artwork } from '../types/artwork.js';
	import type { Difficulty } from '../types/difficulty.js';
	import { fitImageToCanvas, drawGuideLines } from '../drawing/canvas-utils.js';
	import { t } from '../stores/i18n.js';

	let {
		artwork,
		difficulty,
		canvasRef = $bindable<HTMLCanvasElement | null>(null)
	}: {
		artwork: Artwork | null;
		difficulty: Difficulty;
		canvasRef?: HTMLCanvasElement | null;
	} = $props();

	let canvas: HTMLCanvasElement;
	let loadError = $state(false);

	function drawArtwork() {
		if (!canvas || !artwork) return;
		const ctx = canvas.getContext('2d')!;
		loadError = false;

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			fitImageToCanvas(ctx, img);
			drawGuideLines(ctx, difficulty);
		};
		img.onerror = () => {
			loadError = true;
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#999';
			ctx.font = '14px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText($t.apiError, canvas.width / 2, canvas.height / 2);
		};
		img.src = artwork.imageUrl;
	}

	onMount(() => {
		canvasRef = canvas;
		drawArtwork();
	});

	$effect(() => {
		void artwork;
		void difficulty;
		drawArtwork();
	});
</script>

<div class="canvas-wrapper">
	<canvas bind:this={canvas} width={600} height={600}></canvas>
	{#if loadError}
		<p class="error-msg">{$t.apiError}</p>
	{/if}
</div>

<style>
	.canvas-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		border: 1px solid #ccc;
		border-radius: 4px;
		overflow: hidden;
	}

	canvas {
		width: 100%;
		height: 100%;
		background: #fff;
		display: block;
	}

	.error-msg {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		color: #c00;
		font-size: 0.8rem;
		background: rgba(255,255,255,0.9);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		white-space: nowrap;
	}
</style>
