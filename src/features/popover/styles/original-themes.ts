import { ORIGINAL_THEME_SLICE_FILES } from './original-themes.generated';

export { ORIGINAL_THEME_SLICE_FILES } from './original-themes.generated';

const sourceModules = import.meta.glob('./original-themes/**/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const originalThemes = ORIGINAL_THEME_SLICE_FILES
  .map((relativePath) => {
    const moduleKey = `./original-themes/${relativePath}`;
    const content = sourceModules[moduleKey];
    if (typeof content !== 'string') {
      throw new Error(`Missing original theme slice: ${moduleKey}`);
    }
    return content;
  })
  .join('');

export default originalThemes;