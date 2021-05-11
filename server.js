const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set mappe
app.use(express.static(path.join(__dirname, "public")))

// Start serveren
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Find klient der logger på
const connections = [null, null]

io.on('connection', socket => {
  // console.log('New WS Connection')

  // Angiv spiller en spiller id
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i
      break
    }
  }

  // Fortæl hvad nummer spilleren er
  socket.emit('player-number', playerIndex)

  console.log(`Player ${playerIndex} has connected`)

  // Ignorer en evt 3 spiller
  if (playerIndex === -1) return

  connections[playerIndex] = false

  // Fortæl hvem der lige connected
  socket.broadcast.emit('player-connection', playerIndex)

  // Disconnects
  socket.on('disconnect', () => {
    console.log(`Player ${playerIndex} disconnected`)
    connections[playerIndex] = null
    // Fortæl hvem der disconnected
    socket.broadcast.emit('player-connection', playerIndex)
  })

  // Spilleren er klar
  socket.on('player-ready', () => {
    socket.broadcast.emit('enemy-ready', playerIndex)
    connections[playerIndex] = true
  })

  // Check spiller connections
  socket.on('check-players', () => {
    const players = []
    for (const i in connections) {
      connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
    }
    socket.emit('check-players', players)
  })

  // Skud modtaget
  socket.on('fire', id => {
    console.log(`Shot fired from ${playerIndex}`, id)

    // Ryk
    socket.broadcast.emit('fire', id)
  })

  // Fire svar
  socket.on('fire-reply', square => {
    console.log(square)

    // vis til spiller
    socket.broadcast.emit('fire-reply', square)
  })

  // afk
  setTimeout(() => {
    connections[playerIndex] = null
    socket.emit('timeout')
    socket.disconnect()
  }, 600000) // 10 m max
})