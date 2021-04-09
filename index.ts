/**
 * Toy observable streams.
 * Built using some code examples by @jvanbruegge's post,
 * https://dev.to/supermanitu/understanding-observables
 *
 */
"use strict";

interface Observer<T> {
  next(t: T): void;
  complete(): void;
}

interface Observable<T> {
  subscribe: (observer: Observer<T>) => void;
  unsubscribe?: () => void;
}

/**
 * @extends Observable
 * @param {function} subscribe
 */
export default class Stream<T> implements Observable<T> {
  constructor(
    public subscribe: (o: Observer<T>) => void,
    public unsubscribe?: () => void
  ) {}

  public compose<U>(operator: (s: Stream<T>) => Stream<U>): Stream<U> {
    return operator(this);
  }

  public map<U>(fn: (t: T) => U): Stream<U> {
    return this.compose(_map(fn));
  }

  public filter(fn: (t: T) => boolean) {
    return this.compose(_filter(fn));
  }

  public debounceTime(ms: number) {
    return this.compose(debounceTime(ms));
  }

  /**
   *
   * @param {string} type
   * @param {EventTarget} target
   *
   * @returns {Stream} that is subscribed to the event
   */
  static fromEvent(type: string, target: HTMLElement): Stream<Event> {
    const _streamFromEvent = new Stream<Event>((observer) => {
      target.addEventListener(type, observer.next);
      _streamFromEvent.unsubscribe = () =>
        target.removeEventListener(type, observer.next);
    });

    return _streamFromEvent;
  }
}

/**
 * @param {function} fn: a function that takes an observable
 * @returns {Observable} with observer mapped to fn
 */
function _map<T, U>(fn: (t: T) => U): (s: Stream<T>) => Stream<U> {
  return (stream) =>
    new Stream((observer) => {
      stream.subscribe({
        next: (data) => observer.next(fn(data)),
        complete: observer.complete,
      });
    });
}

const noOp = () => {};

/**
 * @param {function} fn: a function that takes an observable
 * @returns {Observable} with filtered observer
 */
function _filter<T>(fn: (t: T) => boolean): (s: Stream<T>) => Stream<T> {
  return (stream) =>
    new Stream((observer) => {
      stream.subscribe({
        next: (data) => (fn(data) ? observer.next(data) : noOp()),
        complete: observer.complete,
      });
    });
}

function debounceTime<T>(ms: number): (s: Stream<T>) => Stream<T> {
  let _timer: number | null = null;
  return (stream) =>
    new Stream((observer) => {
      stream.subscribe({
        next: (data) => {
          if (_timer) {
            clearTimeout(_timer);
            _timer = null;
          }
          _timer = window.setTimeout(() => observer.next(data), ms);
        },
        complete: () => {
          if (_timer) window.clearTimeout(_timer);
          observer.complete();
        },
      });
    });
}
