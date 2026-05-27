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

<!--
  レイアウト構造:
    .page  (CSS Grid: 3行 = header | canvas-area | bottom-bar)
      .header
      .canvas-area  (CSS Grid: 2列 2行 = [label | label] / [canvas | canvas])
        p.col-label × 2  (行1: auto高さ、左右同じ行なので完全一致)
        .canvas-fill × 2 (行2: 1fr、左右同じ行なので完全一致)
      .bottom-bar (作品情報 | ToolBar)
-->
<div class="page">
	<header class="header">
		<a href="{base}/" class="back-link">{$t.backTop}</a>
		<h1 class="title">{$t.appName}</h1>
		{#if state.difficulty}
			<span class="badge">{$t.diffLabels[state.difficulty]}</span>
		{/if}
		<button class="header-btn" onclick={loadArtwork} disabled={loading}>
			{$t.changeArtwork}
		</button>
		<button class="header-btn round" onclick={toggleLang}>{$t.langSwitch}</button>
	</header>

	{#if loading}
		<div class="center-fill">
			<LoadingView message={$t.loadingArtwork} />
		</div>
		<div class="bottom-bar-placeholder"></div>
	{:else if error}
		<div class="center-fill">
			<ErrorView message={error} onRetry={loadArtwork} />
		</div>
		<div class="bottom-bar-placeholder"></div>
	{:else}
		<!--
			canvas-area: 2列 × 2行グリッド
			行1 (auto): ラベル。左右ともに同じ行 → 完全に同じ高さ
			行2 (1fr) : キャンバス。左右ともに同じ行 → 完全に同じ高さ・幅
		-->
		<div class="canvas-area">
			<p class="col-label">{$t.reference}</p>
			<p class="col-label">{$t.drawingCanvas}</p>

			<div class="canvas-fill">
				{#if artwork && state.difficulty}
					<ArtworkCanvas
						{artwork}
						difficulty={state.difficulty}
						bind:canvasRef={referenceCanvasRef}
					/>
				{/if}
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
		</div>

		<!-- ツールバー + 作品情報: キャンバス列の外に置くことでキャンバス高さに影響しない -->
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
	/*
	 * ページ全体を 3行 CSS Grid で管理。
	 * header=auto、canvas-area=1fr（残り全部）、bottom-bar=auto
	 * overflow:hidden でviewport外への溢れを完全防止。
	 */
	.page {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		overflow: hidden;
		padding: 0.4rem;
		gap: 0.4rem;
		box-sizing: border-box;
	}

	/* ─── ヘッダー ─── */
	.header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: white;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		border: 1px solid #ddd;
		flex-wrap: wrap;
		overflow: hidden;
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
		min-width: 0;
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

	.header-btn {
		padding: 0.2rem 0.65rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		font-size: 0.78rem;
		white-space: nowrap;
		color: #555;
	}

	.header-btn.round { border-radius: 20px; }
	.header-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.header-btn:not(:disabled):hover { background: #f0f0f0; }

	/* loading/error 時の中央表示 */
	.center-fill {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.bottom-bar-placeholder { height: 0; }

	/*
	 * ─── キャンバスエリア ───
	 *
	 * 2列 × 2行グリッド:
	 *   列: 1fr | 1fr  → 左右等幅
	 *   行: auto | 1fr → ラベル行(auto) + キャンバス行(1fr)
	 *
	 * 同じ行セルに配置されるため左右キャンバスは完全に同じ高さ・幅になる。
	 * min-height:0 + overflow:hidden でcanvasの自然サイズ(600px)が溢れないよう防ぐ。
	 */
	.canvas-area {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto 1fr;
		column-gap: 0.5rem;
		row-gap: 0.2rem;
		min-height: 0;
		overflow: hidden;
	}

	.col-label {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.4;
		color: #666;
		font-weight: bold;
	}

	/*
	 * canvas-fill はグリッドの 1fr 行セルに直接配置される。
	 * height は親グリッドが決定するため % 指定が確実に機能する。
	 * overflow:hidden でキャンバス要素の自然サイズが外に出るのを防ぐ。
	 */
	.canvas-fill {
		min-height: 0;
		overflow: hidden;
		position: relative;
	}

	/* ─── 下段バー ─── */
	.bottom-bar {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: center;
		overflow: hidden;
	}

	.artwork-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.4rem;
		align-items: baseline;
		font-size: 0.72rem;
		color: #888;
		overflow: hidden;
		padding: 0.1rem 0.25rem;
		min-width: 0;
	}

	.artwork-title {
		color: #444;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 260px;
		min-width: 0;
	}

	.sep { color: #ccc; }
	.artwork-info a { color: #4a7fa5; }

	/* ─── スマホ ─── */
	@media (max-width: 600px) {
		.page {
			height: auto;
			min-height: 100dvh;
			overflow: auto;
		}

		.canvas-area {
			grid-template-columns: 1fr;
			grid-template-rows: auto 300px auto 300px;
		}

		.bottom-bar {
			grid-template-columns: 1fr;
		}
	}
</style>
