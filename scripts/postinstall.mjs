// Runs after `npm install` at the repo root.
//
// On Render (which sets RENDER=true) this installs the server + client deps and
// builds the React client, so even a plain `npm install` build command produces
// client/dist and the server has something to serve. Locally it's a no-op, so
// `npm install` stays fast for development.
import { execSync } from 'node:child_process'

if (process.env.RENDER) {
  console.log('▶ Render detected — installing server/client deps and building client…')
  execSync(
    'npm --prefix server install && npm --prefix client install && npm --prefix client run build',
    { stdio: 'inherit' },
  )
} else {
  // Local/dev: skip the heavy build. Use `npm run build` when you want it.
  console.log('· postinstall: not on Render, skipping client build.')
}
