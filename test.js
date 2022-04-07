const makeLogger = require('./index')

const logger = makeLogger(__filename, { extraTypesForMessage: [Date] })

console.log({ logger })

logger.error(new Error('Only Error'))
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
  [{ fillAmount: -420, fee: 23 * 10 ** 9 }, 4512, true],
  new Error('FUNDS_ARE_SAFU'),
  {
    level1: {
      level2: {
        level3: {
          level4: 'deep',
          syke: {
            level5: {
              level6: {
                level7: {
                  level8: 'level9999'
                }
              }
            }
          }
        }
      }
    }
  }
)

// Valid logs
logger.log('Some message', { id1: 'id1', id2: 'id2', nestedProp: { id3: 'id3' } })
logger.error('Some error occured', new Error('some error'))
