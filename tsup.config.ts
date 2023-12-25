import { defineConfig } from 'tsup'
import pkg from './package.json'

export default defineConfig({
	entry: ['src/index.ts'],
	sourcemap: true,
	clean: true,
	format: ['cjs'],
	platform: 'browser',
	noExternal: ['starknet'],
	external: ['isomorphic-fetch'],
	define: {
		'process.env.VERSION': JSON.stringify(pkg.version),
	},
})
