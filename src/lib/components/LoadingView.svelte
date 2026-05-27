<script lang="ts">
	let { message = '読み込み中...' }: { message?: string } = $props();
</script>

<div class="loading">
	<div class="spinner"></div>
	<p>{message}</p>
</div>

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		color: #666;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #ddd;
		border-top-color: #555;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
