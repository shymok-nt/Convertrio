import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { z } from 'zod/v3'

const require = createRequire(import.meta.url)
const version = require('zod/package.json').version
const [major, minor, patch] = version.split('.').map(Number)

assert.ok(major > 4 || (major === 4 && (minor > 6 || (minor === 6 && patch >= 7))), `Unpatched Zod version: ${version}`)

// IMG.LY 1.7.0 constructs callbacks with the legacy z.function().args().returns() API.
const callback = z.function().args(z.string(), z.number(), z.number()).returns(z.void())
assert.equal(callback.safeParse(() => {}).success, true)

const model = z.preprocess(value => value === 'large' ? 'isnet' : value, z.enum(['isnet', 'isnet_fp16', 'isnet_quint8'])).default('medium')
assert.equal(model.parse('large'), 'isnet')

const options = z.object({
  model,
  output: z.object({ format: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/png'), quality: z.number().default(0.8) }).default({}),
}).default({})
assert.equal(options.parse({ model: 'large', output: { format: 'image/png' } }).model, 'isnet')

process.stdout.write(`Zod ${version}: IMG.LY legacy API compatibility smoke test passed.\n`)
