import chokidar from 'chokidar';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import Reloader from 'advanced-extension-reloader-watch-2/es/reloader.js';
import { resolveExtensionId } from './extension-id.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, 'dist/chrome-mv3/manifest.json');
const extensionId = resolveExtensionId(manifestPath);
const watchTargets = [
	'assets/**/*',
	'entrypoints/**/*',
	'public/**/*',
	'tsconfig.json',
	'wxt.config.ts',
];

process.chdir(projectRoot);

console.log(`[dev-dist] resolved extension id: ${extensionId}`);

const reloader = new Reloader({ port: 6220, watch_dir: 'dist/chrome-mv3' });
reloader.watch();

let activeBuild = null;
let pendingReason = null;
let scheduleTimer = null;
let hasStarted = false;

const runBuild = (reason) => {
	if (activeBuild) {
		pendingReason = reason;
		return;
	}

	console.log(`[dev-dist] build start (${reason})`);
	activeBuild = spawn('pnpm', ['build'], {
		cwd: projectRoot,
		stdio: 'inherit',
	});

	activeBuild.on('exit', (code) => {
		activeBuild = null;

		if (code === 0) {
			reloader.reload({
				extension_id: extensionId,
				play_notifications: true,
				always_open_popup: true,
				always_open_popup_paths: ['popup'],
				manifest_path: manifestPath,
			});
			console.log('[dev-dist] reload signal sent');
		} else {
			reloader.play_error_notification({ extension_id: extensionId });
			console.error(`[dev-dist] build failed with exit code ${code ?? 'unknown'}`);
		}

		if (pendingReason) {
			const queuedReason = pendingReason;
			pendingReason = null;
			runBuild(`${queuedReason} (queued)`);
		}
	});
};

const scheduleBuild = (reason) => {
	if (scheduleTimer) {
		clearTimeout(scheduleTimer);
	}

	scheduleTimer = setTimeout(() => {
		scheduleTimer = null;
		runBuild(reason);
	}, 150);
};

const watcher = chokidar.watch(watchTargets, {
	cwd: projectRoot,
	ignoreInitial: true,
});

watcher.on('all', (eventName, changedPath) => {
	const relativePath = changedPath.split(path.sep).join('/');
	console.log(`[dev-dist] ${eventName}:${relativePath}`);
	scheduleBuild(`${eventName}:${relativePath}`);
});

watcher.on('ready', () => {
	if (hasStarted) {
		return;
	}

	hasStarted = true;
	console.log('[dev-dist] watching for production-aligned rebuilds');
	runBuild('initial');
});

const shutdown = async (signal) => {
	if (scheduleTimer) {
		clearTimeout(scheduleTimer);
	}

	await watcher.close();

	if (activeBuild) {
		activeBuild.kill(signal);
	}

	process.exit(0);
};

process.on('SIGINT', () => {
	void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
	void shutdown('SIGTERM');
});
