const escapeString = (str) => str && str.replace('\n', '')
const stringify = (data, depth = 5) => {
  return data === undefined
    ? 'null'
    : !data
    ? JSON.stringify(data)
    : typeof data === 'object' && !Array.isArray(data)
    ? depth < 1
      ? '"{ ? }"'
      : `{${Object.keys(data)
          .map(
            (k) =>
              stringify(k, depth - 1) + ': ' + stringify(data[k], depth - 1)
          )
          .join(', ')}}`
    : Array.isArray(data)
    ? `[${data
        .map((d) => (depth < 1 ? '"?"' : stringify(d, depth - 1)))
        .join(', ')}]`
    : typeof data === 'function'
    ? '"f()"'
    : JSON.stringify(data)
}

const stringifySimple = (data) => typeof data === 'string'
  ? escapeString(data)
  : data

module.exports = { stringify, stringifySimple }
