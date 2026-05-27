import { writable, derived } from 'svelte/store';

export type Lang = 'ja' | 'en';

const messages = {
	ja: {
		appName: 'お絵かき上達クラブ',
		appNameEn: 'Drawing Practice Club',
		langSwitch: 'English',
		tagline: '世界の名画素描を見ながら模写して、\n線のズレをチェックしよう。',
		chooseDifficulty: '難易度を選んでください',
		startPractice: '練習を始める',
		footerNote: '作品画像は各美術館の Open Access・CC0 ポリシーに基づいて取得します。\n採点は AI ではなく画像処理による線の一致度判定です。',
		diffLabels: { beginner: '初心者', intermediate: '中級者', advanced: '上級者' } as Record<string, string>,
		diffDescs: {
			beginner: 'グリッドあり。線のズレ判定はやや甘め。',
			intermediate: 'デッサンスケールあり。比率と位置を意識。',
			advanced: '補助線なし。線の精度を厳しめに判定。'
		} as Record<string, string>,
		backTop: '← トップ',
		changeArtwork: '別の作品',
		loadingArtwork: '作品を取得中…',
		reference: 'お手本',
		drawingCanvas: '模写キャンバス',
		source: '出典',
		apiError: '美術館 API から作品を取得できませんでした。',
		pen: 'ペン',
		eraser: '消しゴム',
		size: '太さ',
		sizeHalf: '細 (0.5)',
		sizeFull: '太 (1)',
		undo: '↩ 元に戻す',
		redo: '↪ やり直す',
		clearAll: '全消去',
		submit: '採点する',
		results: '採点結果',
		scoring: '採点中…',
		drawAgain: 'もう一度描く',
		differentArtwork: '別の作品で描く',
		backToTop: 'トップに戻る',
		totalScore: '総合点',
		scorePoint: '点',
		shape: '形の一致度',
		position: '位置の一致度',
		proportion: '比率の一致度',
		extraLines: '余計な線の少なさ',
		mainLines: '主要ラインの再現度',
		scoreNotice: 'このスコアは、お手本との線の一致度を元にした練習用の目安です。\n絵の上手さや芸術性を評価するものではありません。',
		scoringError: '採点処理に失敗しました。もう一度お試しください。',
		retryBtn: 'もう一度試す',
		overlayReference: 'お手本',
		overlayUser: 'あなたの模写',
		overlayResult: '重ね合わせ結果',
		legendMatch: '一致',
		legendUser: 'ユーザー線',
		legendExtra: 'ズレ線',
		legendMissing: '描き漏れ',
	},
	en: {
		appName: 'Drawing Practice Club',
		appNameEn: 'お絵かき上達クラブ',
		langSwitch: '日本語',
		tagline: 'Trace masterwork drawings from world museums\nand check how well your lines match.',
		chooseDifficulty: 'Choose difficulty',
		startPractice: 'Start Practice',
		footerNote: 'Artwork images are sourced via Open Access / CC0 policies of each museum.\nScoring uses image processing (line matching), not AI.',
		diffLabels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as Record<string, string>,
		diffDescs: {
			beginner: 'Grid overlay. More lenient line matching.',
			intermediate: 'Drawing scale guides. Focus on proportions and position.',
			advanced: 'No guides. Strict line accuracy.'
		} as Record<string, string>,
		backTop: '← Top',
		changeArtwork: 'Change Artwork',
		loadingArtwork: 'Loading artwork…',
		reference: 'Reference',
		drawingCanvas: 'Drawing Canvas',
		source: 'Source',
		apiError: 'Could not fetch artwork from museum API.',
		pen: 'Pen',
		eraser: 'Eraser',
		size: 'Size',
		sizeHalf: 'Thin (0.5)',
		sizeFull: 'Thick (1)',
		undo: '↩ Undo',
		redo: '↪ Redo',
		clearAll: 'Clear All',
		submit: 'Submit',
		results: 'Results',
		scoring: 'Scoring…',
		drawAgain: 'Draw Again',
		differentArtwork: 'Different Artwork',
		backToTop: 'Back to Top',
		totalScore: 'Total Score',
		scorePoint: 'pts',
		shape: 'Shape Match',
		position: 'Position Match',
		proportion: 'Proportion Match',
		extraLines: 'Extra Lines (less = better)',
		mainLines: 'Main Lines Coverage',
		scoreNotice: 'This score is a practice guide based on how closely your lines match the reference.\nIt does not evaluate artistic skill or creativity.',
		scoringError: 'Scoring failed. Please try again.',
		retryBtn: 'Retry',
		overlayReference: 'Reference',
		overlayUser: 'Your Drawing',
		overlayResult: 'Overlay Result',
		legendMatch: 'Match',
		legendUser: 'Your Lines',
		legendExtra: 'Off Lines',
		legendMissing: 'Missing Lines',
	}
} as const;

export type Messages = typeof messages.ja;

function loadLang(): Lang {
	if (typeof localStorage === 'undefined') return 'ja';
	return (localStorage.getItem('ojc-lang') as Lang) ?? 'ja';
}

export const lang = writable<Lang>(loadLang());

lang.subscribe((l) => {
	if (typeof localStorage !== 'undefined') localStorage.setItem('ojc-lang', l);
});

export const t = derived(lang, ($lang) => messages[$lang]);

export function toggleLang() {
	lang.update((l) => (l === 'ja' ? 'en' : 'ja'));
}
