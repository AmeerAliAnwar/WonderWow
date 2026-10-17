// main.js — simple 4x4 jigsaw-like puzzle prototype
// Uses a single SVG artwork and slices it into a 4x4 grid of pieces.

const canvas = document.getElementById('puzzle-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const piecesArea = document.getElementById('pieces-area');
const btnReset = document.getElementById('btn-reset');
const btnBack = document.getElementById('btn-back');

// Config
const ROWS = 4, COLS = 4;
const PIECE_COUNT = ROWS * COLS;
const SNAP_THRESHOLD_RATIO = 1.5; // Increased for stronger magnet effect
const DRAG_SCALE = 1.05;
const SNAP_ANIM_MS = 160;

// Calculate available space and set canvas size
function calculateCanvasSize() {
  const boardWrap = document.getElementById('board-wrap');
  const rect = boardWrap.getBoundingClientRect();
  const availW = rect.width - 16; // padding
  const availH = rect.height - 16;
  
  // Use the smaller dimension to ensure square puzzle fits
  const size = Math.min(availW, availH);
  return { width: Math.floor(size), height: Math.floor(size) };
}

const canvasSize = calculateCanvasSize();
canvas.width = canvasSize.width;
canvas.height = canvasSize.height;

// Game state
let pieces = []; // {id, row, col, img, x,y,w,h, state}
let grid = {x: 20, y: 20, w: canvas.width - 40, h: canvas.height - 40};
let cellW = grid.w / COLS, cellH = grid.h / ROWS;
let dragging = null;
let pointerId = null;
let startTouchOffset = {x:0,y:0};
let assets = {};

// Load SVG artwork
async function loadAssets(){
  try{
    const res = await fetch('assets/puzzle_image_full.svg');
    if(!res.ok) throw new Error('Fetch failed: ' + res.status);
    assets.puzzle = await res.text();
  }catch(err){
    console.warn('Could not fetch SVG text (falling back to image load):', err);
    // leave assets.puzzle undefined; bootstrap will attempt Image fallback
    assets.puzzle = null;
  }
}

function svgTextToImage(svgText, width, height){
  return new Promise((resolve, reject)=>{
    const blob = new Blob([svgText], {type:'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = ()=>{ URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e)=>{ URL.revokeObjectURL(url); reject(e); };
    img.src = url;
    img.width = width; img.height = height;
  });
}

function createPiecesFromImage(img){
  pieces = [];
  // compute target draw area for the puzzle so it fits nicely
  // Reserve left 15% and right 15% for pieces area
  const leftAreaWidth = canvas.width * 0.15;
  const rightAreaWidth = canvas.width * 0.15;
  const boardAreaWidth = canvas.width - leftAreaWidth - rightAreaWidth;
  const pad = 8;
  const boardW = boardAreaWidth - pad*2;
  const boardH = grid.h - pad*2;
  const scale = Math.min(boardW / img.width, boardH / img.height);
  const drawW = Math.round(img.width * scale);
  const drawH = Math.round(img.height * scale);
  const offsetX = Math.round(leftAreaWidth + (boardAreaWidth - drawW)/2);
  const offsetY = Math.round((canvas.height - drawH)/2);

  // final display size for each piece
  const dw = Math.round(drawW / COLS);
  const dh = Math.round(drawH / ROWS);

  // Generate random jigsaw pattern (which edges have tabs vs blanks)
  // For each internal edge, decide if it's a tab (true) or blank (false)
  const tabsH = []; // horizontal edges: tabsH[r][c] = tab on right side of piece[r][c]
  const tabsV = []; // vertical edges: tabsV[r][c] = tab on bottom side of piece[r][c]
  for(let r=0;r<ROWS;r++){
    tabsH[r] = [];
    tabsV[r] = [];
    for(let c=0;c<COLS;c++){
      tabsH[r][c] = Math.random() > 0.5;
      tabsV[r][c] = Math.random() > 0.5;
    }
  }

  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const id = r*COLS + c;
      const sx = Math.round(c * (img.width / COLS));
      const sy = Math.round(r * (img.height / ROWS));
      const sw = Math.round(img.width / COLS);
      const sh = Math.round(img.height / ROWS);

      // Create jigsaw shape path for this piece
      const tabSize = Math.min(dw, dh) * 0.18; // tab protrusion
      const path = generateJigsawPath(dw, dh, tabSize, {
        top: r > 0 ? !tabsV[r-1][c] : false,    // inverse of piece above's bottom
        right: c < COLS-1 ? tabsH[r][c] : false,
        bottom: r < ROWS-1 ? tabsV[r][c] : false,
        left: c > 0 ? !tabsH[r][c-1] : false     // inverse of piece to left's right
      });

      // draw this slice into an offscreen canvas with jigsaw clip path
      const margin = Math.ceil(tabSize * 1.5); // extra space for tabs
      const oc = document.createElement('canvas');
      oc.width = dw + margin*2;
      oc.height = dh + margin*2;
      const ocCtx = oc.getContext('2d');
      
      // apply jigsaw clip path
      ocCtx.save();
      ocCtx.translate(margin, margin);
      ocCtx.beginPath();
      const p2d = new Path2D(path);
      ocCtx.clip(p2d);
      // draw the image portion for this piece
      const scaleX = dw / sw, scaleY = dh / sh;
      ocCtx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
      ocCtx.restore();

      // draw white outline around jigsaw shape
      ocCtx.save();
      ocCtx.translate(margin, margin);
      ocCtx.strokeStyle = '#fff';
      ocCtx.lineWidth = 3;
      ocCtx.stroke(p2d);
      ocCtx.strokeStyle = '#00000044';
      ocCtx.lineWidth = 1.5;
      ocCtx.stroke(p2d);
      ocCtx.restore();

      // create img for piece
      const pieceImg = new Image();
      pieceImg.src = oc.toDataURL();

      pieces.push({
        id, row:r, col:c, img:pieceImg,
        w: dw + margin*2, h: dh + margin*2, // actual canvas size with margin
        dw, dh, // core piece size
        margin, // offset for rendering
        path, // jigsaw path for hit testing
        // initial target grid position (centered on grid cell, accounting for margin)
        gx: offsetX + c*dw - margin, gy: offsetY + r*dh - margin,
        // current pos (will be set by shufflePiecesArea)
        x: 0, y: 0,
        state: 'idle',
        number: id + 1, // piece number for display (1-indexed)
        scale: 0.5 // initial scale
      });
    }
  }
  // shuffle initial positions
  shufflePiecesArea();

  // wait for all piece images to be ready before returning
  return Promise.all(pieces.map(p => new Promise((res) => { if(p.img.complete) return res(); p.img.onload = ()=>res(); })));
}

// Generate SVG-style path for a jigsaw piece with tabs/blanks on each edge
function generateJigsawPath(w, h, tabSize, edges){
  // edges: {top, right, bottom, left} - true for tab (protrusion), false for blank (indent)
  const path = [];
  const tabDepth = tabSize * 0.8;
  const tabWidth = tabSize * 1.4;
  const bezierControl = tabSize * 0.5;

  // Start at top-left
  path.push(`M 0 0`);

  // Top edge
  if(edges.top){
    // tab on top
    const midX = w/2;
    path.push(`L ${midX - tabWidth/2} 0`);
    path.push(`Q ${midX - tabWidth/2} ${-tabDepth/2} ${midX} ${-tabDepth}`);
    path.push(`Q ${midX + tabWidth/2} ${-tabDepth/2} ${midX + tabWidth/2} 0`);
    path.push(`L ${w} 0`);
  } else {
    path.push(`L ${w} 0`);
  }

  // Right edge
  if(edges.right){
    const midY = h/2;
    path.push(`L ${w} ${midY - tabWidth/2}`);
    path.push(`Q ${w + tabDepth/2} ${midY - tabWidth/2} ${w + tabDepth} ${midY}`);
    path.push(`Q ${w + tabDepth/2} ${midY + tabWidth/2} ${w} ${midY + tabWidth/2}`);
    path.push(`L ${w} ${h}`);
  } else {
    path.push(`L ${w} ${h}`);
  }

  // Bottom edge
  if(edges.bottom){
    const midX = w/2;
    path.push(`L ${midX + tabWidth/2} ${h}`);
    path.push(`Q ${midX + tabWidth/2} ${h + tabDepth/2} ${midX} ${h + tabDepth}`);
    path.push(`Q ${midX - tabWidth/2} ${h + tabDepth/2} ${midX - tabWidth/2} ${h}`);
    path.push(`L 0 ${h}`);
  } else {
    path.push(`L 0 ${h}`);
  }

  // Left edge
  if(edges.left){
    const midY = h/2;
    path.push(`L 0 ${midY + tabWidth/2}`);
    path.push(`Q ${-tabDepth/2} ${midY + tabWidth/2} ${-tabDepth} ${midY}`);
    path.push(`Q ${-tabDepth/2} ${midY - tabWidth/2} 0 ${midY - tabWidth/2}`);
    path.push(`L 0 0`);
  } else {
    path.push(`L 0 0`);
  }

  path.push(`Z`);
  return path.join(' ');
}

function shufflePiecesArea(){
  // Split pieces: half on left side, half on right side
  const leftMargin = 8;
  const rightMargin = 30; // Extra space for number badges
  const piecesPerSide = Math.ceil(pieces.length / 2);
  
  // Calculate the scale needed to fit all pieces vertically
  const availableHeight = canvas.height - 30; // Leave some margin top/bottom
  const maxPieceHeight = pieces.length > 0 ? pieces[0].h : 100;
  
  // Calculate spacing and scale to fit all pieces
  let sideScale = 0.5; // pieces are 50% size when in side areas
  let spacing = 6;
  
  // Check if pieces will fit, if not reduce scale and spacing
  const estimatedHeight = piecesPerSide * (maxPieceHeight * sideScale + spacing);
  if(estimatedHeight > availableHeight){
    // Need to reduce scale to fit
    sideScale = Math.min(0.5, (availableHeight / piecesPerSide - spacing) / maxPieceHeight);
    spacing = 3;
  }
  
  pieces.forEach((p,i)=>{
    const scaledW = p.w * sideScale;
    const scaledH = p.h * sideScale;
    
    if(i < piecesPerSide){
      // Left side pieces (first half)
      p.x = leftMargin;
      p.y = 15 + i * (scaledH + spacing);
    } else {
      // Right side pieces (second half) - with extra margin for badges
      p.x = canvas.width - scaledW - rightMargin;
      p.y = 15 + (i - piecesPerSide) * (scaledH + spacing);
    }
    p.state = 'idle';
    p.scale = sideScale; // store current scale
  });
}

function draw(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw vertical dividers for pieces areas (left 15% and right 15%)
  const leftAreaWidth = canvas.width * 0.15;
  const rightAreaWidth = canvas.width * 0.15;
  
  // Left area background
  ctx.fillStyle = '#f0f0f0aa';
  ctx.fillRect(0, 0, leftAreaWidth, canvas.height);
  ctx.strokeStyle = '#00000033';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftAreaWidth, 0);
  ctx.lineTo(leftAreaWidth, canvas.height);
  ctx.stroke();
  
  // Right area background
  ctx.fillStyle = '#f0f0f0aa';
  ctx.fillRect(canvas.width - rightAreaWidth, 0, rightAreaWidth, canvas.height);
  ctx.strokeStyle = '#00000033';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width - rightAreaWidth, 0);
  ctx.lineTo(canvas.width - rightAreaWidth, canvas.height);
  ctx.stroke();

  // draw puzzle board overlay (semi-transparent 4x4 grid)
  ctx.fillStyle = '#ffffffcc';
  ctx.fillRect(grid.x, grid.y, grid.w, grid.h);
  // draw grid outline
  ctx.strokeStyle = '#00000022'; ctx.lineWidth = 2;
  // draw cells lightly
  for(let r=0;r<=ROWS;r++){
    ctx.beginPath(); ctx.moveTo(grid.x, grid.y + r*(grid.h/ROWS)); ctx.lineTo(grid.x + grid.w, grid.y + r*(grid.h/ROWS)); ctx.stroke();
  }
  for(let c=0;c<=COLS;c++){
    ctx.beginPath(); ctx.moveTo(grid.x + c*(grid.w/COLS), grid.y); ctx.lineTo(grid.x + c*(grid.w/COLS), grid.y + grid.h); ctx.stroke();
  }

  // draw pieces: snapped ones locked to grid are drawn first (so they appear under dragging one)
  pieces.forEach(p=>{
    if(p.state === 'snapped') drawPiece(p, true);
  });
  // then idle ones
  pieces.forEach(p=>{
    if(p.state === 'idle') drawPiece(p);
  });
  // finally dragging piece drawn on top
  if(dragging) drawPiece(dragging, false, true);

  // Draw victory effect if active
  if(victoryAnimationActive){
    drawVictoryEffect();
  }

  requestAnimationFrame(draw);
}

