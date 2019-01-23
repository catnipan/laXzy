type LazyList<T> = () => Iterator<T>;
type StrictList<T> = Array<T>;


// when cache?

let indexArray: number[] = [1,2,3,4,5];

function lazy<T>(list: StrictList<T>): LazyList<T> {
  return function() {
    return list[Symbol.iterator]();
  };
}

function range(
  start: number = 1,
  to: number = Infinity,
  gap?: number,
): LazyList<number> {
  if (start > to) {
    const _gap = gap || -1;
    return function* () {
      for (let i = start; i >= to; i += _gap) {
        yield i;
      }
    }
  }
  const _gap = gap || 1;
  return function* () {
    for (let i = start; i <= to; i += _gap) {
      yield i;
    }
  };
}

function replicate(count: number) {
  return function<T> (value: T): LazyList<T> {
    return function* () {
      for (let i = 0; i < count; i += 1) {
        yield value;
      }
    }
  }
}

function repeat<T>(value: T): LazyList<T> {
  return function* () {
    while (true) {
      yield value;
    }
  }
}

// Solved True
// Solved False
// Pending
// function elem<T>(targetValue: T, LazyListStreamer: LazyList<T>) {
//   return function* () {
//     const LazyListStream = LazyListStreamer();
//     while (true) {
//       const { value, done } = LazyListStream.next();
//       if (done) {
//         return false;
//       }
//       if (value === targetValue) {
//         return true;
//       }
//     }
//   }
// }

function cycle<T>(lazyStreamer: LazyList<T>): LazyList<T> {
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

function concat<T>(lsA: LazyList<T>, lsB: LazyList<T>): LazyList<T> {
  const la = lsA();
  const lb = lsB();
  return cache(function* () {
    while (true) {
      const { value, done } = la.next();
      if (done) {
        break;
      }
      yield value;
    }
    while (true) {
      const { value, done } = lb.next();
      if (done) {
        break;
      }
      yield value;
    }
  });
}

function strict<T>(lazyStreamer: LazyList<T>): StrictList<T> {
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

function cache<T>(streamer: LazyList<T>): LazyList<T> {
  const cache: T[] = [];
  let stream = streamer();
  return function* cachedStreamer() {
    for (let i = 0; i < cache.length; i += 1) {
      yield cache[i];
    }
    while (stream) {
      const { value, done } = stream.next();
      if (done) {
        stream = undefined;
        return;
      }
      cache.push(value);
      yield value;
    }
  }
}

function map<S, T>(mapFunction: (source: S) => T){
  return function (sourceStreamer: LazyList<S>): LazyList<T> {
    const sourceStream = sourceStreamer();
    return cache(function* () {
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        yield mapFunction(value);
      }
    }); 
  }
}

function flatMap<S, T>(mapFunction: (source: S) => LazyList<T>){
  return function (sourceStreamer: LazyList<S>): LazyList<T> {
    const sourceStream = sourceStreamer();
    return cache(function* () {
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) return;
        const valueStream = mapFunction(value)();
        while (true) {
          const { value, done } = valueStream.next();
          if (done) break;
          yield value;
        }
      }
    }); 
  }
}

function filter<S>(filterFunction: (source: S) => boolean) {
  return function (sourceStreamer: LazyList<S>): LazyList<S> {
    const sourceStream = sourceStreamer();
    return cache(function* () {
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        if (filterFunction(value)) {
          yield value;
        }
      }
    }); 
  }
}

function take(takeCount: number) {
  return function<S> (sourceStreamer: LazyList<S>): LazyList<S>  {
    const sourceStream = sourceStreamer();
    return cache(function* () {
      for (let i = 0; i < takeCount; i += 1) {
        const { value, done } = sourceStream.next();
        if (done) {
          return;
        }
        yield value;
      }
    }); 
  }
}

function intersperse<S>(inter: S) {
  return function(sourceStreamer: LazyList<S>): LazyList<S> {
    const sourceStream = sourceStreamer();
    return cache(function* () {
      const { value } = sourceStream.next();
      yield value;
      while (true) {
        const { value, done } = sourceStream.next();
        if (done) return;
        yield inter;
        yield value;
      }
    })
  }
}

