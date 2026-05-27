<script lang="ts">
	let {
		tool = $bindable<'pen' | 'eraser'>('pen'),
		penSize = $bindable(3),
		onUndo,
		onRedo,
		onClear,
		onComplete
	}: {
		tool?: 'pen' | 'eraser';
		penSize?: number;
		onUndo?: () => void;
		onRedo?: () => void;
		onClear?: () => void;
		onComplete?: () => void;
	} = $props();
</script>

<div class="toolbar">
	<div class="tool-group">
		<button
			class="tool-btn"
			class:active={tool === 'pen'}
			onclick={() => (tool = 'pen')}
			title="ペン"
		>
			✏️ ペン
		</button>
		<button
			class="tool-btn"
			class:active={tool === 'eraser'}
			onclick={() => (tool = 'eraser')}
			title="消しゴム"
		>
			🧹 消しゴム
		</button>
	</div>

	<div class="size-group">
		<label for="pen-size">太さ: {penSize}</label>
		<input
			id="pen-size"
			type="range"
			min="1"
			max="20"
			bind:value={penSize}
		/>
	</div>

	<div class="action-group">
		<button class="action-btn" onclick={onUndo} title="元に戻す">↩ Undo</button>
		<button class="action-btn" onclick={onRedo} title="やり直す">↪ Redo</button>
		<button class="action-btn danger" onclick={onClear} title="全消去">🗑 全消去</button>
	</div>

	<button class="complete-btn" onclick={onComplete}>採点する</button>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem;
		background: #f8f8f8;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.tool-group, .action-group {
		display: flex;
		gap: 0.5rem;
	}

	.tool-btn, .action-btn {
		padding: 0.4rem 0.9rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.15s;
	}

	.tool-btn:hover, .action-btn:hover {
		background: #eee;
	}

	.tool-btn.active {
		background: #4a7fa5;
		color: white;
		border-color: #4a7fa5;
	}

	.action-btn.danger {
		color: #c00;
		border-color: #fcc;
	}

	.action-btn.danger:hover {
		background: #fff0f0;
	}

	.size-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #555;
	}

	.size-group input {
		width: 80px;
	}

	.complete-btn {
		margin-left: auto;
		padding: 0.5rem 1.5rem;
		background: #4a7fa5;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		transition: background 0.15s;
	}

	.complete-btn:hover {
		background: #3a6a8c;
	}
</style>
