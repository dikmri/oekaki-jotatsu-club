<script lang="ts">
	let { message, onRetry }: { message: string; onRetry?: () => void } = $props();
</script>

<div class="error">
	<p class="icon">⚠️</p>
	<p class="message">{message}</p>
	{#if onRetry}
		<button onclick={onRetry}>もう一度試す</button>
	{/if}
</div>

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		background: #fff5f5;
		border: 1px solid #ffcccc;
		border-radius: 8px;
		color: #c00;
	}

	.icon { font-size: 2rem; margin: 0; }
	.message { margin: 0; }

	button {
		padding: 0.5rem 1.5rem;
		background: #c00;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	button:hover { background: #a00; }
</style>
