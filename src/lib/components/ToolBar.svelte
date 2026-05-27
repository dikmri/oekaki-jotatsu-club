<script lang="ts">
	import { t } from '../stores/i18n.js';

	let {
		tool = $bindable<'pen' | 'eraser'>('pen'),
		penSize = $bindable(1),
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
		>
			✏️ {$t.pen}
		</button>
		<button
			class="tool-btn"
			class:active={tool === 'eraser'}
			onclick={() => (tool = 'eraser')}
		>
			🧹 {$t.eraser}
		</button>
	</div>

	<div class="size-group">
		<button
			class="size-btn"
			class:active={penSize === 0.5}
			onclick={() => (penSize = 0.5)}
		>
			{$t.sizeHalf}
		</button>
		<button
			class="size-btn"
			class:active={penSize === 1}
			onclick={() => (penSize = 1)}
		>
			{$t.sizeFull}
		</button>
	</div>

	<div class="action-group">
		<button class="action-btn" onclick={onUndo}>{$t.undo}</button>
		<button class="action-btn" onclick={onRedo}>{$t.redo}</button>
		<button class="action-btn danger" onclick={onClear}>🗑 {$t.clearAll}</button>
	</div>

	<button class="complete-btn" onclick={onComplete}>{$t.submit}</button>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #f8f8f8;
		border: 1px solid #ddd;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.tool-group,
	.action-group,
	.size-group {
		display: flex;
		gap: 0.35rem;
	}

	.tool-btn,
	.action-btn,
	.size-btn {
		padding: 0.3rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.tool-btn:hover,
	.action-btn:hover,
	.size-btn:hover {
		background: #eee;
	}

	.tool-btn.active,
	.size-btn.active {
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

	.complete-btn {
		margin-left: auto;
		padding: 0.4rem 1.2rem;
		background: #4a7fa5;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: bold;
		transition: background 0.15s;
		white-space: nowrap;
	}

	.complete-btn:hover {
		background: #3a6a8c;
	}
</style>
