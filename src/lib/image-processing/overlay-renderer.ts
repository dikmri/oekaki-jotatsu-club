import { extractEdges, binarize } from './edge-detection.js';
import { buildDistanceMap } from './distance-map.js';
import type { Difficulty } from '../types/difficulty.js';
import { TOLERANCE_PX } from '../types/difficulty.js';

// 色分けして重ね合わせ画像を生成し、結果キャンバスに描画する
export function renderOverlay(
	resultCanvas: HTMLCanvasElement,
	referenceCanvas: HTMLCanvasElement,
	userCanvas: HTMLCanvasElement,
	difficulty: Difficulty
): void {
	const { width, height } = resultCanvas;
	const ctx = resultCanvas.getContext('2d')!;
	const tolerance = TOLERANCE_PX[difficulty];

	const refEdges = extractEdges(referenceCanvas);
	const userEdges = binarize(userCanvas, 200);
	const refDistMap = buildDistanceMap(refEdges, width, height);
	const userDistMap = buildDistanceMap(userEdges, width, height);

	// 白背景
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	for (let i = 0; i < width * height; i++) {
		const isRef = refEdges[i] > 0;
		const isUser = userEdges[i] > 0;
		const base = i * 4;

		if (isRef && isUser) {
			// 一致: 黒
			data[base] = 0;
			data[base + 1] = 0;
			data[base + 2] = 0;
			data[base + 3] = 255;
		} else if (isUser && refDistMap[i] > tolerance) {
			// 余計な線: 赤
			data[base] = 220;
			data[base + 1] = 50;
			data[base + 2] = 50;
			data[base + 3] = 255;
		} else if (isUser) {
			// ユーザー線（近い）: 青
			data[base] = 50;
			data[base + 1] = 100;
			data[base + 2] = 220;
			data[base + 3] = 255;
		} else if (isRef && userDistMap[i] > tolerance) {
			// 描き漏れ: 黄
			data[base] = 220;
			data[base + 1] = 180;
			data[base + 2] = 20;
			data[base + 3] = 255;
		} else if (isRef) {
			// お手本線（薄いグレー）
			data[base] = 180;
			data[base + 1] = 180;
			data[base + 2] = 180;
			data[base + 3] = 255;
		} else {
			// 背景: 白
			data[base] = 255;
			data[base + 1] = 255;
			data[base + 2] = 255;
			data[base + 3] = 255;
		}
	}

	ctx.putImageData(imageData, 0, 0);
}
