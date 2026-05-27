import type { Artwork, ArtworkSearchParams } from '../types/artwork.js';
import { searchMetArtworks } from './met.js';
import { searchArticArtworks } from './artic.js';
import { searchClevelandArtworks } from './cleveland.js';

const DEFAULT_QUERIES = [
	'Egon Schiele',
	'Rembrandt drawing',
	'Leonardo da Vinci sketch',
	'Michelangelo study',
	'Dürer drawing'
];

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

async function loadCachedArtworks(): Promise<Artwork[]> {
	try {
		const base = import.meta.env.BASE_URL ?? '';
		const res = await fetch(`${base}/data/artworks-cache.json`);
		if (!res.ok) return [];
		return await res.json();
	} catch {
		return [];
	}
}

export async function searchArtworks(params: ArtworkSearchParams): Promise<Artwork[]> {
	const query = params.artist ?? DEFAULT_QUERIES[Math.floor(Math.random() * DEFAULT_QUERIES.length)];
	const limit = params.limit ?? 20;

	const providers = params.provider
		? [params.provider]
		: ['met', 'artic', 'cleveland'] as const;

	const results = await Promise.allSettled(
		providers.map((p) => {
			if (p === 'met') return searchMetArtworks(query, limit);
			if (p === 'artic') return searchArticArtworks(query, limit);
			if (p === 'cleveland') return searchClevelandArtworks(query, limit);
			return Promise.resolve([]);
		})
	);

	let artworks: Artwork[] = results.flatMap((r) =>
		r.status === 'fulfilled' ? r.value : []
	);

	if (artworks.length === 0) {
		console.warn('API取得失敗: キャッシュから読み込みます');
		artworks = await loadCachedArtworks();
	}

	artworks = artworks.filter((a) => !a.isHidden && a.imageUrl);

	return shuffle(artworks).slice(0, limit);
}

export async function getRandomArtwork(params: ArtworkSearchParams): Promise<Artwork | null> {
	const artworks = await searchArtworks(params);
	return artworks[0] ?? null;
}
