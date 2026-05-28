// Next.js requires the middleware file to be named exactly "middleware.ts" at the project root.
// The session-refresh logic lives in proxy.ts; re-export it here so Next.js picks it up.
export { proxy as middleware, config } from './proxy'
