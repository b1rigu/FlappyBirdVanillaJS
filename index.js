const physicsFPS = 60;
const canvasWidth = 1024;
const canvasHeight = 576;
const tolerance = 8;
const jumpVelocity = -15;

const mainCanvas = document.querySelector("canvas");
mainCanvas.width = canvasWidth;
mainCanvas.height = canvasHeight;
const mainContext = mainCanvas.getContext("2d", { alpha: false });
mainContext.imageSmoothingEnabled = false;
const backgroundCanvas = document.createElement("canvas");
backgroundCanvas.width = canvasWidth;
backgroundCanvas.height = canvasHeight;
const backgroundContext = backgroundCanvas.getContext("2d", { alpha: false });
backgroundContext.imageSmoothingEnabled = false;

const pauseMenu = document.getElementById("pauseMenu");

const backgroundImage = createImage("./flappyback.png");
const avatarImage = createImage("./flappy.png");

class Obstacle {
    constructor({ positionX, heightTop, gap }) {
        this.width = 50;
        this.positionX = positionX;
        this.heightTop = heightTop;
        this.gap = gap;
        this.positionYBottom = this.heightTop + this.gap;
        this.heightBottom =
            this.positionYBottom >= canvasHeight ? 0 : canvasHeight - this.positionYBottom;
        this.alreadyGotPoint = false;
    }

    draw() {
        backgroundContext.fillStyle = "#4ae502";
        backgroundContext.strokeStyle = "black";
        backgroundContext.lineWidth = 5;
        backgroundContext.stroke;
        backgroundContext.beginPath();
        backgroundContext.rect(this.positionX, 0, this.width, this.heightTop);
        backgroundContext.fill();
        backgroundContext.stroke();
        backgroundContext.closePath();
        backgroundContext.beginPath();
        backgroundContext.rect(
            this.positionX,
            this.heightTop + this.gap,
            this.width,
            this.heightBottom
        );
        backgroundContext.fill();
        backgroundContext.stroke();
        backgroundContext.closePath();
    }

    update() {
        this.positionX -= obstacleVel;
    }
}

class Bird {
    constructor() {
        this.position = {
            x: 100,
            y: 200,
        };
        this.size = 30;
        this.velocityY = 0;
        this.gravity = 1;
        this.maxYVelocity = 18;
    }

    update() {
        this.position.y += this.velocityY;
        if (this.velocityY <= this.maxYVelocity) {
            this.velocityY += this.gravity;
        }
    }

    draw() {
        backgroundContext.drawImage(
            avatarImage,
            this.position.x,
            this.position.y,
            this.size,
            this.size
        );
    }
}

function createImage(path) {
    const image = new Image();
    image.src = path;
    return image;
}

let msPrevs = {};
function canRunLoop(fps, id) {
    if (!(id.toString() in msPrevs)) {
        msPrevs[id.toString()] = performance.now();
    }
    const msPerFrame = 1000 / fps;

    const msNow = performance.now();
    const msPassed = msNow - msPrevs[id.toString()];

    if (msPassed < msPerFrame) return false;

    const excessTime = msPassed % msPerFrame;
    msPrevs[id.toString()] = msNow - excessTime;

    return true;
}

