const inject = require('seacreature/lib/inject')
const { parentPort } = require('worker_threads')
const net = require('net')
const readline = require('readline')
const pjson = require('./package.json')

inject('ctx', async () => {
  const netServer = net.createServer(async socket => {
    const rl = readline.createInterface({ input: socket, crlfDelay: Infinity })
    for await (const line of rl) console.log(line)
  })

  netServer.on('error', e => console.error(e))
  return { netServer }
})

inject('pod', async ({ netServer, hub, startup }) => {
  const release = startup.retain()
  const port = process.env.PORT || 8081
  netServer.listen(port, 'localhost', () => {
    release()
    const { address, port } = netServer.address()
    hub.on('shutdown', () => netServer.terminate())
    console.log(`${pjson.name}@${pjson.version} ${address}:${port}`)
    if (parentPort)
      parentPort.postMessage(JSON.stringify({ e: 'enable_caddy_logging', p: { port } }))
  })
})