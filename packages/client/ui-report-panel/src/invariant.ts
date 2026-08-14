/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-report-panel`.
 * @module @deepseek-ai/dsh-client-ui-report-panel/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-report-panel'

/** Cordis companion plugin name. */
export const name = 'client-ui-report-panel-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the dictionaries, slot entries, and node definition
 * are effect-owned with disposal proven by their plugin specs; this package
 * owns no mutable state outside the artifact store.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
