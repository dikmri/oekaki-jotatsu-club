export type StrokePoint = {
	x: number;
	y: number;
	pressure?: number;
};

export type Stroke = {
	id: string;
	tool: 'pen' | 'eraser';
	size: number;
	color: string;
	points: StrokePoint[];
};
