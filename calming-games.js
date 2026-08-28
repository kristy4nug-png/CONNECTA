(function(root) {
  "use strict";

  let currentGame = null;
  const dialog = document.getElementById('gameDialog');
  const container = document.getElementById('gameContainer');
  const ui = document.getElementById('gameUI');
  const instructions = document.getElementById('gameInstructions');

  // --- GAME 1: UNTANGLE ---
  class UntangleGame {
    constructor() {
      this.level = 1;
      this.initCanvas();
      this.bindEvents();
      this.startLevel();
      this.loop = this.loop.bind(this);
      this.isRunning = true;
      requestAnimationFrame(this.loop);
    }
    
    initCanvas() {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.touchAction = 'none';
      container.innerHTML = '';
      container.appendChild(this.canvas);
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.width = container.clientWidth;
      this.height = container.clientHeight;
      this.canvas.width = this.width * window.devicePixelRatio;
      this.canvas.height = this.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    startLevel() {
      ui.textContent = `Untangle - Level ${this.level}`;
      instructions.textContent = "Drag dots so no lines cross";
      this.nodes = [];
      this.edges = [];
      this.draggedNode = null;
      
      const numNodes = 4 + this.level;
      // Generate nodes in a circle so it's planar by default
      const radius = Math.min(this.width, this.height) * 0.35;
      const cx = this.width / 2;
      const cy = this.height / 2;
      
      for(let i=0; i<numNodes; i++) {
        const angle = (i / numNodes) * Math.PI * 2;
        this.nodes.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          r: 15
        });
      }
      
      // Connect perimeter
      for(let i=0; i<numNodes; i++) {
        this.edges.push([i, (i+1)%numNodes]);
      }
      // Scramble nodes randomly
      for(let i=0; i<numNodes; i++) {
        this.nodes[i].x = 40 + Math.random() * (this.width - 80);
        this.nodes[i].y = 40 + Math.random() * (this.height - 80);
      }
    }

    bindEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const startDrag = (e) => {
        const pos = getPos(e);
        this.draggedNode = this.nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < n.r * 2);
      };

      const doDrag = (e) => {
        if(!this.draggedNode) return;
        e.preventDefault();
        const pos = getPos(e);
        this.draggedNode.x = Math.max(15, Math.min(this.width - 15, pos.x));
        this.draggedNode.y = Math.max(15, Math.min(this.height - 15, pos.y));
      };

      const endDrag = () => {
        this.draggedNode = null;
        if (this.countIntersections() === 0) {
          this.level++;
          this.startLevel();
        }
      };

      this.canvas.addEventListener('mousedown', startDrag);
      this.canvas.addEventListener('mousemove', doDrag);
      window.addEventListener('mouseup', endDrag);
      
      this.canvas.addEventListener('touchstart', startDrag, {passive:false});
      this.canvas.addEventListener('touchmove', doDrag, {passive:false});
      window.addEventListener('touchend', endDrag);
    }

    intersect(p1, p2, p3, p4) {
      const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
      return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }

    countIntersections() {
      let count = 0;
      for(let i=0; i<this.edges.length; i++) {
        for(let j=i+1; j<this.edges.length; j++) {
          const e1 = this.edges[i], e2 = this.edges[j];
          if(e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) continue;
          if(this.intersect(this.nodes[e1[0]], this.nodes[e1[1]], this.nodes[e2[0]], this.nodes[e2[1]])) count++;
        }
      }
      return count;
    }

    loop() {
      if(!this.isRunning) return;
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // Draw edges
      this.ctx.lineWidth = 3;
      for(let i=0; i<this.edges.length; i++) {
        const e1 = this.edges[i];
        let isCrossed = false;
        // check if this specific edge crosses any other
        for(let j=0; j<this.edges.length; j++) {
          if(i===j) continue;
          const e2 = this.edges[j];
          if(e1[0] !== e2[0] && e1[0] !== e2[1] && e1[1] !== e2[0] && e1[1] !== e2[1]) {
            if(this.intersect(this.nodes[e1[0]], this.nodes[e1[1]], this.nodes[e2[0]], this.nodes[e2[1]])) isCrossed = true;
          }
        }
        this.ctx.strokeStyle = isCrossed ? '#e11d48' : '#10b981';
        this.ctx.beginPath();
        this.ctx.moveTo(this.nodes[e1[0]].x, this.nodes[e1[0]].y);
        this.ctx.lineTo(this.nodes[e1[1]].x, this.nodes[e1[1]].y);
        this.ctx.stroke();
      }

      // Draw nodes
      this.nodes.forEach(n => {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        this.ctx.fill();
      });

      requestAnimationFrame(this.loop);
    }
    
    destroy() { this.isRunning = false; }
  }

  // --- GAME 2: CAIRN (STONE STACKING) ---
  class CairnGame {
    constructor() {
      this.level = 1;
      this.score = 0;
      this.isRunning = true;
      this.initMatter();
      this.bindEvents();
    }
    
    initMatter() {
      container.innerHTML = '';
      ui.textContent = `Cairn - Stones: ${this.score}`;
      instructions.textContent = "Tap to drop and stack stones";
      
      this.engine = Matter.Engine.create();
      this.render = Matter.Render.create({
        element: container,
        engine: this.engine,
        options: {
          width: container.clientWidth,
          height: container.clientHeight,
          wireframes: false,
          background: 'transparent',
          pixelRatio: window.devicePixelRatio
        }
      });
      
      this.width = container.clientWidth;
      this.height = container.clientHeight;
      
      // Ground
      const ground = Matter.Bodies.rectangle(this.width/2, this.height + 25, this.width, 50, { 
        isStatic: true,
        render: { fillStyle: '#94a3b8' } 
      });
      Matter.World.add(this.engine.world, [ground]);
      
      Matter.Render.run(this.render);
      
      // Custom game loop for win/loss conditions
      this.runner = Matter.Runner.create();
      Matter.Runner.run(this.runner, this.engine);
      
      Matter.Events.on(this.engine, 'beforeUpdate', () => this.checkBounds());
    }

    bindEvents() {
      const dropStone = (e) => {
        if(!this.isRunning) return;
        const rect = this.render.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        
        const sides = Math.floor(Math.random() * 4) + 4; // 4 to 7 sides
        const radius = 25 - (this.level * 2) + Math.random() * 15; // smaller as level goes up
        
        const stone = Matter.Bodies.polygon(x, 20, sides, Math.max(10, radius), {
          friction: 0.8,
          restitution: 0.1,
          density: 0.05,
          render: { fillStyle: '#334155' }
        });
        
        Matter.World.add(this.engine.world, stone);
        this.score++;
        if(this.score % 5 === 0) this.level++;
        ui.textContent = `Cairn - Level ${this.level} (Stones: ${this.score})`;
      };
      
      this.render.canvas.addEventListener('mousedown', dropStone);
      this.render.canvas.addEventListener('touchstart', dropStone, {passive:true});
    }

    checkBounds() {
      const bodies = Matter.Composite.allBodies(this.engine.world);
      for(let i=0; i<bodies.length; i++) {
        const body = bodies[i];
        if(!body.isStatic && body.position.y > this.height + 100) {
          // A stone fell! Reset game.
          this.isRunning = false;
          Matter.Runner.stop(this.runner);
          Matter.Render.stop(this.render);
          ui.textContent = `Tower Collapsed! Final Score: ${this.score}`;
          setTimeout(() => {
            if(currentGame === this) {
              currentGame.destroy();
              currentGame = new CairnGame();
            }
          }, 2000);
          return;
        }
      }
    }

    destroy() {
      this.isRunning = false;
      if(this.runner) Matter.Runner.stop(this.runner);
      if(this.render) Matter.Render.stop(this.render);
      if(this.engine) Matter.Engine.clear(this.engine);
      container.innerHTML = '';
    }
  }

  // --- GAME 3: FLOW PATHWAYS ---
  class FlowGame {
    constructor() {
      this.level = 1;
      this.gridSize = 3;
      this.colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      this.initBoard();
    }

    initBoard() {
      ui.textContent = `Flow Pathways - Level ${this.level}`;
      instructions.textContent = "Connect matching colored dots";
      container.innerHTML = '';
      
      this.gridSize = Math.min(8, 2 + this.level);
      
      this.board = document.createElement('div');
      this.board.style.display = 'grid';
      this.board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
      this.board.style.gap = '2px';
      this.board.style.width = '90vmin';
      this.board.style.height = '90vmin';
      this.board.style.backgroundColor = '#334155';
      this.board.style.padding = '2px';
      this.board.style.touchAction = 'none'; // Prevent scrolling while drawing
      container.appendChild(this.board);

      this.generatePuzzle();
      this.render();
      this.bindEvents();
    }

    generatePuzzle() {
      // 1. Generate paths that completely fill the grid
      let grid = Array(this.gridSize * this.gridSize).fill(-1);
      this.endpoints = [];
      let pathId = 0;

      const getNeighbors = (idx) => {
        const x = idx % this.gridSize;
        const y = Math.floor(idx / this.gridSize);
        const n = [];
        if (x > 0) n.push(idx - 1);
        if (x < this.gridSize - 1) n.push(idx + 1);
        if (y > 0) n.push(idx - this.gridSize);
        if (y < this.gridSize - 1) n.push(idx + this.gridSize);
        return n.filter(i => grid[i] === -1);
      };

      for(let i=0; i<grid.length; i++) {
        if(grid[i] !== -1) continue;
        let curr = i;
        const start = curr;
        grid[curr] = pathId;
        
        while(true) {
          const neighbors = getNeighbors(curr);
          if(neighbors.length === 0) break;
          const next = neighbors[Math.floor(Math.random() * neighbors.length)];
          grid[next] = pathId;
          curr = next;
        }
        
        // Only keep paths that are at least length 2, otherwise we retry/merge later
        // For simplicity, we just use the endpoints
        this.endpoints.push({ id: pathId, start: start, end: curr, color: this.colors[pathId % this.colors.length] });
        pathId++;
      }

      this.cells = Array(this.gridSize * this.gridSize).fill(null);
      this.endpoints.forEach(ep => {
        this.cells[ep.start] = { type: 'dot', id: ep.id, color: ep.color };
        this.cells[ep.end] = { type: 'dot', id: ep.id, color: ep.color };
      });
    }

    render() {
      this.board.innerHTML = '';
      this.domCells = [];
      for(let i=0; i<this.cells.length; i++) {
        const cell = document.createElement('div');
        cell.style.backgroundColor = '#1e293b';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.dataset.idx = i;
        
        if (this.cells[i]) {
          const inner = document.createElement('div');
          inner.style.width = this.cells[i].type === 'dot' ? '60%' : '100%';
          inner.style.height = this.cells[i].type === 'dot' ? '60%' : '100%';
          inner.style.borderRadius = this.cells[i].type === 'dot' ? '50%' : '0';
          inner.style.backgroundColor = this.cells[i].color;
          cell.appendChild(inner);
        }
        
        this.domCells.push(cell);
        this.board.appendChild(cell);
      }
    }

    bindEvents() {
      this.isDrawing = false;
      this.currentId = null;
      this.currentColor = null;
      this.currentPath = [];

      const getIdxFromEvent = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const el = document.elementFromPoint(clientX, clientY);
        return el ? parseInt(el.dataset.idx || el.parentElement.dataset.idx) : null;
      };

      const startDraw = (e) => {
        e.preventDefault();
        const idx = getIdxFromEvent(e);
        if (idx !== null && this.cells[idx] && this.cells[idx].type === 'dot') {
          this.isDrawing = true;
          this.currentId = this.cells[idx].id;
          this.currentColor = this.cells[idx].color;
          // Clear existing path for this ID
          for(let i=0; i<this.cells.length; i++) {
            if(this.cells[i] && this.cells[i].type === 'path' && this.cells[i].id === this.currentId) {
              this.cells[i] = null;
            }
          }
          this.currentPath = [idx];
          this.render();
        }
      };

      const moveDraw = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();
        const idx = getIdxFromEvent(e);
        if (idx === null || isNaN(idx)) return;
        
        const lastIdx = this.currentPath[this.currentPath.length - 1];
        if (idx === lastIdx) return;
        
        // Ensure adjacent
        const x1 = lastIdx % this.gridSize;
        const y1 = Math.floor(lastIdx / this.gridSize);
        const x2 = idx % this.gridSize;
        const y2 = Math.floor(idx / this.gridSize);
        if (Math.abs(x1-x2) + Math.abs(y1-y2) === 1) {
          // If moving into empty or our own path
          if (!this.cells[idx] || (this.cells[idx].id === this.currentId && this.cells[idx].type !== 'dot')) {
             this.cells[idx] = { type: 'path', id: this.currentId, color: this.currentColor };
             this.currentPath.push(idx);
             this.render();
          } else if (this.cells[idx].id === this.currentId && this.cells[idx].type === 'dot' && idx !== this.currentPath[0]) {
             // Finished path!
             this.isDrawing = false;
             this.checkWin();
          } else {
             // Hit another color's path or dot, stop drawing
             this.isDrawing = false;
          }
        }
      };

      const endDraw = () => {
        this.isDrawing = false;
      };

      this.board.addEventListener('mousedown', startDraw);
      this.board.addEventListener('mousemove', moveDraw);
      window.addEventListener('mouseup', endDraw);
      
      this.board.addEventListener('touchstart', startDraw, {passive:false});
      this.board.addEventListener('touchmove', moveDraw, {passive:false});
      window.addEventListener('touchend', endDraw);
    }

    checkWin() {
      // Check if grid is full and all endpoints connected
      for(let i=0; i<this.cells.length; i++) {
        if(!this.cells[i]) return;
      }
      this.level++;
      setTimeout(() => this.initBoard(), 500);
    }
    
    destroy() { container.innerHTML = ''; }
  }

  // --- GAME 4: CASCADE (COLOR FLOOD) ---
  class CascadeGame {
    constructor() {
      this.level = 1;
      this.colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9'];
      this.initBoard();
    }

    initBoard() {
      container.innerHTML = '';
      this.gridSize = Math.min(14, 4 + this.level);
      this.maxMoves = Math.floor(this.gridSize * 1.5) + this.level;
      this.moves = 0;
      
      ui.textContent = `Cascade - Level ${this.level} (Moves: ${this.moves}/${this.maxMoves})`;
      instructions.textContent = "Flood fill starting from top-left";
      
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '20px';
      
      this.board = document.createElement('div');
      this.board.style.display = 'grid';
      this.board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
      this.board.style.gap = '1px';
      this.board.style.width = '80vmin';
      this.board.style.height = '80vmin';
      this.board.style.backgroundColor = '#1e293b';
      
      this.grid = [];
      for(let i=0; i<this.gridSize * this.gridSize; i++) {
        const c = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.grid.push(c);
        const cell = document.createElement('div');
        cell.style.backgroundColor = c;
        this.board.appendChild(cell);
      }
      
      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '10px';
      controls.style.justifyContent = 'center';
      
      this.colors.forEach(c => {
        const btn = document.createElement('button');
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.border = 'none';
        btn.style.backgroundColor = c;
        btn.style.cursor = 'pointer';
        btn.onclick = () => this.playMove(c);
        controls.appendChild(btn);
      });
      
      wrap.appendChild(this.board);
      wrap.appendChild(controls);
      container.appendChild(wrap);
    }

    playMove(newColor) {
      const oldColor = this.grid[0];
      if(oldColor === newColor) return; // No wasted moves
      
      this.moves++;
      ui.textContent = `Cascade - Level ${this.level} (Moves: ${this.moves}/${this.maxMoves})`;
      
      // Flood fill from (0,0)
      const visited = new Set();
      const stack = [0];
      
      while(stack.length > 0) {
        const curr = stack.pop();
        if(visited.has(curr)) continue;
        visited.add(curr);
        
        this.grid[curr] = newColor;
        this.board.children[curr].style.backgroundColor = newColor;
        
        const x = curr % this.gridSize;
        const y = Math.floor(curr / this.gridSize);
        
        if (x > 0 && this.grid[curr - 1] === oldColor) stack.push(curr - 1);
        if (x < this.gridSize - 1 && this.grid[curr + 1] === oldColor) stack.push(curr + 1);
        if (y > 0 && this.grid[curr - this.gridSize] === oldColor) stack.push(curr - this.gridSize);
        if (y < this.gridSize - 1 && this.grid[curr + this.gridSize] === oldColor) stack.push(curr + this.gridSize);
      }
      
      // Check win/loss
      const isWin = this.grid.every(c => c === newColor);
      if(isWin) {
        this.level++;
        setTimeout(() => this.initBoard(), 500);
      } else if (this.moves >= this.maxMoves) {
        ui.textContent = `Game Over. Resetting level...`;
        setTimeout(() => this.initBoard(), 1500);
      }
    }

    destroy() { container.innerHTML = ''; }
  }

  // --- API EXPORT ---
  root.CalmingGames = {
    start: function(gameType) {
      if(currentGame) currentGame.destroy();
      dialog.showModal();
      
      if(gameType === 'untangle') currentGame = new UntangleGame();
      if(gameType === 'cairn') currentGame = new CairnGame();
      if(gameType === 'flow') currentGame = new FlowGame();
      if(gameType === 'cascade') currentGame = new CascadeGame();
    },
    close: function() {
      if(currentGame) {
        currentGame.destroy();
        currentGame = null;
      }
      dialog.close();
    }
  };
})(window);
