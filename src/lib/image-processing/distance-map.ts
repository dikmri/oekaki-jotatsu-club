// BFS距離変換: 各ピクセルから最も近いエッジピクセルまでの距離を計算

export function buildDistanceMap(edges: Uint8Array, width: number, height: number): Float32Array {
	const dist = new Float32Array(width * height).fill(Infinity);
	const queue: number[] = [];

	// エッジピクセルを起点にキューに入れる
	for (let i = 0; i < edges.length; i++) {
		if (edges[i] > 0) {
			dist[i] = 0;
			queue.push(i);
		}
	}

	// 4近傍BFS
	const dx = [1, -1, 0, 0];
	const dy = [0, 0, 1, -1];

	let head = 0;
	while (head < queue.length) {
		const idx = queue[head++];
		const x = idx % width;
		const y = Math.floor(idx / width);

		for (let d = 0; d < 4; d++) {
			const nx = x + dx[d];
			const ny = y + dy[d];
			if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
			const nidx = ny * width + nx;
			if (dist[nidx] === Infinity) {
				dist[nidx] = dist[idx] + 1;
				queue.push(nidx);
			}
		}
	}

	return dist;
}