function randomNumber(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

function drawScore() {
    backgroundContext.fillStyle = "black";
    backgroundContext.font = "20px sans-serif";

    var textString = `Score: ${score}`,
        textWidth = backgroundContext.measureText(textString).width;

    backgroundContext.fillText(textString, canvasWidth / 2 - textWidth / 2, 25);
}

function isRectangularsColliding({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x < rectangle2.position.x + rectangle2.width - tolerance &&
        rectangle1.position.x + rectangle1.width - tolerance > rectangle2.position.x &&
        rectangle1.position.y < rectangle2.position.y + rectangle2.height - tolerance &&
        rectangle1.position.y + rectangle1.height - tolerance > rectangle2.position.y
    );
}

function createObstacle() {
    let lastPosX = 0;
    if (obstacles.length > 0) {
        lastPosX = obstacles[obstacles.length - 1].positionX;
    }
    const gap = randomNumber(150, 250);
    return new Obstacle({
        positionX: lastPosX + randomNumber(300, 500),
        heightTop: randomNumber(50, canvasHeight - gap),
        gap: gap,
    });
}

function mainLoop() {
    timer = requestAnimationFrame(mainLoop);

    if (isGamePaused) return;

    animationLoop();

    if (!canRunLoop(physicsFPS, 0)) return;

    physicsLoop();
}

function animationLoop() {
    backgroundContext.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

    bird.draw();
    obstacles.forEach((obstacle) => obstacle.draw());
    drawScore();

    mainContext.drawImage(backgroundCanvas, 0, 0);
}

function physicsLoop() {
    obstacles.forEach((obstacle) => obstacle.update());

    if (bird.position.y - tolerance < 0 && bird.velocityY < 0) {
        bird.velocityY = 0;
    }

    if (bird.position.y + bird.size - tolerance > canvasHeight) {
        initGame();
    }

    bird.update();

    if (obstacles.length > 0) {
        const playerObj = {
            position: bird.position,
            width: bird.size,
            height: bird.size,
        };

        const firstObstacleOutOfScreenCheck = isRectangularsColliding({
            rectangle1: {
                position: {
                    x: obstacles[0].width * -1 * 2,
                    y: 0,
                },
                width: obstacles[0].width,
                height: canvasHeight,
            },
            rectangle2: {
                position: {
                    x: obstacles[0].positionX,
                    y: 0,
                },
                width: obstacles[0].width,
                height: canvasHeight,
            },
        });

        if (firstObstacleOutOfScreenCheck) {
            obstacles.splice(0, 1);
            obstacles.push(createObstacle());
        }

        obstacles.forEach((obstacle, index) => {
            if (index < 2) {
                const middleCollision = isRectangularsColliding({
                    rectangle1: playerObj,
                    rectangle2: {
                        position: {
                            x: obstacle.positionX,
                            y: obstacle.heightTop,
                        },
                        width: obstacle.width,
                        height: obstacle.gap,
                    },
                });

                if (middleCollision && !obstacle.alreadyGotPoint) {
                    obstacle.alreadyGotPoint = true;
                    score++;
                    if (score % 10 == 0) {
                        obstacleVel += 0.25;
                    }
                }

                const topCollision = isRectangularsColliding({
                    rectangle1: playerObj,
                    rectangle2: {
                        position: {
                            x: obstacle.positionX,
                            y: 0,
                        },
                        width: obstacle.width,
                        height: obstacle.heightTop,
                    },
                });

                const bottomCollision = isRectangularsColliding({
                    rectangle1: playerObj,
                    rectangle2: {
                        position: {
                            x: obstacle.positionX,
                            y: obstacle.positionYBottom,
                        },
                        width: obstacle.width,
                        height: obstacle.heightBottom,
                    },
                });

                if (topCollision || bottomCollision) {
                    initGame();
                }
            }
        });
    }
}

let bird = new Bird();
let obstacles = [
    new Obstacle({
        positionX: 0,
        heightTop: 0,
        gap: 0,
    }),
];
let obstacleVel = 4;
let score = 0;
let alreadyAddedVel = false;
let timer;
let isGamePaused = false;

function initGame() {
    bird = new Bird();
    score = 0;
    obstacles = [];
    for (let i = 0; i < 4; i++) {
        obstacles.push(createObstacle());
    }
    obstacleVel = 4;
    cancelAnimationFrame(timer);
    mainLoop();
}

initGame();

let jumpPressed = false;

document.addEventListener("keydown", (event) => {
    event.preventDefault();
    switch (event.code.toLowerCase()) {
        case "keyw":
        case "space":
            if (!jumpPressed) {
                jumpPressed = true;
                bird.velocityY = jumpVelocity;
            }
            break;
        case "escape":
            isGamePaused = !isGamePaused;
            if (isGamePaused) {
                pauseMenu.style.display = "flex";
            } else {
                pauseMenu.style.display = "none";
            }
            break;
    }
});

document.addEventListener("keyup", (event) => {
    event.preventDefault();
    switch (event.code.toLowerCase()) {
        case "keyw":
        case "space":
            jumpPressed = false;
            break;
    }
});
