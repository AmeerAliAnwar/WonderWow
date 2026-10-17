// Memory Match Scratch Card Game
// 6 pairs (12 cards) - Cards stay in place for memory learning!

(function(){
  const boardEl = document.getElementById('board')
  const coinsEl = document.getElementById('coins')
  const msgEl = document.getElementById('message')
  const resetBtn = document.getElementById('resetBtn')
  const coinAnimEl = document.getElementById('coinAnimation')

  let coins = 0
  const TILE_COUNT = 12  // 12 tiles = 6 pairs
  const ALL_IMAGES = [
    // cartoon panda
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="gPanda"><stop offset="0%" style="stop-color:#fff"/><stop offset="100%" style="stop-color:#f0f0f0"/></radialGradient></defs><circle cx="50" cy="55" r="32" fill="url(#gPanda)" stroke="#333" stroke-width="2"/><circle cx="28" cy="35" r="12" fill="#333"/><circle cx="72" cy="35" r="12" fill="#333"/><ellipse cx="38" cy="50" rx="8" ry="10" fill="#333"/><ellipse cx="62" cy="50" rx="8" ry="10" fill="#333"/><circle cx="38" cy="48" r="3" fill="#fff"/><circle cx="62" cy="48" r="3" fill="#fff"/><ellipse cx="50" cy="58" rx="4" ry="6" fill="#333"/><path d="M50 64c-8 0-12-4-12-4s4 8 12 8 12-8 12-8-4 4-12 4z" fill="#ff9ff3"/></svg>'),
    // cartoon rainbow ice cream
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gCone" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#ffd89a"/><stop offset="100%" style="stop-color:#d4a574"/></linearGradient></defs><path d="M35 55l15 40 15-40z" fill="url(#gCone)" stroke="#b8935e" stroke-width="2"/><circle cx="50" cy="45" r="18" fill="#ff9ff3"/><circle cx="38" cy="35" r="14" fill="#feca57"/><circle cx="62" cy="35" r="14" fill="#48dbfb"/><circle cx="50" cy="25" r="12" fill="#ee5a6f"/></svg>'),
    // cartoon rainbow star
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gStar1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ffd700"/><stop offset="50%" style="stop-color:#feca57"/><stop offset="100%" style="stop-color:#ff9ff3"/></linearGradient></defs><path d="M50 8l11 23 25 4-18 17 4 25-22-12-22 12 4-25-18-17 25-4z" fill="url(#gStar1)" stroke="#ff6b6b" stroke-width="2"/></svg>'),
    // cartoon cat
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gCat"><stop offset="0%" style="stop-color:#feca57"/><stop offset="100%" style="stop-color:#ff9ff3"/></linearGradient></defs><circle cx="50" cy="55" r="28" fill="url(#gCat)"/><path d="M25 35l-8-20 15 12z" fill="url(#gCat)"/><path d="M75 35l8-20-15 12z" fill="url(#gCat)"/><circle cx="40" cy="50" r="5" fill="#333"/><circle cx="60" cy="50" r="5" fill="#333"/><ellipse cx="50" cy="58" rx="3" ry="4" fill="#ff6b6b"/></svg>'),
    // cartoon pizza slice
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gPizza"><stop offset="0%" style="stop-color:#ffd700"/><stop offset="100%" style="stop-color:#feca57"/></linearGradient></defs><path d="M50 20l-35 70 70 0z" fill="url(#gPizza)" stroke="#d4a574" stroke-width="3"/><circle cx="40" cy="50" r="6" fill="#ee5a6f"/><circle cx="55" cy="60" r="6" fill="#ee5a6f"/><circle cx="45" cy="70" r="6" fill="#ee5a6f"/></svg>'),
    // cartoon donut
    'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="gDonut"><stop offset="0%" style="stop-color:#feca57"/><stop offset="100%" style="stop-color:#ff9ff3"/></radialGradient></defs><circle cx="50" cy="50" r="32" fill="url(#gDonut)" stroke="#d4a574" stroke-width="2"/><circle cx="50" cy="50" r="14" fill="#fff" stroke="#d4a574" stroke-width="2"/><rect x="42" y="25" width="6" height="10" fill="#ff6b6b" rx="3"/><rect x="60" y="35" width="5" height="8" fill="#48dbfb" rx="2"/></svg>')
  ]
  
  let IMAGES = [] // Current set of 6 images for this round
  let arrangement = [] // length 12 with indices into IMAGES
  let tiles = [] // objects for each tile
  let firstRevealed = null // track first revealed card index
  let matchedPairs = [] // track which card indices have been matched
  let pairsFound = 0 // count of pairs found
  let isProcessing = false // prevent multiple clicks during animation

  function selectNewImages(){
    // Use all 6 images for 6 pairs
    IMAGES = [...ALL_IMAGES]
  }

  function shuffleArrangement(){
    // Create 6 pairs (each image appears twice)
    const pool = []
    for(let i = 0; i < IMAGES.length; i++){
      pool.push(i, i) // Each image twice
    }
    // Fisher-Yates shuffle
    for(let i = pool.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    arrangement = pool
  }

  function updateCoins(n){
    coins += n
    coinsEl.textContent = coins
  }

  function showMsg(text, timeout = 2500){
    msgEl.textContent = text
    msgEl.classList.add('highlight')
    clearTimeout(showMsg._t)
    showMsg._t = setTimeout(() => { msgEl.classList.remove('highlight') }, timeout)
  }

  // Sound effects using Web Audio API
  function playCoinSound(isJackpot){
    try{
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const duration = isJackpot ? 0.3 : 0.15
      const numCoins = isJackpot ? 8 : 3
      
      for(let i = 0; i < numCoins; i++){
        setTimeout(() => {
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          
          oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioCtx.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
          
          oscillator.start(audioCtx.currentTime)
          oscillator.stop(audioCtx.currentTime + duration)
        }, i * 50)
      }
    } catch(e){
      // Audio not supported
    }
  }

  function createCoinBurst(centerX, centerY){
    const burst = document.createElement('div')
    burst.className = 'coin-burst'
    burst.style.left = (centerX - 40) + 'px'
    burst.style.top = (centerY - 40) + 'px'
    coinAnimEl.appendChild(burst)
    setTimeout(() => burst.remove(), 1500)
  }

  function createFlyingCoinsToCounter(count, startX, startY){
    const counterEl = document.querySelector('.coins-display')
    const counterRect = counterEl.getBoundingClientRect()
    const targetX = counterRect.left + counterRect.width / 2
    const targetY = counterRect.top + counterRect.height / 2
    
    for(let i = 0; i < count; i++){
      setTimeout(() => {
        const coin = document.createElement('div')
        coin.className = 'flying-coin fly-to-counter'
        
        const offsetX = (Math.random() - 0.5) * 100
        const offsetY = (Math.random() - 0.5) * 100
        const coinStartX = startX + offsetX
        const coinStartY = startY + offsetY
        
        coin.style.left = coinStartX + 'px'
        coin.style.top = coinStartY + 'px'
        
        const deltaX = targetX - coinStartX
        const deltaY = targetY - coinStartY
        
        coin.style.setProperty('--targetX', deltaX + 'px')
        coin.style.setProperty('--targetY', deltaY + 'px')
        
        coinAnimEl.appendChild(coin)
        setTimeout(() => coin.remove(), 1200)
      }, i * 60)
    }
  }

  function triggerCoinAnimation(isJackpot){
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    playCoinSound(isJackpot)
    
    if(isJackpot){
      createCoinBurst(centerX, centerY)
      setTimeout(() => {
        createFlyingCoinsToCounter(12, centerX, centerY)
      }, 300)
    } else {
      createFlyingCoinsToCounter(5, centerX, centerY)
    }
  }

  function createTile(index){
    const tile = document.createElement('div')
    tile.className = 'tile cartoon-paper'

    const pic = document.createElement('div')
    pic.className = 'pic'
    const img = document.createElement('img')
    img.alt = 'symbol'
    pic.appendChild(img)
    tile.appendChild(pic)

    const canvas = document.createElement('canvas')
    canvas.className = 'scratch-canvas'
    tile.appendChild(canvas)

    boardEl.appendChild(tile)

    const ctx = canvas.getContext('2d')
    const state = { index, revealed: false }

    function resize(){
      const rect = tile.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio))
      canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio))
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      if(!state.revealed && !matchedPairs.includes(index)){
        drawOverlay()
      }
    }

    function drawOverlay(){
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Random gradient colors for variety
      const gradients = [
        ['#a29bfe', '#fd79a8', '#fdcb6e'],
        ['#ff9ff3', '#feca57', '#48dbfb'],
        ['#ee5a6f', '#feca57', '#a29bfe'],
        ['#48dbfb', '#ff9ff3', '#ffd700']
      ]
      const randomGrad = gradients[index % gradients.length]
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, randomGrad[0])
      gradient.addColorStop(0.5, randomGrad[1])
      gradient.addColorStop(1, randomGrad[2])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add sparkle effect
      ctx.globalAlpha = 0.3
      for(let i = 0; i < 15; i++){
        ctx.fillStyle = i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#ffeaa7' : '#dfe6e9'
        ctx.beginPath()
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 4 + 2
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      
      // Add "?" text
      ctx.save()
      ctx.font = 'bold 24px Arial'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', canvas.width / 2, canvas.height / 2)
      ctx.restore()
    }

    function revealAt(x, y){
      const r = Math.max(20, Math.min(canvas.width, canvas.height) * 0.12)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }

    let drawing = false
    function pointerDown(e){
      if(isProcessing || matchedPairs.includes(index)) return
      drawing = true
      const pos = getPos(e)
      revealAt(pos.x, pos.y)
      checkRevealPercent()
    }
    function pointerMove(e){
      if(!drawing || isProcessing || matchedPairs.includes(index)) return
      const pos = getPos(e)
      revealAt(pos.x, pos.y)
      checkRevealPercent()
    }
    function pointerUp(){ drawing = false }

    function getPos(e){
      const rect = canvas.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      return { x: (clientX - rect.left), y: (clientY - rect.top) }
    }

    function checkRevealPercent(){
      const w = canvas.width
      const h = canvas.height
      try{
        const data = ctx.getImageData(0, 0, w, h).data
        let cleared = 0, total = 0
        const step = Math.max(4, Math.floor(w / 30))
        for(let y = 0; y < h; y += step){
          for(let x = 0; x < w; x += step){
            const idx = (y * w + x) * 4 + 3
            total++
            if(data[idx] === 0) cleared++
          }
        }
        const pct = cleared / total
        if(pct > 0.35 && !state.revealed){
          state.revealed = true
          onTileRevealed(index)
        }
      } catch(err){
        // ignore
      }
    }

    // Events
    canvas.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); pointerDown(e) })
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerMove(e) })
    canvas.addEventListener('touchend', pointerUp)

    window.addEventListener('resize', resize)
    resize()

    return Object.assign(state, { tileEl: tile, picEl: img, canvas, ctx, resize, drawOverlay })
  }

  function buildBoard(){
    boardEl.innerHTML = ''
    tiles = []
    for(let i = 0; i < TILE_COUNT; i++){
      tiles.push(createTile(i))
    }
    applyArrangement()
  }

  function applyArrangement(){
    tiles.forEach((t, i) => {
      const imgIndex = arrangement[i]
      t.picEl.src = IMAGES[imgIndex]
    })
  }

  function onTileRevealed(i){
    if(isProcessing) return
    if(matchedPairs.includes(i)) return
    
    // Clear the scratch overlay for this card
    tiles[i].ctx.clearRect(0, 0, tiles[i].canvas.width, tiles[i].canvas.height)
    
    // First card revealed
    if(firstRevealed === null){
      firstRevealed = i
      showMsg('🧠 Remember this card! Find its pair!')
      return
    }
    
    // Same card clicked again
    if(i === firstRevealed){
      showMsg('⚠️ Same card! Scratch a different one!')
      return
    }
    
    // Second card revealed - check for match
    isProcessing = true
    const firstSymbol = arrangement[firstRevealed]
    const currentSymbol = arrangement[i]
    
    if(currentSymbol === firstSymbol){
      // MATCH FOUND!
      matchedPairs.push(firstRevealed, i)
      pairsFound++
      
      // Add matched class for visual feedback
      tiles[firstRevealed].tileEl.classList.add('matched')
      tiles[i].tileEl.classList.add('matched')
      
      updateCoins(20)
      showMsg(`🎉 MATCH! +20 coins! (${pairsFound}/6 pairs)`, 2000)
      triggerCoinAnimation(pairsFound === 6)
      
      setTimeout(() => {
        firstRevealed = null
        isProcessing = false
        
        // Check if all pairs found
        if(pairsFound >= 6){
          updateCoins(50) // Bonus for completing
          showMsg('🏆 AMAZING! All pairs found! +50 bonus! New game starting...', 3000)
          setTimeout(() => { newGame() }, 3000)
        }
      }, 1000)
      
    } else {
      // NO MATCH - Cover both cards back up (memory game style)
      showMsg('❌ Not a match! Try to remember where they are!', 1500)
      
      setTimeout(() => {
        // Cover both cards back
        tiles[firstRevealed].revealed = false
        tiles[firstRevealed].drawOverlay()
        
        tiles[i].revealed = false
        tiles[i].drawOverlay()
        
        firstRevealed = null
        isProcessing = false
        showMsg('🧠 Remember the positions! Try again!')
      }, 1200)
    }
  }

  function newGame(){
    selectNewImages()
    shuffleArrangement()
    matchedPairs = []
    pairsFound = 0
    firstRevealed = null
    isProcessing = false
    
    // Reset all tiles
    tiles.forEach(t => {
      t.revealed = false
      t.tileEl.classList.remove('matched')
      t.drawOverlay()
    })
    
    applyArrangement()
    showMsg('✨ New game! Find all 6 matching pairs! ✨')
  }

  resetBtn.addEventListener('click', () => {
    newGame()
  })

  // Start
  selectNewImages()
  shuffleArrangement()
  buildBoard()
  showMsg('✨ Scratch cards & find matching pairs! Remember positions! ✨')

  window.ScratchGame = { newGame }
})();
