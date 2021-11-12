const makeLogger = require('./index')

const logger = makeLogger(__filename)

console.log({ logger })

logger.debug('Debug message', { field1: 'stuff' })
logger.log('some information here', [{ field1: 'stuff' }, { field1: 'more stuff' }])
logger.warn('warning, attention', new Error('what?'))
logger.error('error, not good', new Error('some pretty looking stack trace'))
logger.emergency(
  'uh oh, its an emergency',
  [{ fillAmount: -420, fee: 23 * 10 ** 9 }, new Error('some pretty looking stack trace')],
  new Error('FUNDS_ARE_SAFU')
)
