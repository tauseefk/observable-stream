/**
 * Toy observable streams.
 * Built using some code examples by @jvanbruegge's post,
 * https://dev.to/supermanitu/understanding-observables
 *
 */
'use strict'
class Observable {
  constructor(subscribe) {
    this.subscribe = subscribe
  }

  subscribe() { }

  unsubscribe() { }
}

/**
 * @extends Observable
 * @param {function} subscribe
 */
export default class Stream extends Observable {
  constructor(subscribe) {
    super(subscribe)
  }

  compose(operator) {
    return operator(this)
  }

  map(fn) {
    return this.compose(map(fn))
  }

  filter(fn) {
    return this.compose(filter(fn))
  }

  debounceTime(ms) {
    return this.compose(debounceTime(ms))
  }

  /**
   *
   * @param {string} type
   * @param {EventTarget} target
   *
   * @returns {Stream} that is subscribed to the event
   */
  static fromEvent(type, target) {
    const _streamFromEvent = new Stream(observer => {
      target.addEventListener(type, observer.next)
      _streamFromEvent.unsubscribe = () => target.removeEventListener(type, observer.next)
    })

    return _streamFromEvent
  }
}

/**
 * @param {function} fn: a function that takes an observable
 * @returns {Observable} with observer mapped to fn
 */
const map = fn => stream => new Stream(observer => {
  stream.subscribe({
    next: data => observer.next(fn(data)),
    complete: observer.complete
  })
})

const noOp = () => { }

/**
 * @param {function} fn: a function that takes an observable
 * @returns {Observable} with filtered observer
 */
const filter = fn => stream => new Stream(observer => {
  stream.subscribe({
    next: data => fn(data) ? observer.next(data) : noOp(),
    complete: observer.complete
  })
})

const debounceTime = (ms) => {
  let _timer = null
  return (stream) => new Stream(observer => {
    stream.subscribe({
      next: data => {
        if (_timer) {
          clearTimeout(_timer)
          _timer = null
        }
        _timer = setTimeout(() => observer.next(data), ms)
      },
      complete: data => {
        cancelTimeout(_timer)
        observer.complete(data)
      }
    })
  })
}
