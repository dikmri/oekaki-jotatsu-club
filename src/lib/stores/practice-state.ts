import { writable } from 'svelte/store';
import type { Difficulty } from '../types/difficulty.js';
import type { Artwork } from '../types/artwork.js';
import type { Stroke } from '../types/stroke.js';
import type { ScoreBreakdown } from '../types/score.js';

export type PracticeState = {
	difficulty: Difficulty | null;
	artwork: Artwork | null;
	strokes: Stroke[];
	score?: ScoreBreakdown;
};

function createPracticeStore() {
	const { subscribe, set, update } = writable<PracticeState>({
		difficulty: null,
		artwork: null,
		strokes: []
	});

	return {
		subscribe,
		setDifficulty: (difficulty: Difficulty) => update((s) => ({ ...s, difficulty })),
		setArtwork: (artwork: Artwork) => update((s) => ({ ...s, artwork })),
		setStrokes: (strokes: Stroke[]) => update((s) => ({ ...s, strokes })),
		setScore: (score: ScoreBreakdown) => update((s) => ({ ...s, score })),
		reset: () => set({ difficulty: null, artwork: null, strokes: [] })
	};
}

export const practiceStore = createPracticeStore();