function drawPiece(p, snapped=false, draggingNow=false){
  const x = snapped ? p.gx : p.x;
  const y = snapped ? p.gy : p.y;
  
  // Determine scale: idle pieces in side areas are scaled down
  let drawScale = 1.0;
  if(!snapped && p.state === 'idle' && p.scale){
    drawScale = p.scale;
  }
  
  const drawW = p.w * drawScale;
  const drawH = p.h * drawScale;
  
  // Check if piece is near its correct position while dragging
  let isNearCorrectPos = false;
  if(draggingNow && !snapped){
    const distToCorrect = Math.hypot(p.x - p.gx, p.y - p.gy);
    const snapDist = cellW * SNAP_THRESHOLD_RATIO;
    if(distToCorrect < snapDist){
      isNearCorrectPos = true;
      // Draw highlight rectangle at correct position
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 15;
      ctx.strokeRect(p.gx, p.gy, p.w, p.h);
      ctx.restore();
    }
  }
  
  ctx.save();
  if(draggingNow){
    // When dragging, scale up to full size smoothly
    ctx.translate(x + drawW/2, y + drawH/2);
    ctx.scale(DRAG_SCALE, DRAG_SCALE);
    ctx.translate(- (x + drawW/2), - (y + drawH/2));
    ctx.shadowColor = isNearCorrectPos ? 'rgba(0,255,0,0.5)' : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = isNearCorrectPos ? 25 : 20;
    ctx.shadowOffsetY = 8;
  }
  
  // Draw piece number badge next to the piece if not snapped and not dragging
  if(!snapped && p.state === 'idle' && !draggingNow){
    const badgeSize = 24; // Fixed size for better visibility
    const badgeX = x + drawW + 6;
    const badgeY = y + drawH / 2;
    
    // Draw shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Draw circular badge background
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow for border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw number
    ctx.shadowColor = 'transparent';
    ctx.font = `bold ${Math.round(badgeSize * 0.7)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(p.number.toString(), badgeX, badgeY);
  }
  
  // draw the jigsaw piece image (already clipped with tabs/blanks)
  ctx.drawImage(p.img, x, y, drawW, drawH);
  ctx.restore();
}

// hit test for topmost piece under pointer
function findPieceAt(px, py){
  for(let i=pieces.length-1;i>=0;i--){
    const p = pieces[i];
    if(p.state === 'snapped') continue;
    // use core piece area for easier interaction (ignore the extended margin tabs)
    const scale = (p.state === 'idle' && p.scale) ? p.scale : 1.0;
    const coreX = p.x + (p.margin * scale);
    const coreY = p.y + (p.margin * scale);
    const coreW = p.dw * scale;
    const coreH = p.dh * scale;
    if(px >= coreX && px <= coreX + coreW && py >= coreY && py <= coreY + coreH) return p;
  }
  return null;
}

// pointer handlers
canvas.addEventListener('pointerdown', (ev)=>{
  canvas.setPointerCapture(ev.pointerId);
  if(pointerId !== null) return; // already tracking
  pointerId = ev.pointerId;
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  const p = findPieceAt(x,y);
  if(p){
    startDragging(p, x, y, ev.pointerId);
    playSfx('pickup');
  }
});

canvas.addEventListener('pointermove', (ev)=>{
  if(pointerId !== ev.pointerId) return;
  if(!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  dragging.x = x - startTouchOffset.x;
  dragging.y = y - startTouchOffset.y;
});

canvas.addEventListener('pointerup', (ev)=>{
  if(pointerId !== ev.pointerId) return;
  if(dragging){
    releaseDragging();
  }
  pointerId = null;
});

function startDragging(p, x, y, pid){
  // bring to top
  const idx = pieces.indexOf(p);
  pieces.splice(idx,1); pieces.push(p);
  dragging = p;
  dragging.state = 'dragging';
  
  // If piece was scaled down, adjust offset and remove scale
  const oldScale = p.scale || 1.0;
  startTouchOffset.x = x - p.x; 
  startTouchOffset.y = y - p.y;
  
  // Expand to full size when starting to drag
  if(oldScale !== 1.0){
    // Adjust position to keep piece centered under cursor
    const centerOffsetX = (p.w * (1 - oldScale)) / 2;
    const centerOffsetY = (p.h * (1 - oldScale)) / 2;
    p.x -= centerOffsetX;
    p.y -= centerOffsetY;
    p.scale = 1.0;
    startTouchOffset.x += centerOffsetX;
    startTouchOffset.y += centerOffsetY;
  }
}

function releaseDragging(){
  if(!dragging) return;
  
  let snapX = null, snapY = null;
  
  // First check if piece is near its correct grid position
  const distToCorrect = Math.hypot(dragging.x - dragging.gx, dragging.y - dragging.gy);
  const threshold = cellW * SNAP_THRESHOLD_RATIO;
  
  if(distToCorrect < threshold){
    snapX = dragging.gx; 
    snapY = dragging.gy;
  }
  
  // If not snapping to grid, check neighbors
  if(snapX === null){
    const neighbors = getNeighborPieces(dragging);
    for(const neighbor of neighbors){
      if(neighbor.state === 'snapped'){
        const expectedPos = getExpectedPositionFromNeighbor(dragging, neighbor);
        const dist = Math.hypot(dragging.x - expectedPos.x, dragging.y - expectedPos.y);
        if(dist < threshold){
          snapX = expectedPos.x;
          snapY = expectedPos.y;
          break;
        }
      }
    }
  }
  
  if(snapX !== null){
    // animate snap to correct position
    const from = {x: dragging.x, y: dragging.y};
    const to = {x: snapX, y: snapY};
    const pieceRef = dragging;
    dragging = null;
    animateProperty(from, to, SNAP_ANIM_MS, (v)=>{ pieceRef.x = v.x; pieceRef.y = v.y; }, ()=>{ lockingPiece(pieceRef); });
    playSfx('snap');
  } else {
    // leave where released
    dragging.state = 'idle';
    dragging = null;
  }
}

// Get neighboring pieces (top, right, bottom, left) for a given piece
function getNeighborPieces(piece){
  const neighbors = [];
  const {row, col} = piece;
  // Top neighbor
  if(row > 0) neighbors.push(pieces.find(p => p.row === row-1 && p.col === col));
  // Right neighbor
  if(col < COLS-1) neighbors.push(pieces.find(p => p.row === row && p.col === col+1));
  // Bottom neighbor
  if(row < ROWS-1) neighbors.push(pieces.find(p => p.row === row+1 && p.col === col));
  // Left neighbor
  if(col > 0) neighbors.push(pieces.find(p => p.row === row && p.col === col-1));
  return neighbors.filter(n => n); // remove undefined
}

// Calculate where piece should be positioned based on a snapped neighbor
function getExpectedPositionFromNeighbor(piece, neighbor){
  const {row, col} = piece;
  const {row: nRow, col: nCol} = neighbor;
  
  let expectedX = neighbor.gx;
  let expectedY = neighbor.gy;
  
  if(nRow === row - 1){ // neighbor is above
    expectedY = neighbor.gy + neighbor.dh;
    expectedX = neighbor.gx;
  } else if(nRow === row + 1){ // neighbor is below
    expectedY = neighbor.gy - piece.dh;
    expectedX = neighbor.gx;
  } else if(nCol === col - 1){ // neighbor is to the left
    expectedX = neighbor.gx + neighbor.dw;
    expectedY = neighbor.gy;
  } else if(nCol === col + 1){ // neighbor is to the right
    expectedX = neighbor.gx - piece.dw;
    expectedY = neighbor.gy;
  }
  
  return {x: expectedX, y: expectedY};
}

function lockingPiece(p){
  p.state = 'snapped';
  p.x = p.gx; p.y = p.gy;
  p.scale = 1.0; // ensure full size when snapped
  checkWinCondition();
}

function animateProperty(from, to, timeMs, onUpdate, onComplete){
  const start = performance.now();
  function step(now){
    const t = Math.min(1, (now - start) / timeMs);
    const tt = easeOutCubic(t);
    const val = {x: from.x + (to.x - from.x) * tt, y: from.y + (to.y - from.y)*tt};
    onUpdate(val);
    if(t < 1) requestAnimationFrame(step); else onComplete && onComplete();
  }
  requestAnimationFrame(step);
}
function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

let confetti = [];
let victoryAnimationActive = false;

function checkWinCondition(){
  const complete = pieces.every(p=>p.state === 'snapped');
  if(complete){
    playSfx('victory');
    startVictoryEffect();
    setTimeout(() => {
      victoryAnimationActive = false;
      confetti = [];
    }, 3000);
  }
}

function startVictoryEffect(){
  victoryAnimationActive = true;
  
  // Create confetti particles
  confetti = [];
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
  for(let i = 0; i < 100; i++){
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }
}

function drawVictoryEffect(){
  if(!victoryAnimationActive) return;
  
  // Update and draw confetti
  confetti.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    c.rotation += c.rotationSpeed;
    c.vy += 0.1; // gravity
    
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size/2, -c.size/2, c.size, c.size);
    ctx.restore();
  });
  
  // Draw golden flash overlay
  const elapsed = Date.now() % 1000;
  const alpha = Math.sin(elapsed / 200) * 0.2 + 0.2;
  ctx.save();
  ctx.fillStyle = `rgba(255,215,0,${alpha})`;
  ctx.fillRect(grid.x, grid.y, grid.w, grid.h);
  ctx.restore();
  
  // Show "Puzzle Complete!" message with animation
  const scale = 1 + Math.sin(elapsed / 150) * 0.1;
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(scale, scale);
  
  // Outer glow
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 30;
  
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 8;
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('Puzzle Complete!', 0, 0);
  ctx.fillText('Puzzle Complete!', 0, 0);
  
  // Draw stars around text
  for(let i = 0; i < 8; i++){
    const angle = (i / 8) * Math.PI * 2 + elapsed / 500;
    const x = Math.cos(angle) * 150;
    const y = Math.sin(angle) * 80;
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('⭐', x, y);
  }
  
  ctx.restore();
}

// simple sfx manager using WebAudio (synthesized) — we also create placeholder files in assets folder for real audio replacements
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;

function playSfx(name){
  if(!audioCtx) return;
  if(name === 'pickup'){
    // soft pluck
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.value = 720; g.gain.value = 0.0001;
    o.connect(g); g.connect(audioCtx.destination);
    const now = audioCtx.currentTime; g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.1, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.start(now); o.stop(now + 0.26);
  } else if(name === 'snap'){
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.frequency.value = 880; g.gain.value = 0.0001; o.connect(g); g.connect(audioCtx.destination); const now = audioCtx.currentTime; g.gain.exponentialRampToValueAtTime(0.12, now + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); o.start(now); o.stop(now + 0.2);
  } else if(name === 'victory'){
    // Happy celebratory melody with multiple layers
    const now = audioCtx.currentTime;
    const melody = [523, 659, 784, 1047]; // C, E, G, C (major chord arpeggio)
    const harmony = [523, 659, 784]; // Harmony notes
    
    // Main melody
    melody.forEach((freq,i)=>{
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type='sine'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.15, now + i*0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.15 + 0.3);
      o.start(now + i*0.15); o.stop(now + i*0.15 + 0.35);
    });
    
    // Add harmony layer
    harmony.forEach((freq,i)=>{
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type='triangle'; o.frequency.value = freq * 1.5; o.connect(g); g.connect(audioCtx.destination);
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.08, now + i*0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.15 + 0.25);
      o.start(now + i*0.15 + 0.05); o.stop(now + i*0.15 + 0.3);
    });
    
    // Add celebration "ding" sounds
    [1047, 1319, 1568].forEach((freq, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type='sine'; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.2, now + 0.6 + i*0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6 + i*0.08 + 0.15);
      o.start(now + 0.6 + i*0.08); o.stop(now + 0.6 + i*0.08 + 0.2);
    });
  }
}

// UI Buttons
btnReset.addEventListener('click', ()=>{ shufflePiecesArea(); pieces.forEach(p=>p.state='idle'); });
btnBack.addEventListener('click', ()=>{ history.back(); });

// boot
(async function bootstrap(){
  await loadAssets();
  let img = null;
  if(assets.puzzle){
    // create image from svg text; we target a 800x800 friendly resolution
    try{
      img = await svgTextToImage(assets.puzzle, 800, 800);
    }catch(e){
      console.error('svgTextToImage failed, falling back to direct image load:', e);
      assets.puzzle = null;
    }
  }
  if(!assets.puzzle){
    // fallback: load the SVG as a normal image (may work when fetch is blocked)
    img = await new Promise((resolve, reject)=>{
      const i = new Image();
      i.onload = ()=> resolve(i);
      i.onerror = (e)=> reject(e);
      i.src = 'assets/puzzle_image_full.svg';
      // set reasonable display size
      i.width = 800; i.height = 800;
    }).catch(err=>{
      console.error('Failed to load puzzle image fallback:', err);
      return null;
    });
  }
  if(!img){
    console.error('No puzzle image available — cannot create pieces. Ensure files are served over HTTP or placed in assets/.');
    return;
  }
  // compute grid and cell sizes now that canvas was sized
  const leftAreaWidth = canvas.width * 0.15;
  const rightAreaWidth = canvas.width * 0.15;
  grid.x = leftAreaWidth + 12; 
  grid.y = 12; 
  grid.w = canvas.width - leftAreaWidth - rightAreaWidth - 24; 
  grid.h = canvas.height - 24;
  cellW = grid.w / COLS; cellH = grid.h / ROWS;
  await createPiecesFromImage(img);
  draw();
})();

// helper: expose simple file mapping for the assets naming convention (placeholders exist under assets/)
export const ASSET_FILENAMES = {
  bg_wood: 'assets/bg_wood.svg',
  puzzle_image_full: 'assets/puzzle_image_full.svg',
  // piece files can be exported at build-time if desired: puzzle_piece_[row]_[col].png
  ui_button_back: 'assets/ui_button_back.svg',
  ui_button_reset: 'assets/ui_button_reset.svg',
  bgm_cheerful: 'assets/bgm_cheerful.mp3',
  sfx_pickup: 'assets/sfx_pickup.wav',
  sfx_snap: 'assets/sfx_snap.wav',
  sfx_victory: 'assets/sfx_victory.wav'
};
