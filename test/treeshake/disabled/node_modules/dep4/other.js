import {anotherOne, anotherTwo} from './and-another';

function callAnotherTwo() {
  return anotherTwo();
}

export function first() {
  return anotherOne();
};

export function second() {
  return callAnotherTwo();
}
