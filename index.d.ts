type loggerMethod1 = (x: string | Error) => void

type LaziFy<T> = T | (() => T)

type loggerMethod1Lazy = (
  lazyX: LaziFy<Parameters<loggerMethod1>[0]>,
) => void

// TODO: be more specific about y
type loggerMethod2 = (x: string, y: any) => void

type loggerMethod2Lazy = (
  lazyX: LaziFy<Parameters<loggerMethod2>[0]>,
  lazyY: LaziFy<Parameters<loggerMethod2>[1]>,
) => void

type loggerMethod = loggerMethod1 & loggerMethod2 & {
  lazy: loggerMethod1Lazy & loggerMethod2Lazy
}

declare module '@rhinofi/logger' {
  export interface Logger {
    debug: loggerMethod
    log: loggerMethod
    warn: loggerMethod
    error: loggerMethod
    emergency: loggerMethod
  }

  type loggerFactory = (__filename: string) => Logger

  const loggerFactory: loggerFactory

  export default loggerFactory
}
