// Constants
const CELL_SIZE = 20;
const COLS = 30;
const ROWS = 30;
const FPS = 10;
const GAME_OFFSET = 0;  // Left panel starts at 0
const VISUALIZATION_OFFSET = COLS * CELL_SIZE + 40;  // Right panel starts after game panel + margin

// Colors
const COLORS = {
    WHITE: '#FFFFFF',
    GREEN: '#00FF00',
    RED: '#FF0000',
    BLACK: '#000000',
    GRAY: '#808080',
    YELLOW: '#FFFF00',
    BLUE: '#0000FF',
    ORANGE: '#FFA500'
};

// Game state
let snake = [{x: 5, y: 5}];
let direction = {x: 1, y: 0};
let food = null;
let score = 0;
let algorithm = "BFS";
let mode = "manual";
let difficultyLevel = 1;
let obstacles = new Set();
let gameLoop;
let path = [];
let visitedNodes = new Set();

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize game
function init() {
    spawnFood();
    addObstacles(10);
    updateInfo();
    if (mode === "auto") {
        path = findPath();
    }
    gameLoop = setInterval(update, 1000 / FPS);
}

// Spawn food in random location
function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (isCollision(food) || isObstacle(food));
}

// Add obstacles
function addObstacles(num) {
    for (let i = 0; i < num; i++) {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS)
            };
        } while (isCollision(pos) || isObstacle(pos) || (pos.x === food.x && pos.y === food.y));
        obstacles.add(`${pos.x},${pos.y}`);
    }
}

// Check if position collides with snake
function isCollision(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// Check if position is obstacle
function isObstacle(pos) {
    return obstacles.has(`${pos.x},${pos.y}`);
}

// Update game state
function update() {
    if (mode === "auto" && path.length > 0) {
        const next = path.shift();
        direction = {
            x: next.x - snake[0].x,
            y: next.y - snake[0].y
        };
    }

    // Move snake
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check collision with walls or self
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        isCollision(head) || isObstacle(head)) {
        resetGame();
        return;
    }

    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateInfo();
        spawnFood();
        if (score % 10 === 0) {
            difficultyLevel++;
            addObstacles(5);
        }
        if (mode === "auto") {
            path = findPath();
        }
    } else {
        snake.pop();
    }

    draw();
}

// Draw game state
function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw both grids
    drawGrid(GAME_OFFSET);
    drawGrid(VISUALIZATION_OFFSET);

    // Draw game elements on left panel
    drawGameElements(GAME_OFFSET);

    // Draw visualization on right panel
    drawVisualization(VISUALIZATION_OFFSET);
}

// Draw grid at specified offset
function drawGrid(offset) {
    ctx.strokeStyle = '#333';
    for (let x = 0; x < COLS * CELL_SIZE; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, ROWS * CELL_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y < ROWS * CELL_SIZE; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(offset, y);
        ctx.lineTo(COLS * CELL_SIZE + offset, y);
        ctx.stroke();
    }
}

// Draw game elements (snake, food, obstacles)
function drawGameElements(offset) {
    // Draw obstacles
    ctx.fillStyle = COLORS.GRAY;
    obstacles.forEach(obs => {
        const [x, y] = obs.split(',');
        ctx.fillRect(parseInt(x) * CELL_SIZE + offset, parseInt(y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw snake
    ctx.fillStyle = COLORS.GREEN;
    snake.forEach(segment => {
        ctx.fillRect(segment.x * CELL_SIZE + offset, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw food
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(food.x * CELL_SIZE + offset, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// Draw visualization panel
function drawVisualization(offset) {
    // Draw visited nodes
    ctx.fillStyle = COLORS.BLUE;
    ctx.globalAlpha = 0.3;
    visitedNodes.forEach(node => {
        const [x, y] = node.split(',');
        ctx.fillRect(parseInt(x) * CELL_SIZE + offset, parseInt(y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw current path
    if (mode === "auto" && path.length > 0) {
        ctx.fillStyle = COLORS.YELLOW;
        ctx.globalAlpha = 0.5;
        path.forEach(pos => {
            ctx.fillRect(pos.x * CELL_SIZE + offset, pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });
    }
    ctx.globalAlpha = 1;

    // Draw current snake and food position for reference
    drawGameElements(offset);
}

// BFS pathfinding algorithm
function bfs() {
    const queue = [{pos: snake[0], path: []}];
    visitedNodes = new Set();
    visitedNodes.add(`${snake[0].x},${snake[0].y}`);

    while (queue.length > 0) {
        const {pos, path} = queue.shift();
        
        if (pos.x === food.x && pos.y === food.y) {
            return path;
        }

        // Check all four directions
        [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}].forEach(dir => {
            const next = {
                x: pos.x + dir.x,
                y: pos.y + dir.y
            };

            const key = `${next.x},${next.y}`;
            if (next.x >= 0 && next.x < COLS && next.y >= 0 && next.y < ROWS &&
                !visitedNodes.has(key) && !isCollision(next) && !isObstacle(next)) {
                visitedNodes.add(key);
                queue.push({
                    pos: next,
                    path: [...path, next]
                });
            }
        });
    }
    return [];
}

// Find path using current algorithm
function findPath() {
    switch(algorithm) {
        case "BFS":
            return bfs();
        default:
            return bfs();
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (mode !== "manual") return;

    switch(e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = {x: 0, y: -1};
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = {x: 1, y: 0};
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = {x: -1, y: 0};
            break;
    }
});

// Toggle between manual and auto mode
function toggleMode() {
    mode = mode === "manual" ? "auto" : "manual";
    if (mode === "auto") {
        path = findPath();
    }
}

// Switch pathfinding algorithm
function switchAlgorithm() {
    algorithm = algorithm === "BFS" ? "A*" : "BFS";
    document.getElementById('algorithm').textContent = algorithm;
    if (mode === "auto") {
        path = findPath();
    }
}

// Update info display
function updateInfo() {
    document.getElementById('score').textContent = score;
    document.getElementById('difficulty').textContent = difficultyLevel;
}

// Reset game
function resetGame() {
    clearInterval(gameLoop);
    snake = [{x: 5, y: 5}];
    direction = {x: 1, y: 0};
    score = 0;
    difficultyLevel = 1;
    obstacles.clear();
    path = [];
    visitedNodes.clear();
    init();
}

// Start the game
init(); 
