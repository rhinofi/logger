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

// This is the directory from which node process was launched.
// We use it as root since it gives relative paths which can be clicked on
// (in terminals such as iTerm) to open the file in an editor.
const cwd = process.cwd()

expandThunks = (array) => array.map(
  elem => typeof elem == 'function' ? elem() : elem
)

makeLazyLogger = (strictLogger) => {
  return strictLogger.enabled ?
    // if logger enabled, call it with functions expanded to actual values
    (...args) => strictLogger.apply(strictLogger, expandThunks(args)) :
    // no-op
    () => {}
}

makeStrictLogger = (label, {logToStderr, isErrorLogger}) => {
  const logger = debug(label)
  if (!logToStderr && !process.env.DEBUG_LOG_TO_STDERR) {
    // by default log to stdout
    logger.log = console.log.bind(console);
  }

  if (isErrorLogger) {
    const errorLogger = (...args) => {
      if (!logger.enabled) return

      const last = args[ args.length - 1 ]

      if (last instanceof Error) {
        const argsWithErrorMessage = args.slice(0, -1)
        argsWithErrorMessage.push(last.toString())
        // Log error.message via the logger with label.
        logger.apply(logger, argsWithErrorMessage)
        // Log error object on its own, so that it can be parsed by GCP Error
        // reporting.
        console.error(last)
      }
      else {
        logger(args)
      }
    }

    errorLogger.enabled = logger.enabled
    return errorLogger
  }


  return logger
}

module.exports = function (filename, options = {}) {
  const {
    prefix = 'dvf',
    root = cwd,
    logToStderr = false
  } = options

  const relativeFilePath = filename.replace(new RegExp(`^${root}/`), '');

  const errorOptions = Object.assign({}, options, {
    logToStderr: true,
    isErrorLogger: true
  })

  const loggers = {
    debug: makeStrictLogger(`${prefix}:DEBUG:${relativeFilePath}`, options),
    log: makeStrictLogger(`${prefix}:LOG:${relativeFilePath}`, options),
    warn: makeStrictLogger(`${prefix}:WARN:${relativeFilePath}`, options),
    error: makeStrictLogger(`${prefix}:ERROR:${relativeFilePath}`, errorOptions),
    emergency: makeStrictLogger(`${prefix}:EMERGENCY:${relativeFilePath}`, errorOptions),
  }

  // Decorates each logger with .lazy prop, which contains the lazy version
  // of the logger.
  Object.values(loggers)
  .forEach( logger => { logger.lazy = makeLazyLogger(logger) })

  return loggers
}
