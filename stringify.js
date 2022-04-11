const escapeString = (str) => str && str.replace(/[\n\r]/g, '')
// Won't work for minified class names however we need something fast
// That does not require iterating through everything
const fetchTypeName = (data) => data && data.constructor && data.constructor.name
const stringify = (data, depth = 5, customFormatters = {}) => {
  const typename = fetchTypeName(data)
  return data === undefined
    ? 'null'
    : !data
    ? JSON.stringify(data)
    : typeof data === 'object' && !Array.isArray(data)
    ? customFormatters[typename]
    ? customFormatters[typename](data)
    : depth < 1
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
