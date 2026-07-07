export type ObservableSubscription = () => void;

export class Observable<T> {
  private currentValue: T;

  private subscribers = new Set<(value: T) => void>();

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  get value() {
    return this.currentValue;
  }

  set value(nextValue: T) {
    this.currentValue = nextValue;
    for (const subscriber of this.subscribers) {
      subscriber(this.currentValue);
    }
  }

  subscribe(subscriber: (value: T) => void): ObservableSubscription {
    this.subscribers.add(subscriber);
    subscriber(this.currentValue);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  clear() {
    this.subscribers.clear();
  }
}