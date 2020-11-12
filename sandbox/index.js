const vm = require("vm");

function charsetFromRange(from, to) {
  return new Array(to - from)
    .fill(1).map(
      (_, index) => String.fromCharCode(from + index)
    ).join('');
}

function charsetFromString(ranges) {
  let index = 0;
  const charsets = [];
  while (index + 1 < ranges.length) {
    const from = ranges.charCodeAt(index);
    const to = ranges.charCodeAt(index + 1);
    charsets.push(charsetFromRange(from, to));
    index += 2;
  }

  return charsets.join('');
}

function randomCharactor(charset) {
  if (charset.length === 0) {
    return '';
  }

  return charset[Math.floor(Math.random() * charset.length)];
}

function parseLooseJSON(looseJSON) {
  const charset = charsetFromString('azAZ09');

  const randomVariable = ['_'].concat(
    new Array(
      5 + Math.floor(Math.random() * 20)
    )
      .fill(1)
      .map(() => randomCharactor(charset))
  ).join('');

  const script = new vm.Script(
    `const ${randomVariable} = ${ looseJSON }; exports = ${randomVariable};`
  );
  return script.runInNewContext();
}

const jsObject = `{
  foo: 'bar',
  key: {
    subkey: {
      number: 123
    }
  }
}`;
const json = {
  foo: 'bar',
  key: {
    subkey: {
      number: 123
    }
  }
};

console.log(
  'jsObject = json?',
  JSON.stringify(parseLooseJSON(jsObject)) === JSON.stringify(json)
);

console.log(parseLooseJSON(`
  undefined; console.log('hello'); exports = 123;
`));
