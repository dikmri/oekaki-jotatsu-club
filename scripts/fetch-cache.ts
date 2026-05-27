/**
 * ビルド時にサーバーサイドで美術館APIから作品を取得してキャッシュJSONを生成する。
 * CORSなし・レート制限を避けるために逐次実行。
 * 生成先: static/data/artworks-cache.json
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'static', 'data', 'artworks-cache.json');

interface Artwork {
	id: string;
	provider: string;
	providerObjectId: string;
	title: string;
	artist: string;
	year?: string;
	imageUrl: string;
	sourceUrl?: string;
	license: string;
	medium?: string;
	classification?: string;
	tags: string[];
}

const TARGET_ARTISTS = [
	{ query: 'Egon Schiele',      metQuery: 'Egon Schiele',      patterns: ['egon schiele', 'schiele, egon'] },
	// Caravaggio の本名が Michelangelo Merisi のため buonarroti でのみ絞り込む
	{ query: 'Michelangelo',      metQuery: 'Michelangelo',      patterns: ['buonarroti', 'michelangelo buonarroti'] },
	{ query: 'Raphael',           metQuery: 'Raphael',           patterns: ['raphael', 'raffaello', 'sanzio'] },
	// ü を ASCII に変換して WAF 回避
	{ query: 'Albrecht Dürer',    metQuery: 'Albrecht Durer',    patterns: ['dürer', 'durer'] },
	{ query: 'Leonardo da Vinci', metQuery: 'Leonardo da Vinci', patterns: ['leonardo da vinci', 'da vinci, leonardo'] },
] as const;

const DRAWING_KEYWORDS = ['drawing', 'drawings', 'sketch', 'study', 'paper', 'pencil', 'ink', 'chalk', 'charcoal', 'watercolor', 'gouache', 'croquis'];

// 油彩・キャンバスを明示的に除外するキーワード（Schiele描画フィルタで使用）
const OIL_PAINT_MATERIALS = ['oil paint', 'canvas', 'linen', 'tempera', 'fresco'];

function isDrawingLike(text: string): boolean {
	const lower = text.toLowerCase();
	return DRAWING_KEYWORDS.some((kw) => lower.includes(kw));
}

function isTargetArtist(artist: string): boolean {
	const lower = artist.toLowerCase();
	return TARGET_ARTISTS.some(({ patterns }) => patterns.some((p) => lower.includes(p)));
}

async function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

// ─── Met Museum ───────────────────────────────────────────────────────────────

async function fetchMet(query: string, metQuery: string): Promise<Artwork[]> {
	const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(metQuery)}&hasImages=true`;
	const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; OekakiJotatsuClub/1.0; build-cache-script)' };
	let searchResult: { objectIDs?: number[] };
	try {
		const res = await fetch(url, { headers: HEADERS });
		if (!res.ok) { console.warn(`  Met search HTTP ${res.status} for "${query}"`); return []; }
		searchResult = await res.json();
	} catch (e) {
		console.warn(`  Met search failed for "${query}":`, e);
		return [];
	}

	const ids = (searchResult.objectIDs ?? []).slice(0, 60);
	const artworks: Artwork[] = [];

	for (const id of ids) {
		try {
			const item = await fetch(
				`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
				{ headers: HEADERS }
			).then((r) => r.json());

			if (!item.isPublicDomain) continue;
			if (!item.primaryImageSmall && !item.primaryImage) continue;

			const mediumText = [item.objectName, item.classification, item.medium, item.title].join(' ');
			if (!isDrawingLike(mediumText)) continue;
			if (!isTargetArtist(String(item.artistDisplayName ?? ''))) continue;

			artworks.push({
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
				tags: ['public-domain'],
			});

			await sleep(50);
		} catch {
			// 個別取得失敗はスキップ
		}
	}

	return artworks;
}

// ─── Art Institute of Chicago ─────────────────────────────────────────────────

async function fetchArtic(query: string): Promise<Artwork[]> {
	const params = new URLSearchParams({
		q: query,
		limit: '50',
		fields: 'id,title,artist_title,date_display,image_id,is_public_domain,medium_display,classification_title',
	});
	try {
		const result = await fetch(`https://api.artic.edu/api/v1/artworks/search?${params}`).then((r) =>
			r.json()
		);

		return (result.data ?? [])
			.filter((item: Record<string, unknown>) => item.is_public_domain && item.image_id)
			.filter((item: Record<string, unknown>) =>
				isDrawingLike([item.medium_display, item.classification_title, item.title].join(' '))
			)
			.filter((item: Record<string, unknown>) => isTargetArtist(String(item.artist_title ?? '')))
			.slice(0, 20)
			.map((item: Record<string, unknown>) => ({
				id: `artic-${item.id}`,
				provider: 'artic',
				providerObjectId: String(item.id),
				title: String(item.title ?? '無題'),
				artist: String(item.artist_title ?? '不明'),
				year: item.date_display ? String(item.date_display) : undefined,
				imageUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
				sourceUrl: `https://www.artic.edu/artworks/${item.id}`,
				license: 'CC0',
				medium: item.medium_display ? String(item.medium_display) : undefined,
				classification: item.classification_title ? String(item.classification_title) : undefined,
				tags: ['public-domain'],
			}));
	} catch (e) {
		console.warn(`  ArtIC search failed for "${query}":`, e);
		return [];
	}
}

// ─── Wikidata / Wikimedia Commons（Schiele 専用）────────────────────────────

interface WikidataBinding {
	item: { value: string };
	label?: { value: string };
	image: { value: string };
	date?: { value: string };
	material?: { value: string };
}

async function fetchWikidataSchiele(targetCount = 60): Promise<Artwork[]> {
	// 油彩・キャンバス材料を除外してデッサン・水彩中心に取得
	const oilFilter = OIL_PAINT_MATERIALS.map((m) => `"${m}"`).join(', ');
	const sparql = `
SELECT DISTINCT ?item ?label ?image ?date WHERE {
  ?item wdt:P170 wd:Q44032 .
  ?item wdt:P18 ?image .
  OPTIONAL { ?item rdfs:label ?label FILTER(LANG(?label) = 'en') }
  OPTIONAL { ?item wdt:P571 ?date }
  FILTER NOT EXISTS {
    ?item wdt:P186 ?mat .
    ?mat rdfs:label ?matLabel FILTER(LANG(?matLabel) = 'en') .
    FILTER(?matLabel IN (${oilFilter}))
  }
} LIMIT 200`;

	let bindings: WikidataBinding[] = [];
	try {
		const res = await fetch(
			'https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql),
			{ headers: { Accept: 'application/json', 'User-Agent': 'OekakiJotatsuClub/1.0' } }
		);
		const data = await res.json();
		bindings = data.results?.bindings ?? [];
		console.log(`  Wikidata: ${bindings.length} candidates`);
	} catch (e) {
		console.warn('  Wikidata SPARQL failed:', e);
		return [];
	}

	// Special:FilePath URL から filename を取り出す
	const entries = bindings.map((b) => {
		const filePath = b.image?.value ?? '';
		const filename = decodeURIComponent(
			filePath.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '')
		);
		const itemId = b.item.value.replace('http://www.wikidata.org/entity/', '');
		return {
			filename,
			itemId,
			title: b.label?.value ?? filename.replace(/_/g, ' ').replace(/\.[^.]+$/, ''),
			year: b.date?.value?.slice(0, 4),
		};
	});

	// Wikimedia Commons API でサムネイル URL をバッチ取得（50件ずつ）
	const BATCH = 50;
	const artworks: Artwork[] = [];
	const seen = new Set<string>();

	for (let i = 0; i < entries.length && artworks.length < targetCount; i += BATCH) {
		const batch = entries.slice(i, i + BATCH);
		const titles = batch.map((e) => 'File:' + e.filename).join('|');

		try {
			const apiUrl =
				'https://commons.wikimedia.org/w/api.php?action=query' +
				'&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*' +
				'&titles=' + encodeURIComponent(titles);

			const res = await fetch(apiUrl, { headers: { 'User-Agent': 'OekakiJotatsuClub/1.0' } });
			const data = await res.json();
			const pages: Record<string, { title?: string; imageinfo?: Array<{ url: string; thumburl: string }> }> =
				data.query?.pages ?? {};

			for (const page of Object.values(pages)) {
				const thumburl = page.imageinfo?.[0]?.thumburl;
				const actualUrl = page.imageinfo?.[0]?.url;
				if (!thumburl && !actualUrl) continue;

				// page.title は "File:Egon Schiele - ..." 形式
				const pageFilename = (page.title ?? '').replace(/^File:/, '');
				const entry = batch.find((e) => e.filename === pageFilename);
				if (!entry) continue;
				if (seen.has(entry.itemId)) continue;
				seen.add(entry.itemId);

				artworks.push({
					id: `wikidata-${entry.itemId}`,
					provider: 'wikidata',
					providerObjectId: entry.itemId,
					title: entry.title,
					artist: 'Egon Schiele',
					year: entry.year,
					imageUrl: thumburl ?? actualUrl!,
					sourceUrl: `https://www.wikidata.org/wiki/${entry.itemId}`,
					license: 'CC0',
					tags: ['public-domain'],
				});
			}
		} catch (e) {
			console.warn(`  Wikimedia batch failed (offset ${i}):`, e);
		}

		await sleep(300);
	}

	return artworks;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const all: Artwork[] = [];
	const seen = new Set<string>();

	function addAll(artworks: Artwork[]) {
		for (const a of artworks) {
			if (!seen.has(a.id)) {
				seen.add(a.id);
				all.push(a);
			}
		}
	}

	// ── Egon Schiele: Wikidata + ArtIC で 50 件以上確保 ──
	console.log('\n[Wikidata] Egon Schiele');
	const schieleWikidata = await fetchWikidataSchiele(60);
	console.log(`  → ${schieleWikidata.length} artworks`);
	addAll(schieleWikidata);
	await sleep(500);

	console.log('[ArtIC] Egon Schiele');
	const schieleArtic = await fetchArtic('Egon Schiele');
	console.log(`  → ${schieleArtic.length} artworks`);
	addAll(schieleArtic);
	await sleep(300);

	// ── 残りの4名: Met + ArtIC ──
	const others = TARGET_ARTISTS.filter((a) => a.query !== 'Egon Schiele');
	for (const { query, metQuery } of others) {
		console.log(`\n[Met] ${query}`);
		const metResults = await fetchMet(query, metQuery);
		console.log(`  → ${metResults.length} artworks`);
		addAll(metResults);
		await sleep(500);

		console.log(`[ArtIC] ${query}`);
		const articResults = await fetchArtic(query);
		console.log(`  → ${articResults.length} artworks`);
		addAll(articResults);
		await sleep(300);
	}

	console.log(`\n合計: ${all.length} 作品をキャッシュに書き込みます`);
	// アーティスト別内訳
	const byArtist: Record<string, number> = {};
	for (const a of all) {
		byArtist[a.artist] = (byArtist[a.artist] ?? 0) + 1;
	}
	for (const [artist, count] of Object.entries(byArtist).sort((a, b) => b[1] - a[1])) {
		console.log(`  ${artist}: ${count}`);
	}

	mkdirSync(dirname(OUT_PATH), { recursive: true });
	writeFileSync(OUT_PATH, JSON.stringify(all, null, 2), 'utf-8');
	console.log(`\n完了: ${OUT_PATH}`);
}

main().catch((e) => {
	console.error('キャッシュ生成失敗:', e);
	process.exit(1);
});
