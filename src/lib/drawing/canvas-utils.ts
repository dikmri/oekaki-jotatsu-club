import type { Difficulty } from '../types/difficulty.js';

export function fitImageToCanvas(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement
): void {
	const { width: cw, height: ch } = ctx.canvas;
	const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
	const x = (cw - img.naturalWidth * scale) / 2;
	const y = (ch - img.naturalHeight * scale) / 2;

	ctx.clearRect(0, 0, cw, ch);
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, cw, ch);
	ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
}

export function drawGuideLines(ctx: CanvasRenderingContext2D, difficulty: Difficulty): void {
	const { width: w, height: h } = ctx.canvas;
	ctx.save();
	ctx.strokeStyle = 'rgba(100,100,200,0.3)';
	ctx.lineWidth = 1;
	ctx.setLineDash([4, 4]);

	if (difficulty === 'beginner') {
		// 10分割グリッド
		const divs = 10;
		for (let i = 1; i < divs; i++) {
			const x = (w / divs) * i;
			const y = (h / divs) * i;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}
	} else if (difficulty === 'intermediate') {
		// 中心線
		ctx.setLineDash([]);
		ctx.strokeStyle = 'rgba(100,100,200,0.4)';
		ctx.beginPath();
		ctx.moveTo(w / 2, 0);
		ctx.lineTo(w / 2, h);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();

		// 三分割線
		ctx.strokeStyle = 'rgba(100,100,200,0.25)';
		ctx.setLineDash([4, 4]);
		for (const frac of [1 / 3, 2 / 3]) {
			ctx.beginPath();
			ctx.moveTo(w * frac, 0);
			ctx.lineTo(w * frac, h);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, h * frac);
			ctx.lineTo(w, h * frac);
			ctx.stroke();
		}

		// 斜め補助線
		ctx.strokeStyle = 'rgba(100,100,200,0.15)';
		ctx.setLineDash([6, 6]);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(w, h);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(w, 0);
		ctx.lineTo(0, h);
		ctx.stroke();
	}
	// advanced: 補助線なし

	ctx.restore();
}

export function canvasToGrayscaleData(canvas: HTMLCanvasElement): ImageData {
	const ctx = canvas.getContext('2d')!;
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
		data[i] = gray;
		data[i + 1] = gray;
		data[i + 2] = gray;
	}

	return imageData;
}

export function getWhiteBackgroundCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
	const result = document.createElement('canvas');
	result.width = src.width;
	result.height = src.height;
	const ctx = result.getContext('2d')!;
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, result.width, result.height);
	ctx.drawImage(src, 0, 0);
	return result;
}
