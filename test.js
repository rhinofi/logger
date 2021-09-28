const makeLogger = require('./index')

const lgr = makeLogger(__filename)

lgr.debug('Debug message', { field1: 'stuff' })
lgr.log('some information here', [{ field1: 'stuff' }, { field1: 'more stuff' }])
lgr.warn('warning, attention', new Error('what?'))
lgr.error('error, not good', new Error('some pretty looking stack trace'))
lgr.emergency(
  'uh oh, its an emergency',
  [{ fillAmount: -420, fee: 23 * 10 ** 9 }, new Error('some pretty looking stack trace')],
  new Error('FUNDS_ARE_SAFU')
)
