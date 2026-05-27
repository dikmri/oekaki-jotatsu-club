<script lang="ts">
	import { onMount } from 'svelte';
	import type { Stroke } from '../types/stroke.js';
	import type { Difficulty } from '../types/difficulty.js';
	import { createStroke, addPoint, renderAllStrokes, renderStroke } from '../drawing/stroke.js';
	import { getCanvasPoint } from '../drawing/pointer-events.js';
	import { drawGuideLines } from '../drawing/canvas-utils.js';

	let {
		difficulty,
		strokes = $bindable<Stroke[]>([]),
		canvasRef = $bindable<HTMLCanvasElement | null>(null),
		tool = 'pen',
		penSize = 1
	}: {
		difficulty: Difficulty;
		strokes?: Stroke[];
		canvasRef?: HTMLCanvasElement | null;
		tool?: 'pen' | 'eraser';
		penSize?: number;
	} = $props();

	let drawingCanvas: HTMLCanvasElement;
	let guideCanvas: HTMLCanvasElement;

	let history: Stroke[][] = $state([[]]);
	let historyIndex = $state(0);

	let currentStroke: Stroke | null = null;
	let isPointerDown = false;

	function redrawGuides() {
		if (!guideCanvas) return;
		const ctx = guideCanvas.getContext('2d')!;
		ctx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
		drawGuideLines(ctx, difficulty);
	}

	function redrawDrawing() {
		if (!drawingCanvas) return;
		const ctx = drawingCanvas.getContext('2d')!;
		// 透明クリアしてからストロークを再描画
		ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
		renderAllStrokes(ctx, strokes);
	}

	function commitHistory() {
		history = history.slice(0, historyIndex + 1);
		history = [...history, JSON.parse(JSON.stringify(strokes))];
		historyIndex = history.length - 1;
	}

	export function undo() {
		if (historyIndex <= 0) return;
		historyIndex--;
		strokes = JSON.parse(JSON.stringify(history[historyIndex]));
		redrawDrawing();
	}

	export function redo() {
		if (historyIndex >= history.length - 1) return;
		historyIndex++;
		strokes = JSON.parse(JSON.stringify(history[historyIndex]));
		redrawDrawing();
	}

	export function clear() {
		strokes = [];
		commitHistory();
		redrawDrawing();
	}

	function onPointerDown(e: PointerEvent) {
		if (!drawingCanvas) return;
		e.preventDefault();
		(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
		isPointerDown = true;

		currentStroke = createStroke(tool, penSize);
		const pt = getCanvasPoint(e, drawingCanvas);
		addPoint(currentStroke, pt);

		const ctx = drawingCanvas.getContext('2d')!;
		renderStroke(ctx, currentStroke);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isPointerDown || !currentStroke || !drawingCanvas) return;
		e.preventDefault();
		const pt = getCanvasPoint(e, drawingCanvas);
		addPoint(currentStroke, pt);
		const ctx = drawingCanvas.getContext('2d')!;
		renderStroke(ctx, currentStroke);
	}

	function onPointerUp(e: PointerEvent) {
		if (!isPointerDown || !currentStroke) return;
		e.preventDefault();
		isPointerDown = false;
		strokes = [...strokes, currentStroke];
		currentStroke = null;
		commitHistory();
	}

	onMount(() => {
		canvasRef = drawingCanvas;
		redrawGuides();
		history = [[]];
		historyIndex = 0;
	});

	$effect(() => {
		void difficulty;
		redrawGuides();
	});
</script>

<div class="canvas-wrapper">
	<!-- 白背景 -->
	<div class="white-bg"></div>
	<!-- 補助線レイヤー（背景の上） -->
	<canvas bind:this={guideCanvas} width={600} height={600} class="layer guide-layer"></canvas>
	<!-- 描画レイヤー（最前面・透明背景） -->
	<canvas
		bind:this={drawingCanvas}
		width={600}
		height={600}
		class="layer drawing-layer"
		style:cursor={tool === 'eraser' ? 'cell' : 'crosshair'}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointerleave={onPointerUp}
	></canvas>
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

	.white-bg {
		position: absolute;
		inset: 0;
		background: #fff;
		z-index: 0;
	}

	.layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.guide-layer {
		pointer-events: none;
		z-index: 1;
	}

	.drawing-layer {
		/* 背景透明 — ガイド線がこの下に透けて見える */
		background: transparent;
		z-index: 2;
	}
</style>
