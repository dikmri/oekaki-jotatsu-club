import type { Stroke, StrokePoint } from '../types/stroke.js';

export function createStroke(tool: 'pen' | 'eraser', size: number, color = '#000000'): Stroke {
	return {
		id: crypto.randomUUID(),
		tool,
		size,
		color,
		points: []
	};
}

export function addPoint(stroke: Stroke, point: StrokePoint): void {
	stroke.points.push(point);
}

export function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
	if (stroke.points.length === 0) return;

	ctx.save();

	if (stroke.tool === 'eraser') {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.strokeStyle = 'rgba(0,0,0,1)';
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = stroke.color;
	}

	ctx.lineWidth = stroke.size;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();

	const [first, ...rest] = stroke.points;
	ctx.moveTo(first.x, first.y);

	if (rest.length === 0) {
		// 点として描画
		ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2);
		ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
		ctx.fill();
	} else {
		for (let i = 0; i < rest.length - 1; i++) {
			const mx = (rest[i].x + rest[i + 1].x) / 2;
			const my = (rest[i].y + rest[i + 1].y) / 2;
			ctx.quadraticCurveTo(rest[i].x, rest[i].y, mx, my);
		}
		const last = rest[rest.length - 1];
		ctx.lineTo(last.x, last.y);
		ctx.stroke();
	}

	ctx.restore();
}

export function renderAllStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	for (const stroke of strokes) {
		renderStroke(ctx, stroke);
	}
}
