/*
Create loggers based on 'debug', with labels based on relative filepath
use as follows:
  const lgr = require(THIS_MODULE)(__filename)

  lgr.log('hi')
  lgr.log.lazy('some preprocessed data', () => 'lazily evaluated data')
  lgr.error('some error')

assuming that the file in which the logger is located at path `src/someFile.js`
in relation to CWD, executing it as follows:
```
env DEBUG='*' node src/someFile.js
```

should give the following output:
```
  dvf:LOG:src/fileDebugTest.js hi +0ms
  dvf:LOG:src/fileDebugTest.js some pre-processed lazily evaluated data +0ms
  dvf:ERROR:src/fileDebugTest.js some error +0ms
```

The DEBUG env var con be used to control which loggers will produce output.
For example:

DEBUG='dvf:*'
  will cause all logs which start with `dvf:` to be output to console

DEBUG='dvf:ERROR:*'
  will result in only calls to `lgr.error` to be logged

DEBUG="dvf:*:$RELATIVE_FILE_PATH"
  will show all types of logs but only from the file with the specified path
  within the project


The lazy loggers can be used to log stuff which requires some pre-processing. If
any of the arguments passed to those loggers is a function, it will be called to
get the value to be logged, however this will only happen if given logger is
enabled. This way we can avoid paying for pre-processing if the value would not
have been logged anyway.
*/

const debug = require('debug')
const stringify = require('safe-json-stringify')

// This is a string, or a regex, which will be matched against the __filename.
// Whatever it matches will be removed.
const root =
  process.env.DVF_LOGGER_ROOT ||
  // This is the directory from which node process was launched.
  // We use it as default root since it gives relative paths which can be
  // clicked on (in terminals such as iTerm) to open the file in an editor.
  `${process.cwd()}/`

const PRETTY = Boolean(process.env.PRETTY)

const DEBUG = process.env.DEBUG

const LEVELS = ['DEBUG', 'LOG', 'WARN', 'ERROR', 'EMERGENCY']

const simpleTypes = [
  'bigint',
  'boolean',
  'number',
  'string',
  'symbol',
  'undefined'
]

const levelsHasDebug = LEVELS.includes(DEBUG)

const expandThunks = (array) =>
  array.map((elem) => (typeof elem == 'function' ? elem() : elem))

const makeLazyLogger = (strictLogger) => {
  return strictLogger.enabled
    ? // call it with functions expanded to actual values
      (...args) => strictLogger.apply(strictLogger, expandThunks(args))
    : // no-op
      () => {}
}

const parseArgs = (args, extraTypesForMessage) => {
  let message = ''
  const data = args
    .map((arg) => {
      if (simpleTypes.includes(typeof arg)) {
        message += stringify(arg)
      } else if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          data: arg.data,
          stack: arg.stack
        }
      } else if (extraTypesForMessage && extraTypesForMessage.length) {
        for (const extraType of extraTypesForMessage) {
          if (arg instanceof extraType) {
            message += stringify(arg)
            break
          }
        }
      } else return arg
    })
    .filter(Boolean)

  return { message, data }
}

const makeStrictLogger = (severity, context) => {
  const debugLogger = debug(`dvf:${severity}:${context}`)

  const logger = (...args) => {
    if (!logger.enabled) return

    const { message, data } = parseArgs(args, logger.extraTypesForMessage)
    const payload = { severity, timestamp: Date.now(), context, message, data }

    if (PRETTY) {
      const format = `${new Date(payload.timestamp).toISOString()} | ${
        payload.severity
      } | ${payload.context} |`
      console.log(format, payload.message, payload.data)
    } else {
      console.log(stringify(payload))
    }
  }

  logger.enabled = debugLogger.enabled || false

  return logger
}

module.exports = function (filename, options = { root }) {
  const { root } = options

  const relativeFilePath = filename.replace(new RegExp(`^${root}`), '')

  const loggers = {
    debug: makeStrictLogger(LEVELS[0], relativeFilePath),
    log: makeStrictLogger(LEVELS[1], relativeFilePath),
    warn: makeStrictLogger(LEVELS[2], relativeFilePath),
    error: makeStrictLogger(LEVELS[3], relativeFilePath),
    emergency: makeStrictLogger(LEVELS[4], relativeFilePath)
  }

  // Decorates each logger with .lazy prop, which contains the lazy version
  // of the logger.
  Object.values(loggers).forEach((logger) => {
    logger.lazy = makeLazyLogger(logger)
  })

  return loggers
}
