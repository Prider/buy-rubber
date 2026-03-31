// Side-effect module: must load before `@prisma/client` so engine env is set.
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
	process.env.PRISMA_CLIENT_ENGINE_TYPE = 'wasm';
}
