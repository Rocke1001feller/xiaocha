import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const iconDir = path.join(repoRoot, 'public', 'icon');
const sourceDir = path.join(repoRoot, 'scripts', 'icon-source');
const sourcePng = path.join(sourceDir, 'icon-128.png');
const hasSips = spawnSync('sh', ['-lc', 'command -v sips'], { stdio: 'ignore' }).status === 0;

if (!existsSync(sourcePng)) {
	throw new Error(`Missing icon source PNG: ${sourcePng}`);
}

function ensureExistingOutput(outPath, label) {
	if (!existsSync(outPath)) {
		throw new Error(`Missing ${label}: ${outPath}. Provide source icons or install 'sips'.`);
	}
	console.log(`reuse existing ${label}`);
}

function copyExact(sourceName, targetName, label) {
	const source = path.join(sourceDir, sourceName);
	const target = path.join(iconDir, targetName);
	if (!existsSync(source)) {
		throw new Error(`Missing ${label} source: ${source}`);
	}
	copyFileSync(source, target);
	console.log(`${sourceName} -> public/icon/${targetName}`);
}

function scaleOrReuse(size, outName, label) {
	const outPath = path.join(iconDir, outName);
	if (hasSips) {
		execFileSync(
			'sips',
			['-s', 'format', 'png', '-z', String(size), String(size), sourcePng, '--out', outPath],
			{ stdio: 'ignore' },
		);
		console.log(`${label} ${size}x${size} -> public/icon/${outName}`);
	} else {
		ensureExistingOutput(outPath, `${label} ${size}x${size} asset`);
	}
}

// Exact sizes inherited from the original chrome-extension package.
copyExact('icon-16.png', '16.png', 'toolbar 16x16');
copyExact('icon-32.png', '32.png', 'toolbar 32x32');
copyExact('icon-48.png', '48.png', 'toolbar 48x48');
copyExact('icon-128.png', '128.png', 'toolbar 128x128');

// Additional sizes derived from the 128 px source.
scaleOrReuse(96, '96.png', 'toolbar');

// Display icons for in-app surfaces (options, popup, full-page tabs).
scaleOrReuse(48, 'display-48.png', 'display');
scaleOrReuse(96, 'display-96.png', 'display');

// Website favicon derived from the same source.
const websiteFaviconPath = path.join(repoRoot, 'website', 'public', 'icon.png');
if (hasSips) {
	execFileSync(
		'sips',
		['-s', 'format', 'png', '-z', '512', '512', sourcePng, '--out', websiteFaviconPath],
		{ stdio: 'ignore' },
	);
	console.log('display 512x512 -> website/public/icon.png');
} else {
	ensureExistingOutput(websiteFaviconPath, 'website favicon asset');
}
