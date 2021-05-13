// Det vigtigt at alt htmlen er loaded før vi kører javascript, da det første vi gør i javascript er at hente en masse information
// Fra html-filerne. Dette gøres ved at skrive følgende funktion her på næste linje.
document.addEventListener('DOMContentLoaded', () => {

  // Herunder starter vi med at "hente" nogle klasser og tags fra vores html filer, der gør
  // at vi kan ændre i de forskellige klassers værdier.

  // Herunder bliver de forskellige værdier, angivet for griden.
  const brugerGrid = document.querySelector('.grid-bruger')
  const computerGrid = document.querySelector('.grid-computer')
  const visueltGrid = document.querySelector('.grid-visuelt')

  // Vi angiver hvert skibs værdi i js. Det gør det nemmere at referre til dem senere i koden.
  const ships = document.querySelectorAll('.ship')
  const Patruljebod = document.querySelector('.Patruljebod-container')
  const UBod = document.querySelector('.UBod-container')
  const Kampskib = document.querySelector('.Kampskib-container')
  const Slagskib = document.querySelector('.Slagskib-container')
  const Hangarskib = document.querySelector('.Hangarskib-container')

    // Vi angiver knapperne, ligesom med bådene så vi kan referre til dem i koden.
  const startKanp = document.querySelector('#startKnap')
  const roterKnap = document.querySelector('#roterSkib')
  const hvisTur = document.querySelector('#hvisTurNu')
  const informationViser = document.querySelector('#info')
  const setupKnapSpil = document.getElementById('setup')




  // Herunder angiver vi information omkring spillet, som vi skal bruge senere i koden.
  // Her laver vi et array der kommer til at indeholde brugerens firkanter i spillet og det samme gælder for computeren.
  const brugerensFirkanter = []
  const computerensFirkanter = []

  // Vi går ud fra at skibet som default er placeret i en horizontal retning, hvis det ikke bliver ændret af brugeren.
  let erHorizontal = true

  // Her angiver vi at spillet som default ikke er slut, og kun slutter når spilSlut er true.
  let spilSlut = false

  // Vi ved også at når klienten connecter til serveren, vil man som default være angiver som user. 
  let denneSpiller = 'user'

  // Vores grid er 10x10 så width for gridet er 10.
  const width = 10

  // Som default er der ikke nogle spillere på serveren
  let spillerNummer = 0

  // Når en spiller kommer på, er man som default ikke ready / klar.
  let ready = false

  // Det samme som overfor gælder fjenden.
  let fjendeReady = false

  // Når man kommer ind på serveren har man ikke placeret nogle skibe, og derfor kan vi gå
  // ud fra at alle skibbe ikke er placeret.
  let alleSkibePlaceret = false

  // Ingen skud er skudt.
  let shotFired = -1

  // Herunder laver vi et array, der indeholder alle de forskellige skibe vi har med i spillet:
  // For at gøre det nemmere at kode, har vi kodet hvert skib, så vi ved præiocs i hvilke firkanter
  // skibet befinder sig. Det ses herunder:
 const shipArray = [
  {
    name: 'Patruljebod', // Her er navnet på skibet
    directions: [ // Herunder har vi angivet skibets mål, i føglende:
      [0, 1], // Skibets mål en vandret vinkel
      [0, width] // Skibets mål i en lodret vinkel.
    ] // Dete gælder de følgende skibe herunder:
  },
  {
    name: 'UBod',
    directions: [
      [0, 1, 2],
      [0, width, width*2]
    ]
  },
  {
    name: 'Kampskib',
    directions: [
      [0, 1, 2],
      [0, width, width*2]
    ]
  },
  {
    name: 'Slagskib',
    directions: [
      [0, 1, 2, 3],
      [0, width, width*2, width*3]
    ]
  },
  {
    name: 'Hangarskib',
    directions: [
      [0, 1, 2, 3, 4],
      [0, width, width*2, width*3, width*4]
    ]
  },
]

// Da vi nu har angivet alle skibene, kan vi altså også lave et grid, hvor vi faktisk
// loader alle firkanterne man kan sætte skibene i på skærmen. Dette gør vi ved at kalde funktionen 
// lavSpilBoard, med inputene for brugerens grid og computerens grid i den anden.
lavSpilBoard(brugerGrid, brugerensFirkanter)
lavSpilBoard(computerGrid, computerensFirkanter)

  // Her checker vi hvilket type af spillet vi skal starte
  if (gameMode === 'singlePlayer') { // Hvis gameMode'en som er sat i html filen for singleplayer og mulitplayer er ligmed singleplayer så:
    startSinglePlayer() // Starter singlePlayer versionen af spillet.
  } else { // Hvis ikke singlePlayer startes:
    startMultiPlayer() // Kan vi konkludere at multiPlayer skal startes.
  }

  // Herunder laver vi startMuliPlayer funktion som vi kaldte ovenfor:
  function startMultiPlayer() {

    const socket = io(); // Her bruger vi socket.io som er et server framework.

    // Spillerens id, samt vi checker om serveren er fuld:
    socket.on('player-number', num => {
      if (num === -1) { // Hvis spillerens nummer er ligmed -1, er serveren fuld og vi returnere:
        informationViser.innerHTML = "Serveren er fuld. Vent venligst" // Besked til spiller om at serveren er fuld.
      } else { // Hvis serveren ikke er fuld så gør følgende:
        spillerNummer = parseInt(num) // Modtager spillerens nummer
        if(spillerNummer === 1) denneSpiller = "enemy" // Hvis spillerens nummer er ligmed 1, ved vi at der allerede er en spiller 0, og derfor skal spiller 1 være en fjende.

        console.log(spillerNummer) // Vi logger så spillerens nummer i console, så vi kan se hvem der er connected.

        // Få status fra en spiller, se server.js
        socket.emit('check-players') // Her sender serveren bare en status a hvilke spillere der er connected tilbage.
      }
    })

    // Her får vi serveren til at sende en opdatering til console, når en spiller connecter eller disconnecter til serveren.
    socket.on('player-connection', num => { // Når der er en 'player-connection' modtager vi et num(nummer) som er spillerens nummer.
      console.log(`Player number ${num} has connected or disconnected`) // Vi logger spillerens nummer og status i console.
      spillerConnectEllerDisCon(num) // Dette kommer vi mere ind på, når vi når til funktionen, men den viser bare på skærmen hvilken spiller man er.
    })

    // Her får vi serveren til at checke om ens modstanger er klar.
    socket.on('enemy-ready', num => { // Når serveren modtager at en spiller er klar, modtager vi et nummer, som er ligmed fjenden nummer.
      fjendeReady = true // Når fjenden er klar, ændre vi i den boolean som vi lavede i starten af filen, fra false til true, da spilleren er klar = true (sandt)
      playerReady(num) // Modtager spillerens nummer
      if (ready) { // Hvis spilleren er klar
        playGameMulti(socket) // Start muliPlayer
        setupKnapSpil.style.display = 'none' // Fjern styles fra ready i css.
      }
    })

    // Check spillerens status
    socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) spillerConnectEllerDisCon(i)
        if(p.ready) {
          playerReady(i)
          if(i !== playerReady) fjendeReady = true
        }
      })
    })

    // Check afk
    socket.on('timeout', () => {
      informationViser.innerHTML = 'AFK'
    })





    //////////////////////////////////////////////////////////////////////////////////////////////////
    /// Herunder er der en masse gamelogik, der ikke er kommenterert ligeså grundigt som det øvrige///
    /// De vigtigste dele er kommenteret.                                                          ///
    //////////////////////////////////////////////////////////////////////////////////////////////////



    
    // Når man trykker på start
    startKanp.addEventListener('click', () => {
      if(alleSkibePlaceret) playGameMulti(socket)
      else informationViser.innerHTML = "Sæt alle dine skibe, og prøv igen"
    })

    // Se om spilleren skyder efter noget
    computerensFirkanter.forEach(square => {
      square.addEventListener('click', () => {
        if(denneSpiller === 'user' && ready && fjendeReady) {
          shotFired = square.dataset.id
          socket.emit('fire', shotFired)
        }
      })
    })

    // Modtager skudet
    socket.on('fire', id => {
      enemyGo(id)
      const square = brugerensFirkanter[id]
      socket.emit('fire-reply', square.classList)
      playGameMulti(socket)
    })

    // Modtag skudets "svar"
    socket.on('fire-reply', classList => {
      revealSquare(classList)
      playGameMulti(socket)
    })

    // Styling af tekst når man connecter eller disconnecter
    function spillerConnectEllerDisCon(num) {
      let player = `.p${parseInt(num) + 1}`
      document.querySelector(`${player} .connected`).classList.toggle('active')
      if(parseInt(num) === spillerNummer) document.querySelector(player).style.fontWeight = 'bold'
    }
  }


  // Single Player Skibs generator
  function startSinglePlayer() {

    generate(shipArray[0])
    generate(shipArray[1])
    generate(shipArray[2])
    generate(shipArray[3])
    generate(shipArray[4])

    startKanp.addEventListener('click', () => {
      setupKnapSpil.style.display = 'none'
      playGameSingle()
    })
  }

  // Her laver vi boardet man spiller på
  function lavSpilBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }




  // Her laver vi computerens skibe tilfældigt
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
    let randomStart = Math.abs(Math.floor(Math.random() * computerensFirkanter.length - (ship.directions[0].length * direction)))

    const erTaget = current.some(index => computerensFirkanter[randomStart + index].classList.contains('taken'))
    const erVedHojreSide = current.some(index => (randomStart + index) % width === width - 1)
    const erVedVenstreSide = current.some(index => (randomStart + index) % width === 0)

    if (!erTaget && !erVedHojreSide && !erVedVenstreSide) current.forEach(index => computerensFirkanter[randomStart + index].classList.add('taken', ship.name))

    else generate(ship)
  }
  

  // Rotering af skibe
  function rotate() {
    if (erHorizontal) {
      Patruljebod.classList.toggle('Patruljebod-container-vertical')
      UBod.classList.toggle('UBod-container-vertical')
      Kampskib.classList.toggle('Kampskib-container-vertical')
      Slagskib.classList.toggle('Slagskib-container-vertical')
      Hangarskib.classList.toggle('Hangarskib-container-vertical')
      erHorizontal = false
      return
    }
    if (!erHorizontal) {
      Patruljebod.classList.toggle('Patruljebod-container-vertical')
      UBod.classList.toggle('UBod-container-vertical')
      Kampskib.classList.toggle('Kampskib-container-vertical')
      Slagskib.classList.toggle('Slagskib-container-vertical')
      Hangarskib.classList.toggle('Hangarskib-container-vertical')
      erHorizontal = true
      return
    }
  }
  roterKnap.addEventListener('click', rotate)

  // Ryk rund
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  brugerensFirkanter.forEach(square => square.addEventListener('dragstart', dragStart))
  brugerensFirkanter.forEach(square => square.addEventListener('dragover', dragOver))
  brugerensFirkanter.forEach(square => square.addEventListener('dragenter', dragEnter))
  brugerensFirkanter.forEach(square => square.addEventListener('dragleave', dragLeave))
  brugerensFirkanter.forEach(square => square.addEventListener('drop', dragDrop))
  brugerensFirkanter.forEach(square => square.addEventListener('dragend', dragEnd))

  let valgtSkibsNavnMedIndexet
  let trukketShip
  let trukketShipLengde

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    valgtSkibsNavnMedIndexet = e.target.id
  }))

  function dragStart() {
    trukketShip = this
    trukketShipLengde = this.childNodes.length
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
  }

  // Ryk på skib
  function dragDrop() {
    let shipNameWithLastId = trukketShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0, -2)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)

    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(valgtSkibsNavnMedIndexet.substr(-1))

    shipLastId = shipLastId - selectedShipIndex


    if (erHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < trukketShipLengde; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === trukketShipLengde -1) directionClass = 'end'
        brugerensFirkanter[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken','horizontal', directionClass ,shipClass)
      }
    //Så længe indexet af skibet man rykker ikke er i en position der ikke er tilladt! Her gør vi så man automatisk rykker skibet til nærmeste mulige firkant.
    } else if (!erHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < trukketShipLengde; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === trukketShipLengde -1) directionClass = 'end'
        brugerensFirkanter[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken','vertical', directionClass, shipClass)
      }
    } else return

    visueltGrid.removeChild(trukketShip)
    if(!visueltGrid.querySelector('.ship')) alleSkibePlaceret = true
  }

  function dragEnd() {

  }

  // Logik til spillet i multiplayer
  function playGameMulti(socket) {
    if(spilSlut) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(spillerNummer)
    }

    if(fjendeReady) {
      if(denneSpiller === 'user') {
        hvisTur.innerHTML = 'Din tur - Tryk på et felt i boksen til højre.'
      }
      if(denneSpiller === 'enemy') {
        hvisTur.innerHTML = "Vent på det bliver din tur igen."
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  // Spil logic singleplayer
  function playGameSingle() {
    if (spilSlut) return
    if (denneSpiller === 'user') {
      hvisTur.innerHTML = 'Din tur - Tryk på et felt i boksen til højre.'
      computerensFirkanter.forEach(square => square.addEventListener('click', function(e) {
        shotFired = square.dataset.id
        revealSquare(square.classList)
      }))
    }
    if (denneSpiller === 'enemy') {
      hvisTur.innerHTML = 'Vent på det bliver din tur igen.'
      setTimeout(enemyGo, 1000)
    }
  }

  let PatruljebodCount = 0
  let UBodCount = 0
  let KampskibCount = 0
  let SlagskibCount = 0
  let HangarskibCount = 0

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if (!enemySquare.classList.contains('boom') && denneSpiller === 'user' && !spilSlut) {
      if (obj.includes('Patruljebod')) PatruljebodCount++
      if (obj.includes('UBod')) UBodCount++
      if (obj.includes('Kampskib')) KampskibCount++
      if (obj.includes('Slagskib')) SlagskibCount++
      if (obj.includes('Hangarskib')) HangarskibCount++
    }
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom')
    } else {
      enemySquare.classList.add('miss')
    }
    checkForWins()
    denneSpiller = 'enemy'
    if(gameMode === 'singlePlayer') playGameSingle()
  }

  let cpuPatruljebodCount = 0
  let cpuUBodCount = 0
  let cpuKampskibCount = 0
  let cpuSlagskibCount = 0
  let cpuHangarskibCount = 0


  function enemyGo(square) {
    if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * brugerensFirkanter.length)
    if (!brugerensFirkanter[square].classList.contains('boom')) {
      const hit = brugerensFirkanter[square].classList.contains('taken')
      brugerensFirkanter[square].classList.add(hit ?'boom' : 'miss')
      if (brugerensFirkanter[square].classList.contains('Patruljebod')) cpuPatruljebodCount++
      if (brugerensFirkanter[square].classList.contains('UBod')) cpuUBodCount++
      if (brugerensFirkanter[square].classList.contains('Kampskib')) cpuKampskibCount++
      if (brugerensFirkanter[square].classList.contains('Slagskib')) cpuSlagskibCount++
      if (brugerensFirkanter[square].classList.contains('Hangarskib')) cpuHangarskibCount++
      checkForWins()
    } else if (gameMode === 'singlePlayer') enemyGo()
    denneSpiller = 'user'
    hvisTur.innerHTML = 'Din tur - Tryk på et felt i boksen til højre.'
  }


  // Check for om man har vundet eller ej
  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
    if (PatruljebodCount === 2) {
      informationViser.innerHTML = `Du sank ${enemy}'s Patruljebod`
      PatruljebodCount = 10
    }
    if (UBodCount === 3) {
      informationViser.innerHTML = `Du sank ${enemy}'s UBod`
      UBodCount = 10
    }
    if (KampskibCount === 3) {
      informationViser.innerHTML = `Du sank ${enemy}'s Kampskib`
      KampskibCount = 10
    }
    if (SlagskibCount === 4) {
      informationViser.innerHTML = `Du sank ${enemy}'s Slagskib`
      SlagskibCount = 10
    }
    if (HangarskibCount === 5) {
      informationViser.innerHTML = `Du sank ${enemy}'s Hangarskib`
      HangarskibCount = 10
    }
    if (cpuPatruljebodCount === 2) {
      informationViser.innerHTML = `${enemy} sank din Patruljebod`
      cpuPatruljebodCount = 10
    }
    if (cpuUBodCount === 3) {
      informationViser.innerHTML = `${enemy} sank din UBod`
      cpuUBodCount = 10
    }
    if (cpuKampskibCount === 3) {
      informationViser.innerHTML = `${enemy} sank din Kampskib`
      cpuKampskibCount = 10
    }
    if (cpuSlagskibCount === 4) {
      informationViser.innerHTML = `${enemy} sank din Slagskib`
      cpuSlagskibCount = 10
    }
    if (cpuHangarskibCount === 5) {
      informationViser.innerHTML = `${enemy} sank din Hangarskib`
      cpuHangarskibCount = 10
    }

    if ((PatruljebodCount + UBodCount + KampskibCount + SlagskibCount + HangarskibCount) === 50) {
      informationViser.innerHTML = "Tillykke, du vandt!"
      gameOver()
    }
    if ((cpuPatruljebodCount + cpuUBodCount + cpuKampskibCount + cpuSlagskibCount + cpuHangarskibCount) === 50) {
      informationViser.innerHTML = `${enemy.toUpperCase()} vandt!`
      gameOver()
    }
  }

  function gameOver() {
    spilSlut = true
    startKanp.removeEventListener('click', playGameSingle)
  }
})
