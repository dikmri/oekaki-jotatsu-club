import type { ScoreBreakdown } from '../types/score.js';
import type { Difficulty } from '../types/difficulty.js';
import { TOLERANCE_PX } from '../types/difficulty.js';
import { extractEdges, binarize } from './edge-detection.js';
import { buildDistanceMap } from './distance-map.js';

interface Centroid {
	x: number;
	y: number;
}

interface BoundingBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

function getCentroid(pixels: Uint8Array, width: number): Centroid {
	let sumX = 0;
	let sumY = 0;
	let count = 0;
	for (let i = 0; i < pixels.length; i++) {
		if (pixels[i] > 0) {
			sumX += i % width;
			sumY += Math.floor(i / width);
			count++;
		}
	}
	if (count === 0) return { x: 0, y: 0 };
	return { x: sumX / count, y: sumY / count };
}

function getBoundingBox(pixels: Uint8Array, width: number, height: number): BoundingBox {
	let minX = width;
	let minY = height;
	let maxX = 0;
	let maxY = 0;
	for (let i = 0; i < pixels.length; i++) {
		if (pixels[i] > 0) {
			const x = i % width;
			const y = Math.floor(i / width);
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
	return { minX, minY, maxX, maxY };
}

export function calculateScore(
	referenceCanvas: HTMLCanvasElement,
	userCanvas: HTMLCanvasElement,
	difficulty: Difficulty
): ScoreBreakdown {
	const { width, height } = referenceCanvas;
	const tolerance = TOLERANCE_PX[difficulty];

	// お手本: エッジ抽出
	const refEdges = extractEdges(referenceCanvas);
	// ユーザー: 二値化（描いた線を抽出）
	const userEdges = binarize(userCanvas, 200);

	const refTotal = refEdges.filter((v) => v > 0).length;
	const userTotal = userEdges.filter((v) => v > 0).length;

	// 距離マップ構築
	const refDistMap = buildDistanceMap(refEdges, width, height);
	const userDistMap = buildDistanceMap(userEdges, width, height);

	// B: お手本→ユーザー (描き漏れ検出)
	let matchedRef = 0;
	for (let i = 0; i < refEdges.length; i++) {
		if (refEdges[i] > 0 && userDistMap[i] <= tolerance) {
			matchedRef++;
		}
	}

	// A: ユーザー→お手本 (余計な線検出)
	let extraUser = 0;
	for (let i = 0; i < userEdges.length; i++) {
		if (userEdges[i] > 0 && refDistMap[i] > tolerance) {
			extraUser++;
		}
	}

	// 形の一致度 40点
	const shapeScore = refTotal > 0 ? (matchedRef / refTotal) * 40 : 0;

	// 位置の一致度 20点
	const refCenter = getCentroid(refEdges, width);
	const userCenter = getCentroid(userEdges, width);
	const centerDist = Math.sqrt(
		(refCenter.x - userCenter.x) ** 2 + (refCenter.y - userCenter.y) ** 2
	);
	const maxDist = Math.sqrt(width ** 2 + height ** 2);
	const centerPenalty = (centerDist / maxDist) * 40;
	const positionScore = Math.max(0, 20 - centerPenalty);

	// 比率の一致度 20点
	const refBox = getBoundingBox(refEdges, width, height);
	const userBox = getBoundingBox(userEdges, width, height);
	const refW = refBox.maxX - refBox.minX || 1;
	const refH = refBox.maxY - refBox.minY || 1;
	const userW = userBox.maxX - userBox.minX || 1;
	const userH = userBox.maxY - userBox.minY || 1;
	const wDiff = Math.abs(refW - userW) / refW;
	const hDiff = Math.abs(refH - userH) / refH;
	const proportionScore = Math.max(0, 20 - (wDiff + hDiff) * 10);

	// 余計な線の少なさ 10点
	const extraRate = userTotal > 0 ? extraUser / userTotal : 0;
	const extraLinesScore = Math.max(0, 10 - extraRate * 10);

	// 主要ラインの再現度 10点 (MVP簡易版)
	const mainLinesScore = (shapeScore / 40) * 10;

	const total = Math.min(
		100,
		Math.max(
			0,
			Math.round(shapeScore + positionScore + proportionScore + extraLinesScore + mainLinesScore)
		)
	);

	return {
		total,
		shape: Math.round(shapeScore),
		position: Math.round(positionScore),
		proportion: Math.round(proportionScore),
		extraLines: Math.round(extraLinesScore),
		mainLines: Math.round(mainLinesScore)
	};
}
