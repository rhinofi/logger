Create loggers based on 'debug', with labels based on relative filepath
use as follows:

```js
const lgr = require(THIS_MODULE)(__filename)

lgr.log('hi')
lgr.log.lazy('some preprocessed data', () => 'lazily evaluated data')
lgr.error('some error')
```

assuming that the file in which the logger is located at path `src/someFile.js`
in relation to CWD, executing it as follows:

```sh
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

```
DEBUG='dvf:*'
```

will cause all logs which start with `dvf:` to be output to console

```
DEBUG='dvf:ERROR:*'
```

will result in only calls to `lgr.error` to be logged

```
DEBUG="dvf:*:$RELATIVE_FILE_PATH"
```

will show all types of logs but only from the file with the specified path
within the project

The lazy loggers can be used to log stuff which requires some pre-processing. If
any of the arguments passed to those loggers is a function, it will be called to
get the value to be logged, however this will only happen if given logger is
enabled. This way we can avoid paying for pre-processing if the value would not
have been logged anyway.
