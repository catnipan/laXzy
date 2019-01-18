type LazyStream<T> = Iterator<T>;
type Strict<T> = T[];

let indexArray: number[] = [1,2,3,4,5];

function lazy<T>(list: Strict<T>): LazyStream<T> {
  return list[Symbol.iterator]();
};

function range(
  start: number,
  to: number = Infinity,
  gap: number,
): LazyStream<number> {
  return function* rangeGen() {
    for (let i = start; i < to; i += gap) {
      yield i;
    }
  }();
}

function strict<T>(lazyStream: LazyStream<T>): Strict<T> {
  const result: T[] = [];
  while (true) {
    const { value, done } = lazyStream.next();
    if (done) {
      return result;
    }
    result.push(value);
  }
}

function* l1() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
}

let lazy1: LazyStream<number> = l1();
let lazy2: LazyStream<number> = lazy([1,2,3,4,5]);
let lazy3: LazyStream<number> = range(1,10,2);
let strict3: Strict<number> = strict(lazy3);