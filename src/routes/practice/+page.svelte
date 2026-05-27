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
	import { t, toggleLang } from '$lib/stores/i18n.js';
	import type { Artwork } from '$lib/types/artwork.js';
	import type { Stroke } from '$lib/types/stroke.js';

	let state = $derived($practiceStore);
	let artwork = $state<Artwork | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let tool = $state<'pen' | 'eraser'>('pen');
	let penSize = $state(1);
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
			if (!result) throw new Error('No artworks found');
			artwork = result;
			practiceStore.setArtwork(result);
		} catch (e) {
			console.error('作品取得失敗:', e);
			error = $t.apiError;
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
	<!-- ヘッダー -->
	<header class="header">
		<a href="{base}/" class="back-link">{$t.backTop}</a>
		<h1 class="title">{$t.appName}</h1>
		{#if state.difficulty}
			<span class="badge">{$t.diffLabels[state.difficulty]}</span>
		{/if}
		<button class="change-btn" onclick={loadArtwork} disabled={loading}>
			{$t.changeArtwork}
		</button>
		<button class="lang-btn" onclick={toggleLang}>{$t.langSwitch}</button>
	</header>

	<!-- メインコンテンツ -->
	{#if loading}
		<div class="center-fill">
			<LoadingView message={$t.loadingArtwork} />
		</div>
	{:else if error}
		<div class="center-fill">
			<ErrorView message={error} onRetry={loadArtwork} />
		</div>
	{:else}
		<div class="canvas-area">
			<!-- 左: お手本 -->
			<div class="canvas-col">
				<div class="col-header">
					<p class="col-label">{$t.reference}</p>
					{#if artwork}
						<div class="artwork-info">
							<span class="artwork-title">{artwork.title}</span>
							<span class="artwork-artist">{artwork.artist}</span>
							{#if artwork.year}<span>{artwork.year}</span>{/if}
							{#if artwork.sourceUrl}
								<a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer">
									{$t.source}
								</a>
							{/if}
						</div>
					{/if}
				</div>
				<div class="canvas-fill">
					{#if artwork && state.difficulty}
						<ArtworkCanvas
							{artwork}
							difficulty={state.difficulty}
							bind:canvasRef={referenceCanvasRef}
						/>
					{/if}
				</div>
			</div>

			<!-- 右: 描画 -->
			<div class="canvas-col">
				<div class="col-header">
					<p class="col-label">{$t.drawingCanvas}</p>
				</div>
				<div class="canvas-fill">
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
				</div>
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
	/* 画面全体をビューポートに収める — スクロール禁止 */
	.practice-page {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0.5rem;
		gap: 0.5rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid #ddd;
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	.back-link {
		text-decoration: none;
		color: #4a7fa5;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.title {
		margin: 0;
		font-size: 1rem;
		color: #2c3e50;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge {
		background: #eef4fa;
		color: #4a7fa5;
		border: 1px solid #c0d8ec;
		padding: 0.15rem 0.6rem;
		border-radius: 20px;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.change-btn {
		padding: 0.25rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.change-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.change-btn:not(:disabled):hover { background: #f0f0f0; }

	.lang-btn {
		padding: 0.25rem 0.75rem;
		border: 1px solid #bbb;
		border-radius: 20px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
		color: #555;
	}

	.lang-btn:hover { background: #f0f0f0; }

	.center-fill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}

	/* キャンバスエリア: 残り高さを2列で均等に使う */
	.canvas-area {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.canvas-col {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-height: 0;
	}

	.col-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex-shrink: 0;
	}

	.col-label {
		margin: 0;
		font-size: 0.8rem;
		color: #666;
		font-weight: bold;
		white-space: nowrap;
	}

	.artwork-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: baseline;
		font-size: 0.72rem;
		color: #888;
		overflow: hidden;
	}

	.artwork-title {
		color: #444;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 200px;
	}

	.artwork-info a { color: #4a7fa5; }

	/* キャンバスが縦を埋め尽くす */
	.canvas-fill {
		flex: 1;
		min-height: 0;
		position: relative;
	}

	@media (max-width: 640px) {
		.canvas-area {
			grid-template-columns: 1fr;
		}

		.practice-page {
			height: auto;
			min-height: 100dvh;
			overflow: auto;
		}

		.canvas-fill {
			aspect-ratio: 1;
			height: auto;
		}
	}
</style>
