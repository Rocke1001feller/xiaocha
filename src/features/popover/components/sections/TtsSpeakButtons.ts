import type { ExplainTaskState } from '../../../../../src/llm/types';
import type { TaskId } from '../../../../shared/task-ids';
import type { PopoverViewModel } from '../../viewmodels/PopoverViewModel';

export type SpeakLang = 'zh' | 'en';

export type SpeakRequest = {
  ownerId: string;
  text: string;
  lang: SpeakLang;
};

export type SpeakPlaybackState = {
  status: 'idle' | 'loading' | 'playing';
  ownerId: string | null;
};

/* 由 PopoverFeature 注入的朗读门面，屏蔽 createTtsService() 的创建时机 */
export type SpeakControl = {
  speak: (request: SpeakRequest) => void;
  stop: () => void;
  subscribe: (listener: (state: SpeakPlaybackState) => void) => () => void;
};

const CJK_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/;

export function isLikelyChinese(text: string): boolean {
  return CJK_PATTERN.test(text);
}

const SPEAK_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none">' +
  '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>' +
  '<path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
  '</svg>';

export function createSpeakButton(ownerId: string, ariaLabel: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tts-speak-btn';
  button.dataset.speakOwner = ownerId;
  button.setAttribute('aria-label', ariaLabel);
  button.innerHTML = SPEAK_ICON;
  return button;
}

/* loading 或无内容时禁用朗读 */
export function updateTaskSpeakButton(button: HTMLButtonElement, state: ExplainTaskState) {
  button.disabled = state.status === 'loading' || !state.content.trim();
}

/* 订阅播放态：命中的按钮加 is-speaking，其余按钮恢复 */
export function applySpeakState(root: ParentNode, state: SpeakPlaybackState) {
  const activeOwnerId = state.status === 'idle' ? null : state.ownerId;
  root.querySelectorAll<HTMLButtonElement>('.tts-speak-btn').forEach((button) => {
    button.classList.toggle('is-speaking', activeOwnerId != null && button.dataset.speakOwner === activeOwnerId);
  });
}

/* 事件委托绑定全部喇叭按钮：点击切换 speak/stop，dispose 时退订并停止 */
export function bindPopoverSpeak(options: {
  root: ParentNode;
  viewModel: PopoverViewModel;
  control: SpeakControl;
}): { dispose: () => void } {
  const { root, viewModel, control } = options;
  let lastState: SpeakPlaybackState = { status: 'idle', ownerId: null };

  const unsubscribe = control.subscribe((state) => {
    lastState = state;
    applySpeakState(root, state);
  });

  const onClick = (event: Event) => {
    const button = (event.target as Element | null)?.closest?.('.tts-speak-btn') as HTMLButtonElement | null;
    if (!button || button.disabled) {
      return;
    }

    const ownerId = button.dataset.speakOwner;
    if (!ownerId) {
      return;
    }

    if (lastState.status !== 'idle' && lastState.ownerId === ownerId) {
      control.stop();
      return;
    }

    const request = resolveSpeakRequest(viewModel, ownerId);
    if (request) {
      control.speak(request);
    }
  };

  root.addEventListener('click', onClick);

  return {
    dispose: () => {
      root.removeEventListener('click', onClick);
      unsubscribe();
      control.stop();
    },
  };
}

function resolveSpeakRequest(viewModel: PopoverViewModel, ownerId: string): SpeakRequest | null {
  if (ownerId === 'selection') {
    const text = viewModel.selection.value?.text ?? '';
    return text ? { ownerId, text, lang: isLikelyChinese(text) ? 'zh' : 'en' } : null;
  }

  if (ownerId === 'translation' || ownerId === 'contextual') {
    const lexical = viewModel.lexicalState.value.lexical;
    const text = (ownerId === 'translation' ? lexical?.translation : lexical?.contextualAnalysis) ?? '';
    if (!text.trim()) {
      return null;
    }
    return { ownerId, text, lang: ownerId === 'translation' ? 'zh' : isLikelyChinese(text) ? 'zh' : 'en' };
  }

  if (ownerId.startsWith('task:')) {
    const text = viewModel.getTaskState(ownerId.slice('task:'.length) as TaskId).content;
    return text.trim() ? { ownerId, text, lang: isLikelyChinese(text) ? 'zh' : 'en' } : null;
  }

  return null;
}
