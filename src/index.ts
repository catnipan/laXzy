type Lazy<T> = () => Iterator<T>;
type Strict<T> = Array<T>;

let indexArray: number[] = [1,2,3,4,5];

function lazy<T>(list: Strict<T>): Lazy<T> {
  return function() {
    return list[Symbol.iterator]();
  };
};

function range(
  start: number = 1,
  to: number = Infinity,
  gap: number = 1,
): Lazy<number> {
  return function* () {
    for (let i = start; i < to; i += gap) {
      yield i;
    }
  };
}

function replicate<T>(count: number, value: T): Lazy<T> {
  return function* () {
    for (let i = 0; i < count; i += 1) {
      yield value;
    }
  }
}

function repeat<T>(value: T): Lazy<T> {
  return function* () {
    while (true) {
      yield value;
    }
  }
}

// Solved True
// Solved False
// Pending
// function elem<T>(targetValue: T, lazyStreamer: Lazy<T>) {
//   return function* () {
//     const lazyStream = lazyStreamer();
//     while (true) {
//       const { value, done } = lazyStream.next();
//       if (done) {
//         return false;
//       }
//       if (value === targetValue) {
//         return true;
//       }
//     }
//   }
// }

function cycle<T>(lazyStreamer: Lazy<T>): Lazy<T> {
  return function* () {
    while (true) {
      const lazyStream = lazyStreamer();
      while (true) {
        const { value, done } = lazyStream.next();
        if (done) {
          break;
        }
        yield value;
      }
    }
  }
}

function strict<T>(lazyStreamer: Lazy<T>): Strict<T> {
  const lazyStream: Iterator<T> = lazyStreamer();
  const result: T[] = [];
  while (true) {
    const { value, done } = lazyStream.next();
    if (done) {
      return result;
    }
    result.push(value);
  }
}

function map<S, T>(mapFunction: (source: S) => T){
  return function (sourceStreamer: Lazy<S>): Lazy<T> {
    const sourceStream = sourceStreamer();
    return function* () {
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        yield mapFunction(value);
      }
    };
  }
}

function filter<S>(filterFunction: (source: S) => boolean) {
  return function (sourceStreamer: Lazy<S>): Lazy<S> {
    const sourceStream = sourceStreamer();
    return function* () {
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        if (filterFunction(value)) {
          yield value;
        }
      }
    }
  }
}

function take<S>(takeCount: number) {
  return function (sourceStreamer: Lazy<S>): Lazy<S> {
    const sourceStream = sourceStreamer();
    return function* () {
      for (let i = 0; i < takeCount; i += 1) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        yield value;
      }
    }
  }
}

function drop<S>(dropCount: number) {
  return function (sourceStreamer: Lazy<S>): Lazy<S> {
    const sourceStream = sourceStreamer();
    return function* () {
      let i = dropCount;
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        if (i > 0) {
          i -= 1;
          continue;
        }
        yield value;
      }
    }
  }
}

function zip<A, B>(sourceA: Lazy<A>, sourceB: Lazy<B>): Lazy<[A,B]> {
  const sourceAStream = sourceA();
  const sourceBStream = sourceB();
  return function* () {
    while (true) {
      const { value: valueA , done: doneA } = sourceAStream.next();
      const { value: valueB, done: doneB } = sourceBStream.next();
      if (doneA || doneB) {
        return;
      }
      yield [valueA, valueB];
    }
  }
}

function sort<S>(sourceStream: Lazy<S>): Lazy<S> {
  const strictResult: Strict<S> = strict(sourceStream);
  return function* () {
    while (true) {
      if (strictResult.length === 0) {
        return;
      }
      for (let i = strictResult.length; i > 0; i -= 1) {
        if (strictResult[i] < strictResult[i - 1]) {
          const temp = strictResult[i - 1];
          strictResult[i - 1] = strictResult[i];
          strictResult[i] = temp;
        }
      }
      yield strictResult.shift();
    }
  }
}

function* l1() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

// let lazy1: Lazy<number> = l1();
let lazy2: Lazy<number> = lazy([1,2,3,4,5]);
// let lazy3: Lazy<number> = range(1, 10, 2);
// let strict3: Strict<number> = strict(lazy3);
// let lazy4: Lazy<number> = map((x: number) => x * 2)(lazy3);
// let strict4: Strict<number> = strict(lazy4);

// console.log(strict(map((x: number) => x * 3)(lazy2)));
// console.log(strict(lazy2));
// console.log(strict(range(1, 10, 2)));
// console.log(strict(map((x: number) => x * 2)(range(1, 10))));
// console.log(strict(l1));
// console.log(strict(take(10)(filter((x: number) => x % 3 !== 0)(range(1, 100)))));
// console.log(strict(take(10)(filter((x: number) => x % 3 !== 0)((range())))));
// let lazyTuple: Lazy<[number, string]> = zip(
//   range(),
//   lazy(["a", "x", "sdfas", "dsfe"]),
// );

// console.log(strict(lazyTuple));

// console.log(strict(take(2)(sort(lazy([5,6,4,2,3])))));
console.log(strict(take(20)(cycle(lazy([1,3,4,5])))))