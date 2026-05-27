<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { practiceStore } from '$lib/stores/practice-state.js';
	import { calculateScore } from '$lib/image-processing/scoring.js';
	import { renderAllStrokes } from '$lib/drawing/stroke.js';
	import ScorePanel from '$lib/components/ScorePanel.svelte';
	import ResultOverlay from '$lib/components/ResultOverlay.svelte';
	import LoadingView from '$lib/components/LoadingView.svelte';
	import ErrorView from '$lib/components/ErrorView.svelte';
	import type { ScoreBreakdown } from '$lib/types/score.js';

	let state = $derived($practiceStore);
	let score = $state<ScoreBreakdown | null>(null);
	let error = $state<string | null>(null);
	let refCanvas = $state<HTMLCanvasElement | null>(null);
	let userCanvas = $state<HTMLCanvasElement | null>(null);
	let ready = $state(false);

	onMount(async () => {
		if (!state.difficulty || !state.artwork) {
			goto(`${base}/`);
			return;
		}

		try {
			// お手本キャンバスを再構築
			const ref = document.createElement('canvas');
			ref.width = 600;
			ref.height = 600;
			const refCtx = ref.getContext('2d')!;

			const img = new Image();
			img.crossOrigin = 'anonymous';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = reject;
				img.src = state.artwork!.imageUrl;
			});

			// fitImageToCanvas相当
			const scale = Math.min(ref.width / img.naturalWidth, ref.height / img.naturalHeight);
			const x = (ref.width - img.naturalWidth * scale) / 2;
			const y = (ref.height - img.naturalHeight * scale) / 2;
			refCtx.fillStyle = '#ffffff';
			refCtx.fillRect(0, 0, ref.width, ref.height);
			refCtx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
			refCanvas = ref;

			// ユーザー描画を再構築
			const user = document.createElement('canvas');
			user.width = 600;
			user.height = 600;
			const userCtx = user.getContext('2d')!;
			userCtx.fillStyle = '#ffffff';
			userCtx.fillRect(0, 0, user.width, user.height);
			renderAllStrokes(userCtx, state.strokes);
			userCanvas = user;

			// 採点
			const result = calculateScore(ref, user, state.difficulty!);
			score = result;
			practiceStore.setScore(result);
			ready = true;
		} catch (e) {
			console.error('採点処理失敗:', e);
			error = '採点処理に失敗しました。もう一度お試しください。';
		}
	});
</script>

<div class="result-page">
	<header class="header">
		<a href="{base}/" class="back-link">← トップ</a>
		<h1 class="title">採点結果</h1>
	</header>

	{#if error}
		<div class="center-fill">
			<ErrorView message={error} onRetry={() => goto(`${base}/practice`)} />
		</div>
	{:else if !ready || !score || !refCanvas || !userCanvas}
		<div class="center-fill">
			<LoadingView message="採点中..." />
		</div>
	{:else}
		<div class="result-content">
			<ScorePanel {score} />

			{#if state.difficulty}
				<div class="overlay-section">
					<ResultOverlay
						referenceCanvas={refCanvas}
						{userCanvas}
						difficulty={state.difficulty}
					/>
				</div>
			{/if}

			<div class="actions">
				<button class="btn secondary" onclick={() => goto(`${base}/practice`)}>
					もう一度描く
				</button>
				<button
					class="btn secondary"
					onclick={() => {
						practiceStore.setStrokes([]);
						goto(`${base}/practice`);
					}}
				>
					別の作品で描く
				</button>
				<button class="btn primary" onclick={() => goto(`${base}/`)}>
					トップに戻る
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.result-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 1rem;
		gap: 1.5rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
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
	}

	.center-fill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.result-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		align-items: center;
		padding-bottom: 2rem;
	}

	.overlay-section {
		width: 100%;
		max-width: 560px;
	}

	.actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn {
		padding: 0.6rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		border: none;
		transition: background 0.15s;
	}

	.btn.primary {
		background: #4a7fa5;
		color: white;
	}

	.btn.primary:hover { background: #3a6a8c; }

	.btn.secondary {
		background: white;
		color: #4a7fa5;
		border: 1px solid #4a7fa5;
	}

	.btn.secondary:hover { background: #eef4fa; }
</style>
