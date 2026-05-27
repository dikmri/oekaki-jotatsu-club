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
	<!-- ヘッダー（flex-shrink: 0） -->
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

	{#if loading}
		<div class="center-fill">
			<LoadingView message={$t.loadingArtwork} />
		</div>
	{:else if error}
		<div class="center-fill">
			<ErrorView message={error} onRetry={loadArtwork} />
		</div>
	{:else}
		<!--
			キャンバスエリア: 左右どちらも「ラベル行 + キャンバス」だけ。
			ToolBar・artwork-info は外に出すことで両キャンバスが同じ高さになる。
		-->
		<div class="canvas-area">
			<!-- 左: お手本 -->
			<div class="canvas-col">
				<p class="col-label">{$t.reference}</p>
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
				<p class="col-label">{$t.drawingCanvas}</p>
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
			</div>
		</div>

		<!--
			下段バー: 左にartwork情報、右にツールバー。
			キャンバスエリアの外に出すことで左右のキャンバス高さを揃える。
		-->
		<div class="bottom-bar">
			<div class="artwork-info">
				{#if artwork}
					<span class="artwork-title">{artwork.title}</span>
					<span class="sep">—</span>
					<span>{artwork.artist}</span>
					{#if artwork.year}<span>{artwork.year}</span>{/if}
					{#if artwork.sourceUrl}
						<a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer">
							{$t.source}
						</a>
					{/if}
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
	{/if}
</div>

<style>
	.practice-page {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0.4rem;
		gap: 0.4rem;
	}

	/* ヘッダー */
	.header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: white;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		border: 1px solid #ddd;
		flex-shrink: 0;
		flex-wrap: wrap;
		min-height: 0;
	}

	.back-link {
		text-decoration: none;
		color: #4a7fa5;
		font-size: 0.82rem;
		white-space: nowrap;
	}

	.title {
		margin: 0;
		font-size: 0.95rem;
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
		padding: 0.1rem 0.55rem;
		border-radius: 20px;
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.change-btn, .lang-btn {
		padding: 0.2rem 0.65rem;
		border: 1px solid #ccc;
		border-radius: 20px;
		background: white;
		cursor: pointer;
		font-size: 0.78rem;
		white-space: nowrap;
		color: #555;
	}

	.change-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.change-btn:not(:disabled):hover, .lang-btn:hover { background: #f0f0f0; }

	.center-fill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}

	/*
	 * キャンバスエリア本体。
	 * 左右どちらの列も「ラベル + canvas-fill」だけにして高さを完全に一致させる。
	 * ToolBar / artwork-info は bottom-bar に分離。
	 */
	.canvas-area {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.canvas-col {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-height: 0;
	}

	.col-label {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.2;
		color: #666;
		font-weight: bold;
		flex-shrink: 0;
	}

	/* キャンバスが列の残り高さをすべて使う */
	.canvas-fill {
		flex: 1;
		min-height: 0;
		position: relative;
	}

	/* 下段バー: artwork情報（左）＋ToolBar（右）を横並び */
	.bottom-bar {
		flex-shrink: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: center;
	}

	.artwork-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.5rem;
		align-items: baseline;
		font-size: 0.72rem;
		color: #888;
		overflow: hidden;
		padding: 0.15rem 0.4rem;
	}

	.artwork-title {
		color: #444;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
	}

	.sep { color: #bbb; }
	.artwork-info a { color: #4a7fa5; }

	@media (max-width: 600px) {
		.canvas-area { grid-template-columns: 1fr; }
		.bottom-bar { grid-template-columns: 1fr; }
		.practice-page { height: auto; overflow: auto; }
		.canvas-fill { aspect-ratio: 1; flex: none; }
	}
</style>
