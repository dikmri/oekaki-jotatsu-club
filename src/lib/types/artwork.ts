import type { Difficulty } from './difficulty.js';

export type ArtworkProvider = 'met' | 'artic' | 'cleveland' | 'rijksmuseum' | 'wikidata';

export type ArtworkTag =
	| 'portrait'
	| 'figure'
	| 'hand'
	| 'foot'
	| 'anatomy'
	| 'gesture'
	| 'drapery'
	| 'animal'
	| 'landscape'
	| 'line-drawing'
	| 'sketch'
	| 'study'
	| 'public-domain'
	| 'safe-for-general';

export type Artwork = {
	id: string;
	provider: ArtworkProvider;
	providerObjectId: string;
	title: string;
	artist: string;
	year?: string;
	imageUrl: string;
	sourceUrl?: string;
	license: string;
	medium?: string;
	classification?: string;
	difficultyHint?: Difficulty[];
	tags: string[];
	isHidden?: boolean;
	isReviewed?: boolean;
	reviewNote?: string;
};

export type ArtworkSearchParams = {
	difficulty: Difficulty;
	artist?: string;
	provider?: ArtworkProvider;
	tags?: ArtworkTag[];
	limit?: number;
};
