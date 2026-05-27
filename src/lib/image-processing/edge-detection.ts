// Cannyエッジ検出の軽量実装（OpenCV.jsなし）

function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
	const gray = new Float32Array(width * height);
	for (let i = 0; i < width * height; i++) {
		const r = data[i * 4];
		const g = data[i * 4 + 1];
		const b = data[i * 4 + 2];
		gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
	}
	return gray;
}

function gaussianBlur(gray: Float32Array, width: number, height: number): Float32Array {
	// 3x3 Gaussian kernel
	const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
	const kernelSum = 16;
	const result = new Float32Array(width * height);

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let sum = 0;
			let ki = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					sum += gray[(y + dy) * width + (x + dx)] * kernel[ki++];
				}
			}
			result[y * width + x] = sum / kernelSum;
		}
	}
	return result;
}

function sobelGradient(gray: Float32Array, width: number, height: number): { mag: Float32Array; angle: Float32Array } {
	const mag = new Float32Array(width * height);
	const angle = new Float32Array(width * height);

	const Kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
	const Ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			let gx = 0;
			let gy = 0;
			let ki = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const v = gray[(y + dy) * width + (x + dx)];
					gx += v * Kx[ki];
					gy += v * Ky[ki];
					ki++;
				}
			}
			const idx = y * width + x;
			mag[idx] = Math.sqrt(gx * gx + gy * gy);
			angle[idx] = Math.atan2(gy, gx);
		}
	}
	return { mag, angle };
}

function nonMaxSuppression(mag: Float32Array, angle: Float32Array, width: number, height: number): Float32Array {
	const result = new Float32Array(width * height);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const idx = y * width + x;
			const theta = ((angle[idx] * 180) / Math.PI + 180) % 180;

			let n1: number;
			let n2: number;
			if ((theta >= 0 && theta < 22.5) || (theta >= 157.5 && theta <= 180)) {
				n1 = mag[y * width + x - 1];
				n2 = mag[y * width + x + 1];
			} else if (theta >= 22.5 && theta < 67.5) {
				n1 = mag[(y - 1) * width + x + 1];
				n2 = mag[(y + 1) * width + x - 1];
			} else if (theta >= 67.5 && theta < 112.5) {
				n1 = mag[(y - 1) * width + x];
				n2 = mag[(y + 1) * width + x];
			} else {
				n1 = mag[(y - 1) * width + x - 1];
				n2 = mag[(y + 1) * width + x + 1];
			}

			result[idx] = mag[idx] >= n1 && mag[idx] >= n2 ? mag[idx] : 0;
		}
	}
	return result;
}

function doubleThreshold(nms: Float32Array, width: number, height: number, low: number, high: number): Uint8Array {
	const result = new Uint8Array(width * height);
	for (let i = 0; i < nms.length; i++) {
		if (nms[i] >= high) result[i] = 255;
		else if (nms[i] >= low) result[i] = 128;
	}
	return result;
}

export function extractEdges(canvas: HTMLCanvasElement): Uint8Array {
	const ctx = canvas.getContext('2d')!;
	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height);

	const gray = toGrayscale(imageData.data, width, height);
	const blurred = gaussianBlur(gray, width, height);
	const { mag, angle } = sobelGradient(blurred, width, height);
	const nms = nonMaxSuppression(mag, angle, width, height);
	return doubleThreshold(nms, width, height, 20, 60);
}

export function binarize(canvas: HTMLCanvasElement, threshold = 200): Uint8Array {
	const ctx = canvas.getContext('2d')!;
	const { width, height } = canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	const result = new Uint8Array(width * height);

	for (let i = 0; i < width * height; i++) {
		const gray = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
		// 暗い（描かれた）ピクセルを線として扱う
		result[i] = gray < threshold ? 255 : 0;
	}
	return result;
}
