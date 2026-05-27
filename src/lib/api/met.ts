import type { Artwork } from '../types/artwork.js';

const DRAWING_KEYWORDS = ['drawing', 'drawings', 'sketch', 'study', 'paper', 'pencil', 'ink', 'chalk', 'charcoal', 'watercolor', 'gouache'];

function isDrawingLike(item: Record<string, unknown>): boolean {
	const text = [item.objectName, item.classification, item.medium, item.title]
		.join(' ')
		.toLowerCase();
	return DRAWING_KEYWORDS.some((kw) => text.includes(kw));
}

function normalize(item: Record<string, unknown>): Artwork {
	return {
		id: `met-${item.objectID}`,
		provider: 'met',
		providerObjectId: String(item.objectID),
		title: String(item.title ?? '無題'),
		artist: String(item.artistDisplayName ?? '不明'),
		year: item.objectDate ? String(item.objectDate) : undefined,
		imageUrl: String(item.primaryImageSmall || item.primaryImage),
		sourceUrl: String(item.objectURL ?? ''),
		license: 'CC0',
		medium: item.medium ? String(item.medium) : undefined,
		classification: item.classification ? String(item.classification) : undefined,
		tags: ['public-domain', 'safe-for-general']
	};
}

export async function searchMetArtworks(query: string, limit = 20): Promise<Artwork[]> {
	const searchUrl = new URL('https://collectionapi.metmuseum.org/public/collection/v1/search');
	searchUrl.searchParams.set('q', query);
	searchUrl.searchParams.set('hasImages', 'true');
	searchUrl.searchParams.set('artistOrCulture', 'true');

	const searchResult = await fetch(searchUrl.toString()).then((r) => r.json());
	const objectIds: number[] = (searchResult.objectIDs ?? []).slice(0, 40);

	const details = await Promise.all(
		objectIds.map((id) =>
			fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
				.then((r) => r.json())
				.catch(() => null)
		)
	);

	return details
		.filter(Boolean)
		.filter((item) => item.isPublicDomain)
		.filter((item) => item.primaryImageSmall || item.primaryImage)
		.filter(isDrawingLike)
		.slice(0, limit)
		.map(normalize);
}
