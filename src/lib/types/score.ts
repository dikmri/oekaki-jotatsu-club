export type ScoreBreakdown = {
	total: number;
	shape: number;
	position: number;
	proportion: number;
	extraLines: number;
	mainLines: number;
};

export const SCORE_MAX: ScoreBreakdown = {
	total: 100,
	shape: 40,
	position: 20,
	proportion: 20,
	extraLines: 10,
	mainLines: 10
};
