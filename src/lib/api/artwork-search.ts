import type { Artwork, ArtworkSearchParams } from '../types/artwork.js';
import { searchMetArtworks } from './met.js';
import { searchArticArtworks } from './artic.js';
import { searchClevelandArtworks } from './cleveland.js';

const TARGET_ARTISTS = [
	{ query: 'Egon Schiele',        patterns: ['schiele'] },
	{ query: 'Michelangelo',        patterns: ['michelangelo', 'buonarroti'] },
	{ query: 'Raphael drawing',     patterns: ['raphael', 'raffaello', 'sanzio'] },
	{ query: 'Albrecht Dürer',      patterns: ['dürer', 'durer', 'albrecht'] },
	{ query: 'Leonardo da Vinci',   patterns: ['leonardo', 'da vinci', 'vinci'] },
] as const;

function isTargetArtist(artist: string): boolean {
	const lower = artist.toLowerCase();
	return TARGET_ARTISTS.some(({ patterns }) => patterns.some((p) => lower.includes(p)));
}

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
		const all: Artwork[] = await res.json();
		return all.filter((a) => isTargetArtist(a.artist));
	} catch {
		return [];
	}
}

export async function searchArtworks(params: ArtworkSearchParams): Promise<Artwork[]> {
	const limit = params.limit ?? 20;

	// 5名全員を並列検索して結果を統合する（per-queryは少量に絞り過負荷防止）
	const PER_QUERY_LIMIT = 8;
	const providers = params.provider
		? [params.provider]
		: ['met', 'artic', 'cleveland'] as const;

	const allQueries = TARGET_ARTISTS.map(({ query }) => query);

	const results = await Promise.allSettled(
		allQueries.flatMap((query) =>
			providers.map((p) => {
				if (p === 'met') return searchMetArtworks(query, PER_QUERY_LIMIT);
				if (p === 'artic') return searchArticArtworks(query, PER_QUERY_LIMIT);
				if (p === 'cleveland') return searchClevelandArtworks(query, PER_QUERY_LIMIT);
				return Promise.resolve([]);
			})
		)
	);

	let artworks: Artwork[] = results.flatMap((r) =>
		r.status === 'fulfilled' ? r.value : []
	);

	if (artworks.length === 0) {
		console.warn('API取得失敗: キャッシュから読み込みます');
		artworks = await loadCachedArtworks();
	}

	// 重複除去 + 対象作家フィルター
	const seen = new Set<string>();
	artworks = artworks.filter((a) => {
		if (!a.imageUrl || a.isHidden) return false;
		if (!isTargetArtist(a.artist)) return false;
		if (seen.has(a.id)) return false;
		seen.add(a.id);
		return true;
	});

	return shuffle(artworks).slice(0, limit);
}

export async function getRandomArtwork(params: ArtworkSearchParams): Promise<Artwork | null> {
	const artworks = await searchArtworks(params);
	return artworks[0] ?? null;
}
