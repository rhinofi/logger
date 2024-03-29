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
const { stringify, stringifySimple } = require('./stringify')

// This is a string, or a regex, which will be matched against the __filename.
// Whatever it matches will be removed.
const defaultRoot = process.env.DVF_LOGGER_ROOT
  // This is the directory from which node process was launched.
  // We use it as default root since it gives relative paths which can be
  // clicked on (in terminals such as iTerm) to open the file in an editor.
  || `${process.cwd()}/`

const PRETTY = Boolean(process.env.PRETTY)
const { DEPTH } = process.env
const EXTRA_PROPS = JSON.parse(process.env.EXTRA_PROPS || '{}')
const EXTRA_ERROR_PROPS = JSON.parse(process.env.EXTRA_ERROR_PROPS || '{}')
  || ({
    '@type':
      'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
  })

const LEVELS = ['DEBUG', 'LOG', 'WARN', 'ERROR', 'EMERGENCY']

const simpleTypes = [
  'bigint',
  'boolean',
  'number',
  'string',
  'symbol',
  'undefined',
]

let globalCustomFormatters = {}

const expandThunks = array =>
  array.map(elem => (typeof elem === 'function' ? elem() : elem))

const makeLazyLogger = strictLogger => (strictLogger.enabled
  // call it with functions expanded to actual values
  ? (...args) => strictLogger.apply(strictLogger, expandThunks(args))
  : () => {})

const parseArgs = (args, extraTypesForMessage) => {
  let message = ''
  const data = args
    .map(arg => {
      if (simpleTypes.includes(typeof arg)) {
        message += `${stringifySimple(arg)}`
      } else if (arg instanceof Error) {
        if (!message) {
          message = arg.message
        }

        return {
          name: arg.name,
          message: arg.message,
          data: arg.data,
          stack: arg.stack,
        }
      } else if (typeof arg === 'object') {
        if (extraTypesForMessage && extraTypesForMessage.length) {
          for (const extraType of extraTypesForMessage) {
            if (arg instanceof extraType) {
              message += ` ${stringify(arg, DEPTH)}`
            }
          }

          return arg
        }
        return arg
      }
      return undefined
    })
    .filter(Boolean)

  return { message, data }
}

const formatData = data => {
  if (simpleTypes.includes(typeof data)) {
    return `${stringifySimple(data)}`
  }

  if (typeof data === 'object') {
    return data
  }
}

const invalidInvocation = (args, extraTypesForMessage) => {
  console.error(new Error('INVALID_LOG_INVOCATION'))
  return parseArgs(args, extraTypesForMessage)
}

const findException = data => {
  if (!data) return

  const items = [data, data.error, data.err]
  const error = items.find(item => item instanceof Error)

  return error
}

const stringifyException = exception =>
  `${exception.name} ${exception.message}\n${exception.stack}`

const parseArgsV2 = (args, extraTypesForMessage) => {
  if (args.length === 1) {
    if (typeof args[0] === 'string') {
      return {
        message: args[0],
      }
    }
    if (args[0] instanceof Error) {
      return {
        message: stringifyException(args[0]),
        error: args[0],
      }
    }
    return invalidInvocation(args, extraTypesForMessage)
  }
  if (args.length > 2) {
    return invalidInvocation(args, extraTypesForMessage)
  }

  // Standard log format, [message, data]
  const [message, data] = args
  const exception = findException(data)

  const finalMessage = exception
    ? `${message} | ${stringifyException(exception)}`
    : message

  return {
    message: finalMessage,
    data: formatData(data, DEPTH),
    error: exception,
  }
}

/** @typedef {(message: string, data?: Object | Error) => void} LoggerFunction */
/** @typedef {(exception: Error) => void} ErrorLoggerFunction */

/**
 * @param {string} severity
 * @param {string} context
 * @param {Object} extraTypesForMessage
 * @returns {LoggerFunction | ErrorLoggerFunction}
 */
const makeStrictLogger = (
  severity,
  context,
  extraTypesForMessage,
  hasErrorProps,
) => {
  const debugLogger = debug(`dvf:${severity}:${context}`)

  const logger = (...args) => {
    if (!logger.enabled) return

    const { message, data, error } = parseArgsV2(args, extraTypesForMessage)

    const extraProps = {
      'logging.googleapis.com/sourceLocation': {
        file: context,
      },
      ...(error && hasErrorProps && EXTRA_ERROR_PROPS),
      ...EXTRA_PROPS,
    }

    const payload = {
      severity,
      timestamp: Date.now(),
      context,
      message,
      ...(data && { data }),
      ...(error && { error }),
      ...(!PRETTY && extraProps),
    }

    if (PRETTY) {
      const format = `${
        new Date(payload.timestamp).toISOString()
      } | ${payload.severity} | ${payload.context} |`
      console.log(format, payload.message, payload.data)
    } else {
      console.log(stringify(payload, DEPTH, globalCustomFormatters))
    }
  }

  logger.enabled = debugLogger.enabled || false

  return logger
}

module.exports = (
  filename,
  options = { root: defaultRoot, extraTypesForMessage: [] },
) => {
  const { root = defaultRoot, extraTypesForMessage } = options

  const relativeFilePath = filename.replace(new RegExp(`^${root}`), '')

  const loggers = {
    debug: makeStrictLogger(LEVELS[0], relativeFilePath, extraTypesForMessage),
    log: makeStrictLogger(LEVELS[1], relativeFilePath, extraTypesForMessage),
    warn: makeStrictLogger(LEVELS[2], relativeFilePath, extraTypesForMessage),
    error: makeStrictLogger(
      LEVELS[3],
      relativeFilePath,
      extraTypesForMessage,
      true,
    ),
    emergency: makeStrictLogger(
      LEVELS[4],
      relativeFilePath,
      extraTypesForMessage,
      true,
    ),
  }

  // Decorates each logger with .lazy prop, which contains the lazy version
  // of the logger.
  Object.values(loggers).forEach(logger => {
    logger.lazy = makeLazyLogger(logger)
  })

  return loggers
}

/**
 * @type {(globalFormatters: {[typeName: string]: (Object) => string}}
 */
module.exports.setGlobalCustomFormatters = globalFormatters => {
  globalCustomFormatters = globalFormatters
}
