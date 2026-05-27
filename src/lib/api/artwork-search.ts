import type { Artwork, ArtworkSearchParams } from '../types/artwork.js';
import { searchMetArtworks } from './met.js';
import { searchArticArtworks } from './artic.js';

const TARGET_ARTISTS = [
	{ query: 'Egon Schiele',        patterns: ['egon schiele', 'schiele, egon'] },
	// Caravaggio の本名が Michelangelo Merisi のため buonarroti でのみ絞り込む
	{ query: 'Michelangelo',        patterns: ['buonarroti', 'michelangelo buonarroti'] },
	{ query: 'Raphael',             patterns: ['raphael', 'raffaello', 'sanzio'] },
	{ query: 'Albrecht Dürer',      patterns: ['dürer', 'durer'] },
	{ query: 'Leonardo da Vinci',   patterns: ['leonardo da vinci', 'da vinci, leonardo'] },
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

	// キャッシュが存在すれば優先して使用（CORSなし、高速）
	const cached = await loadCachedArtworks();
	if (cached.length > 0) {
		const filtered = cached.filter((a) => !a.isHidden && a.imageUrl);
		return shuffle(filtered).slice(0, limit);
	}

	// キャッシュがなければ Met/ArtIC にフォールバック（Cleveland は CORS 非対応のため除外）
	console.warn('キャッシュなし: ライブ API にフォールバックします');
	const PER_QUERY_LIMIT = 6;
	const providers = params.provider && params.provider !== 'cleveland'
		? [params.provider]
		: ['met', 'artic'] as const;

	const results = await Promise.allSettled(
		TARGET_ARTISTS.flatMap(({ query }) =>
			providers.map((p) => {
				if (p === 'met') return searchMetArtworks(query, PER_QUERY_LIMIT);
				if (p === 'artic') return searchArticArtworks(query, PER_QUERY_LIMIT);
				return Promise.resolve([]);
			})
		)
	);

	const seen = new Set<string>();
	let artworks: Artwork[] = results.flatMap((r) =>
		r.status === 'fulfilled' ? r.value : []
	).filter((a) => {
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
