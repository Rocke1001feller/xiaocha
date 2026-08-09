#!/usr/bin/env node
// Resolve a Chrome extension ID the same way Chromium does:
// https://source.chromium.org/chromium/chromium/src/+/main:components/crx_file/id_util.cc
// - With manifest "key": SHA-256 of the decoded public key, first 16 bytes.
// - Without "key" (unpacked dev builds): SHA-256 of the extension directory
//   path, first 16 bytes.
// Either way the digest is hex-encoded and each hex digit '0'-'f' is mapped to
// 'a'-'p', producing the familiar 32-character extension ID.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ID_ALPHABET = 'abcdefghijklmnop';

function idFromSha256Hex(hexDigest) {
	return [...hexDigest.slice(0, 32)].map((hexDigit) => ID_ALPHABET[Number.parseInt(hexDigit, 16)]).join('');
}

export function computePathExtensionId(extensionDirPath) {
	const hexDigest = createHash('sha256').update(extensionDirPath).digest('hex');
	return idFromSha256Hex(hexDigest);
}

export function computeKeyExtensionId(publicKeyPem) {
	const derBase64 = publicKeyPem
		.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '')
		.replace(/\s+/g, '');
	const hexDigest = createHash('sha256').update(Buffer.from(derBase64, 'base64')).digest('hex');
	return idFromSha256Hex(hexDigest);
}

export function resolveExtensionId(manifestPath) {
	const resolvedManifestPath = path.resolve(manifestPath);
	if (existsSync(resolvedManifestPath)) {
		const manifest = JSON.parse(readFileSync(resolvedManifestPath, 'utf8'));
		if (typeof manifest.key === 'string' && manifest.key.trim()) {
			return computeKeyExtensionId(manifest.key);
		}
	}
	// Unpacked development builds derive the ID from the directory path. This
	// also covers the window before the first build has written the manifest.
	return computePathExtensionId(path.dirname(resolvedManifestPath));
}

// CLI: node scripts/extension-id.mjs <manifest.json path>
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const manifestPath = process.argv[2];
	if (!manifestPath) {
		console.error('Usage: node scripts/extension-id.mjs <manifest.json path>');
		process.exit(1);
	}
	console.log(resolveExtensionId(manifestPath));
}
