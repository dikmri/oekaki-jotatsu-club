<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { practiceStore } from '$lib/stores/practice-state.js';
	import { getRandomArtwork } from '$lib/api/artwork-search.js';
	import ArtworkCanvas from '$lib/components/ArtworkCanvas.svelte';
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import ToolBar from '$lib/components/ToolBar.svelte';
	import LoadingView from '$lib/components/LoadingView.svelte';
	import ErrorView from '$lib/components/ErrorView.svelte';
	import { DIFFICULTY_LABELS } from '$lib/types/difficulty.js';
	import type { Artwork } from '$lib/types/artwork.js';
	import type { Stroke } from '$lib/types/stroke.js';

	let state = $derived($practiceStore);
	let artwork = $state<Artwork | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let tool = $state<'pen' | 'eraser'>('pen');
	let penSize = $state(3);
	let strokes = $state<Stroke[]>([]);

	let referenceCanvasRef = $state<HTMLCanvasElement | null>(null);
	let drawingCanvasRef = $state<HTMLCanvasElement | null>(null);
	let drawingCanvasComponent = $state<DrawingCanvas | null>(null);

	async function loadArtwork() {
		if (!state.difficulty) {
			goto(`${base}/`);
			return;
		}
		loading = true;
		error = null;
		try {
			const result = await getRandomArtwork({ difficulty: state.difficulty });
			if (!result) throw new Error('作品が見つかりませんでした');
			artwork = result;
			practiceStore.setArtwork(result);
		} catch (e) {
			console.error('作品取得失敗:', e);
			error = '美術館APIから作品を取得できませんでした。';
		} finally {
			loading = false;
		}
	}

	function handleComplete() {
		if (!referenceCanvasRef || !drawingCanvasRef) return;
		practiceStore.setStrokes(strokes);
		goto(`${base}/result`);
	}

	onMount(loadArtwork);
</script>

<div class="practice-page">
	<header class="header">
		<a href="{base}/" class="back-link">← トップ</a>
		<h1 class="title">お絵かき上達クラブ</h1>
		{#if state.difficulty}
			<span class="badge">{DIFFICULTY_LABELS[state.difficulty]}</span>
		{/if}
		<button class="change-btn" onclick={loadArtwork} disabled={loading}>
			別の作品
		</button>
	</header>

	{#if loading}
		<div class="center-fill">
			<LoadingView message="作品を取得中..." />
		</div>
	{:else if error}
		<div class="center-fill">
			<ErrorView message={error} onRetry={loadArtwork} />
		</div>
	{:else}
		<div class="canvas-area">
			<div class="canvas-col">
				<p class="col-label">お手本</p>
				{#if artwork && state.difficulty}
					<ArtworkCanvas
						{artwork}
						difficulty={state.difficulty}
						bind:canvasRef={referenceCanvasRef}
					/>
				{/if}
				{#if artwork}
					<div class="artwork-info">
						<span class="artwork-title">{artwork.title}</span>
						<span class="artwork-artist">{artwork.artist}</span>
						{#if artwork.year}<span class="artwork-year">{artwork.year}</span>{/if}
						{#if artwork.sourceUrl}
							<a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer" class="artwork-source">
								出典
							</a>
						{/if}
					</div>
				{/if}
			</div>

			<div class="canvas-col">
				<p class="col-label">模写キャンバス</p>
				{#if state.difficulty}
					<DrawingCanvas
						bind:this={drawingCanvasComponent}
						difficulty={state.difficulty}
						bind:strokes
						bind:canvasRef={drawingCanvasRef}
						bind:tool
						bind:penSize
					/>
				{/if}
				<ToolBar
					bind:tool
					bind:penSize
					onUndo={() => drawingCanvasComponent?.undo()}
					onRedo={() => drawingCanvasComponent?.redo()}
					onClear={() => drawingCanvasComponent?.clear()}
					onComplete={handleComplete}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.practice-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 1rem;
		gap: 1rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
		flex-wrap: wrap;
	}

	.back-link {
		text-decoration: none;
		color: #4a7fa5;
		font-size: 0.9rem;
	}

	.title {
		margin: 0;
		font-size: 1.1rem;
		color: #2c3e50;
		flex: 1;
	}

	.badge {
		background: #eef4fa;
		color: #4a7fa5;
		border: 1px solid #c0d8ec;
		padding: 0.2rem 0.7rem;
		border-radius: 20px;
		font-size: 0.85rem;
	}

	.change-btn {
		padding: 0.35rem 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.change-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.change-btn:not(:disabled):hover { background: #f0f0f0; }

	.center-fill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.canvas-area {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.canvas-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.col-label {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
		font-weight: bold;
	}

	.artwork-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: baseline;
		font-size: 0.8rem;
		color: #777;
	}

	.artwork-title { color: #444; font-weight: bold; }
	.artwork-source { color: #4a7fa5; }

	@media (max-width: 680px) {
		.canvas-area { grid-template-columns: 1fr; }
	}
</style>
