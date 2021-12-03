const makeLogger = require('./index')

const logger = makeLogger(__filename, { extraTypesForMessage: [Date] })

console.log({ logger })

logger.debug('Debug message', { field1: 'stuff' }, true, new Date(), 123)
logger.log('some information here', [
  { field1: 'stuff' },
  { field1: 'more stuff' }
])
logger.warn('warning, attention', new Error('what?'))
logger.error('error, not good', new Error('some pretty looking stack trace'))
logger.emergency(
  'uh oh, its an emergency',
  new Date(),
  true,
  421,
  [
    { fillAmount: -420, fee: 23 * 10 ** 9 },
    new Error('some pretty looking stack trace')
  ],
  new Error('FUNDS_ARE_SAFU')
)
