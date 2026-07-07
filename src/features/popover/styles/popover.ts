import { POPOVER_STYLE_SLICE_FILES } from './popover.generated';

export { POPOVER_STYLE_SLICE_FILES, POPOVER_STYLE_THEME_SLICE_FILES, POPOVER_STYLES_SOURCE_ORDER_FILE } from './popover.generated';

const sourceModules = import.meta.glob('./popover/**/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const popoverStyles = POPOVER_STYLE_SLICE_FILES
  .map((relativePath) => {
    const moduleKey = `./popover/${relativePath}`;
    const content = sourceModules[moduleKey];
    if (typeof content !== 'string') {
      throw new Error(`Missing popover style slice: ${moduleKey}`);
    }
    return content;
  })
  .join('\n');

export default popoverStyles;