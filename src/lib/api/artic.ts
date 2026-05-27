import type { Artwork } from '../types/artwork.js';

const DRAWING_KEYWORDS = ['drawing', 'sketch', 'study', 'paper', 'pencil', 'ink', 'chalk', 'charcoal', 'watercolor'];

function isDrawingLike(item: Record<string, unknown>): boolean {
	const text = [item.medium_display, item.classification_title, item.title]
		.join(' ')
		.toLowerCase();
	return DRAWING_KEYWORDS.some((kw) => text.includes(kw));
}

function buildImageUrl(imageId: string): string {
	return `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`;
}

function normalize(item: Record<string, unknown>): Artwork {
	return {
		id: `artic-${item.id}`,
		provider: 'artic',
		providerObjectId: String(item.id),
		title: String(item.title ?? '無題'),
		artist: String(item.artist_title ?? '不明'),
		year: item.date_display ? String(item.date_display) : undefined,
		imageUrl: buildImageUrl(String(item.image_id)),
		sourceUrl: `https://www.artic.edu/artworks/${item.id}`,
		license: 'CC0',
		medium: item.medium_display ? String(item.medium_display) : undefined,
		classification: item.classification_title ? String(item.classification_title) : undefined,
		tags: ['public-domain', 'safe-for-general']
	};
}

export async function searchArticArtworks(query: string, limit = 20): Promise<Artwork[]> {
	const url = new URL('https://api.artic.edu/api/v1/artworks/search');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', '50');
	url.searchParams.set(
		'fields',
		['id', 'title', 'artist_title', 'date_display', 'image_id', 'is_public_domain', 'medium_display', 'classification_title'].join(',')
	);

	const result = await fetch(url.toString()).then((r) => r.json());

	return (result.data ?? [])
		.filter((item: Record<string, unknown>) => item.is_public_domain)
		.filter((item: Record<string, unknown>) => item.image_id)
		.filter(isDrawingLike)
		.slice(0, limit)
		.map(normalize);
}
