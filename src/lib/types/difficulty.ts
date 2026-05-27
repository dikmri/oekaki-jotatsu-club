export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
	beginner: '初心者',
	intermediate: '中級者',
	advanced: '上級者'
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
	beginner: 'グリッドあり。線のズレ判定はやや甘め。',
	intermediate: 'デッサンスケールあり。比率と位置を意識。',
	advanced: '補助線なし。線の精度を厳しめに判定。'
};

export const TOLERANCE_PX: Record<Difficulty, number> = {
	beginner: 20,
	intermediate: 12,
	advanced: 6
};
