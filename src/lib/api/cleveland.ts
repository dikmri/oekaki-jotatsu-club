import type { Artwork } from '../types/artwork.js';

const DRAWING_KEYWORDS = ['drawing', 'sketch', 'study', 'paper', 'pencil', 'ink', 'chalk', 'charcoal', 'watercolor'];

interface ClevelandImage {
	url?: string;
	width?: number;
	height?: number;
}

interface ClevelandItem {
	id: number;
	title?: string;
	creators?: Array<{ description?: string }>;
	creation_date?: string;
	images?: { web?: ClevelandImage };
	type?: string;
	technique?: string;
	url?: string;
}

function isDrawingLike(item: ClevelandItem): boolean {
	const text = [item.type, item.technique, item.title].join(' ').toLowerCase();
	return DRAWING_KEYWORDS.some((kw) => text.includes(kw));
}

function normalize(item: ClevelandItem): Artwork {
	return {
		id: `cleveland-${item.id}`,
		provider: 'cleveland',
		providerObjectId: String(item.id),
		title: item.title ?? '無題',
		artist: item.creators?.[0]?.description ?? '不明',
		year: item.creation_date,
		imageUrl: item.images?.web?.url ?? '',
		sourceUrl: item.url,
		license: 'CC0',
		medium: item.technique,
		classification: item.type,
		tags: ['public-domain', 'safe-for-general']
	};
}

export async function searchClevelandArtworks(query: string, limit = 20): Promise<Artwork[]> {
	const url = new URL('https://openaccess-api.clevelandart.org/api/artworks/');
	url.searchParams.set('q', query);
	url.searchParams.set('has_image', '1');
	url.searchParams.set('cc0', '1');
	url.searchParams.set('limit', '50');

	const result = await fetch(url.toString()).then((r) => r.json());

	return (result.data ?? [])
		.filter((item: ClevelandItem) => item.images?.web?.url)
		.filter(isDrawingLike)
		.slice(0, limit)
		.map(normalize);
}