function iterate<S>(f: (s: S) => S) {
  return function (start: S): LazyList<S> {
    return cache(function* () {
      let curr = start;
      while (true) {
        yield curr;
        curr = f(curr);
      }
    })
  }
}

function nth(index: number) {
  return function<S> (sourceStreamer: LazyList<S>): S  {
    const sourceStream = sourceStreamer();
    let i = 0;
    while (true) {
      const { value, done } = sourceStream.next();
      if (done) return undefined;
      if (i === index) return value;
      i += 1;
    }
  }
}

const head: <S>(s: LazyList<S>) => S = nth(0);
const tail: <S>(s: LazyList<S>) => LazyList<S> = drop(1);

function drop(dropCount: number) {
  return function<S>(sourceStreamer: LazyList<S>): LazyList<S> {
    const sourceStream = sourceStreamer();
    return cache(function* () {
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
    })
  }
}

function zip<A>(sourceA: LazyList<A>) {
  return function<B>(sourceB: LazyList<B>): LazyList<[A,B]> {
    const sourceAStream = sourceA();
    const sourceBStream = sourceB();
    return cache(function* () {
      while (true) {
        const { value: valueA , done: doneA } = sourceAStream.next();
        const { value: valueB, done: doneB } = sourceBStream.next();
        if (doneA || doneB) {
          return;
        }
        yield [valueA, valueB] as [A, B];
      }
    });
  }
}

function sort<S>(sourceStream: LazyList<S>): LazyList<S> {
  const strictList: StrictList<S> = strict(sourceStream);
  return cache(function* () {
    while (true) {
      if (strictList.length === 0) {
        return;
      }
      for (let i = strictList.length; i > 0; i -= 1) {
        if (strictList[i] < strictList[i - 1]) {
          const temp = strictList[i - 1];
          strictList[i - 1] = strictList[i];
          strictList[i] = temp;
        }
      }
      yield strictList.shift();
    }
  });
}

function sortBy<S>(compareFunc: (a: S, b: S) => number) {
  return function(sourceStream: LazyList<S>): LazyList<S> {
    const strictList: StrictList<S> = strict(sourceStream);
    return cache(function* () {
      while (true) {
        if (strictList.length === 0) {
          return;
        }
        for (let i = strictList.length; i > 0; i -= 1) {
          if (compareFunc(strictList[i], strictList[i - 1]) < 0) {
            const temp = strictList[i - 1];
            strictList[i - 1] = strictList[i];
            strictList[i] = temp;
          }
        }
        yield strictList.shift();
      }
    }); 
  }
}

function reverse<S>(sourceStream: LazyList<S>): LazyList<S> {
  const strictList: StrictList<S> = strict(sourceStream);
  return function* () {
    for (let i = strictList.length - 1; i >= 0; i -= 1) {
      yield strictList[i];
    }
  };
}

// const l0 = cycle(lazy([1,2,3]));
// const l1 = take(20, l0);
// const l2 = filter((x: number) => { console.log('call filter', x); return x > 1} , l1);
// const l3 = map((x: number) => x * 2, l2);
// const l4 = map((x: number) => x / 2, l2);
// console.log(strict(l3));
// console.log(strict(l4));

// const l5 = concat(lazy([1,4,5,6]), lazy([2,3,7,9]));
// console.log(strict(l5));

// const l0 = map((x: number) => x * 2)(range(1, 100000));
// const l00 = filter((x: number) => x % 3 !== 0)(l0);
// const l1 = take(10)(l00);

// console.time('evalL1');
// const s1 = strict(l1);
// console.timeEnd('evalL1');

// console.log(strict(reverse(l1)));

const la = range(0, 10);
const lb = flatMap((x: number) => lazy([x, x * 2, x * 3]))(la);

// console.log(strict(replicate(5)('a')));
// console.log(nth(4)(range(0,10,2)))
// console.log(strict(intersperse('s')(lazy(['a','b','c','d']))));
console.log(strict(take(10)(iterate((x: number) => x * 2)(1))));

// console.time('evalD1');
// const x = Array(100000).fill(0).map((_, idx) => idx * 2).filter(x => x % 3 !== 0);
// console.timeEnd('evalD1');