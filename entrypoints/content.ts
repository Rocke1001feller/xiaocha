import { PopoverFeature } from '../src/features/popover/PopoverFeature';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main(ctx) {
    new PopoverFeature().start(ctx);
  },
});
