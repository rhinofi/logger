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

const expandThunks = array => array.map(elem => (typeof elem == 'function' ? elem() : elem))

const makeLazyLogger = strictLogger => {
  // call it with functions expanded to actual values
  return (...args) => strictLogger.apply(strictLogger, expandThunks(args))
}

const parseArgs = args => {
  const parsed = args.map(arg => {
    const argument =
      arg instanceof Error
        ? {
            name: arg.name,
            message: arg.message,
            data: arg.data,
            stack: arg.stack
          }
        : arg
    return PRETTY ? argument : stringify(argument)
  })

  return PRETTY ? parsed : parsed.join(' ')
}

const makeStrictLogger = (severity, context) => {
  const logger = (...args) => {
    const message = parseArgs(args)
    const payload = { severity, timestamp: Date.now(), context, message }

    if (
      (!DEBUG && severity !== 'DEBUG') ||
      (DEBUG && !LEVELS.includes(DEBUG) && severity !== 'DEBUG') ||
      DEBUG === '*' ||
      (LEVELS.includes(DEBUG) && DEBUG === severity)
    ) {
      if (PRETTY) {
        const format = `${new Date(payload.timestamp).toISOString()} | ${payload.context} | ${
          payload.severity
        } |`
        console.log(format, payload.message)
      } else {
        console.log(payload)
      }
    }
  }

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
  Object.values(loggers).forEach(logger => {
    logger.lazy = makeLazyLogger(logger)
  })

  return loggers
}
