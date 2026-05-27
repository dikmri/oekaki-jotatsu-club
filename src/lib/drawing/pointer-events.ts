import type { StrokePoint } from '../types/stroke.js';

export function getCanvasPoint(
	e: PointerEvent,
	canvas: HTMLCanvasElement
): StrokePoint {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	return {
		x: (e.clientX - rect.left) * scaleX,
		y: (e.clientY - rect.top) * scaleY,
		pressure: e.pressure > 0 ? e.pressure : undefined
	};
}
