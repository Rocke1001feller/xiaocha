function attachWheelAdapter() {
  const wrapper = document.querySelector('.cards-wrapper');
  if (!wrapper) {
    return;
  }

  wrapper.addEventListener(
    'wheel',
    (event) => {
      const wheelEvent = event as WheelEvent;
      if (Math.abs(wheelEvent.deltaY) <= Math.abs(wheelEvent.deltaX)) {
        return;
      }
      wheelEvent.preventDefault();
      wrapper.scrollLeft += wheelEvent.deltaY;
    },
    { passive: false },
  );
}

function attachNavFeedback() {
  const items = document.querySelectorAll('.nav-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      items.forEach((other) => other.classList.remove('is-active'));
      item.classList.add('is-active');
    });
  });
}

function attachNavigation() {
  const viewAll = document.querySelector<HTMLAnchorElement>('#recent-all');
  viewAll?.addEventListener('click', (event) => {
    event.preventDefault();
    browser.tabs.create({ url: browser.runtime.getURL('/library-cards.html') });
  });

  const settings = document.querySelector<HTMLElement>('#nav-settings');
  settings?.addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('/options.html') });
  });
}

attachWheelAdapter();
attachNavFeedback();
attachNavigation();
