function playAgain() {
    window.location.reload();
}
function backToHome() {
    window.location.href = 'home.html';
}
window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 500;
    let animationId = null;

    const gameState = JSON.parse(localStorage.getItem("gameState")) ?? {
        coins: 0,
        weapons: {
            basic: { owned: true, equipped: true, level: 1 },
            level2: { owned: false, equipped: false, level: 2 },
            level3: { owned: false, equipped: false, level: 3 },
        },
        currentWeapon: 'basic'
    };

    function endGame (score, isWin) {
        const coinsEarned = Math.floor(score / 10);
        gameState.coins += coinsEarned;

        const gameResultTitleEl = document.getElementById('gameResultTitle');
        const finalScoreEl = document.getElementById('finalScore');
        const coinsEarnedEL = document.getElementById('coinsEarned');
        
        gameResultTitleEl.innerHTML = isWin ? 'You Win! 🎉' : 'Game Over!';
        finalScoreEl.innerHTML = score;
        coinsEarnedEL.innerHTML = coinsEarned;
        document.getElementById('gameOverlay').classList.add('active');
        localStorage.setItem("gameState", JSON.stringify(gameState));

        // Stop animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    class InputHandler{
        constructor(game){
            this.game = game;
            window.addEventListener('keydown', e => {
                if ( ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) && this.game.keys.indexOf(e.key) === -1 ){
                    this.game.keys.push(e.key);
                }else if ( e.key === ' ' ) {
                    this.game.player.shootTop();
                }else if ( e.key === 'd' ) {
                    this.game.debug = !this.game.debug;
                }
            })
            window.addEventListener('keyup', e => {
                if ( this.game.keys.indexOf(e.key) > -1 ){
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }               
            })
        }
    }

    class Projectile{
        constructor(game, x, y){
            this.game = game;
            this.x = x;
            this.y = y;
            this.level = gameState.weapons[gameState.currentWeapon].level;
            this.baseWidth = 20;
            this.baseHeight = 15;
            this.width = this.baseWidth + this.level * 20;
            this.height = this.baseHeight + this.level * 10;
            this.speed = 3;   
            this.markForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 2;
            this.image = document.getElementById(`projectile`);
        }
        update(){
            this.x += this.speed;
            if ( this.x > this.game.width * 0.8 ) this.markForDeletion = true;
        }
        draw(context){
            context.fillStyle = 'yellow';
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            //194 412 662
            if (this.level === 1) {
                context.drawImage(this.image, 0, 0, 194, 107, 
                    this.x, this.y, this.width, this.height);
            } else if (this.level === 2) {
                context.drawImage(this.image, 194, 0, 218, 107, 
                    this.x, this.y, this.width, this.height);
            } else {
                context.drawImage(this.image, 412, 0, 250, 107, 
                    this.x, this.y, this.width, this.height);
                    console.log(this.level);
            }
            
        }
    }
    class Particle{

    }
    class Player{
        constructor(game){
            this.game = game;
            this.width = 120;
            this.height = 161;
            this.x = 20;
            this.y = 120;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 6;
            this.speedY = 0;
            this.maxSpeed = 4;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.frameTimer = 0;
            this.frameInterval = 200;
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
            this.projectileYOffset = 0.75;
            this.weaponlevel = 1;
        }
        update(deltaTime){
            if ( this.game.keys.includes('ArrowUp') ) this.speedY = -this.maxSpeed;
            else if ( this.game.keys.includes('ArrowDown') ) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;
            //handle projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            })
            this.projectiles = this.projectiles.filter(projectile => !projectile.markForDeletion);
            //sprite animation
            if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            //power up
            if (this.powerUp){
                if (this.powerUpTimer > this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    if (this.game.ammo < this.game.maxammo) this.game.ammo += 0.1;
                }
            }
        }
        draw(context){
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            })
        }
        shootTop(){
            if ( this.game.ammo > 0 ) {
                this.projectiles.push(new Projectile(this.game, this.x + this.width - 10, this.y + this.height * 0.88));
                this.game.ammo--;
            }
            if (this.powerUp) this.shootBottom();
        }
        shootBottom(){
            if ( this.game.ammo > 0 ) {
                this.projectiles.push(new Projectile(this.game, this.x + this.width - 10, this.y + this.height * 0.785));
                this.game.ammo--;
            }
        }
        enterPowerUp(){
            this.powerUpTimer = 0;
            this.powerUp = true;
            this.game.ammo = this.game.maxammo;
        }
    }
    class Enemy{
        constructor(game){
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.animationTimer = 0;
            this.animationInterval = 100;
        }
        update(deltaTime){
            this.x += this.speedX;
            if ( this.x + this.width < 0 ) this.markForDeletion = true;
            //sprite animation
            if ( this.animationTimer > this.animationInterval ) {
                this.animationTimer = 0;
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = 0;
            } else {
                this.animationTimer += deltaTime;
            }
        }
        draw(context){
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica'
            context.fillText(this.lives, this.x, this.y);
        }
    }

    class Tiger extends Enemy {
        constructor(game){
            super(game);
            this.image = document.getElementById('tiger');
            this.width = 290 * 0.8;
            this.height = 196 * 0.8;
            this.maxFrame = 3;
            this.lives = 14;
            this.score = this.lives;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
        }
        draw(context){
            // super.draw(context);
            context.drawImage(this.image, this.frameX * 290, 0, 290, 196, this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica'
            context.fillText(this.lives, this.x, this.y);
        }
    }

    class Chevrotain extends Enemy {
        constructor(game){
            super(game);
            this.image = document.getElementById('chevrotain');
            this.width = 165 * 0.5;
            this.height = 220 * 0.5;
            this.maxFrame = 5;
            this.lives = 16;
            this.score = this.lives;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
        }
        draw(context){
            // super.draw(context);
            context.drawImage(this.image, this.frameX * 165, 0, 165, 220, this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica'
            context.fillText(this.lives, this.x, this.y);
        }
    }

    class LuckyFish extends Enemy {
        constructor(game){
            super(game);
            this.image = document.getElementById('lucky');
            this.width = 99;
            this.height = 95;
            this.lives = 12;
            this.score = 20;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.frameY = Math.floor(Math.random() * 2);
            this.type = 'lucky';
        }
    }

    class Ghost extends Enemy {
        constructor(game){
            super(game);
            this.image = document.getElementById('ghost');
            this.width = 92;
            this.height = 93;
            this.lives = 12;
            this.score = 20;
            this.maxFrame = 4;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.type = 'lucky';
        }
        draw(context){
            // super.draw(context);
            context.drawImage(this.image, this.frameX * 184, this.frameY, 184, 186, this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica'
            context.fillText(this.lives, this.x, this.y);
        }
    }

    class Layer{
        constructor(game, image, speedModifier){
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 2187;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        update(){
            if(this.x <= -this.width) this.x = 0;
            else this.x -= this.game.speed * this.speedModifier;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y)
            context.drawImage(this.image, this.x + this.width - 1, this.y)
        }
    }

    class Background{
        constructor(game){
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.layer1 = new Layer(this.game, this.image1, 3);
            this.layers = [this.layer1];
        }
        update(){
            this.layers.forEach(layer => layer.update());
        }
        draw(context){
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class UI{
        constructor(game){
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Helvetica';
            this.color = 'yellow';
        }
        draw(context){
            context.save();
            context.fillStyle = this.color;
            context.shadowColor = 'black';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.font = this.fontSize + 'px ' + this.fontFamily;
            //timer
            let formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Time ' + formattedTime , 20, 100);
            //score
            context.fillText('Score: '+this.game.score ,20 ,40); 
            //ammo
            for (let i = 0; i < this.game.ammo; i++){
                context.fillRect(20 +5 * i, 50, 3, 20);
            }
            context.restore();
        }
    }
    class Game{
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.background = new Background(this); 
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.score = 0;
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.ammo = 10;
            this.maxammo = 12;
            this.ammoTimer = 0;
            this.ammoInterval = 500;
            this.gameOver = false;
            this.winningScore = 500;
            this.gameTime = 0;
            this.timeLimit = 90000;
            this.speed = 1;
            this.debug = false;
            this.playerLoaded = false;
        }
        update(deltaTime){
            if (!this.playerLoaded) {
                this.player.weaponlevel = gameState.weapons[gameState.currentWeapon].level;
                this.playerLoaded = true;
            }
            if (!this.gameOver) this.gameTime += deltaTime;
            if (this.gameTime > this.timeLimit && !this.gameOver) {
                this.gameOver = true;
                endGame(this.score, false);
                return;
            }
            this.background.update();
            this.player.update(deltaTime);
            if (this.ammoTimer > this.ammoInterval){
                if (this.ammo < this.maxammo) this.ammo++;
                this.ammoTimer = 0;
            }else{
                this.ammoTimer += deltaTime;
            }
            
            
            this.enemies.forEach((enemy)=>{
                enemy.update(deltaTime);
                if (this.checkCollision(this.player, enemy)){
                    enemy.markForDeletion = true;
                }
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollision(projectile, enemy)){
                        enemy.lives -= this.player.weaponlevel * 2;
                        projectile.markForDeletion = true;
                        if (enemy.lives <=0) {
                            enemy.markForDeletion = true;
                            if (enemy.type == 'lucky') this.player.enterPowerUp();
                            if (!this.gameOver) this.score += enemy.score;
                            if (this.score >= this.winningScore) {
                                this.gameOver = true;
                                endGame(this.score, true);
                                return;
                            }
                        }
                    }
                }
                )
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markForDeletion);
            if (this.enemyTimer > this.enemyInterval && !this.gameOver){
                this.addEnemy();
                console.log('add enemy');
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime
            }
            // console.log(this.deltaTime);
            
        }
        draw(context){
            this.background.draw(context);
            this.player.draw(context);
            this.ui.draw(context);
            this.enemies.forEach((enemy)=>{
                enemy.draw(context);
            });
        }
        addEnemy(){
            const randomize = Math.random();
            if (randomize < 0.4) this.enemies.push(new Tiger(this));
            else if (randomize < 0.8) this.enemies.push(new Chevrotain(this));
            else this.enemies.push(new Ghost(this));
            // console.log(this.enemies);
        }
        checkCollision(rect1, rect2){
            return (rect1.x < rect2.x + rect2.width &&
                    rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height &&
                    rect1.y + rect1.height > rect2.y)
        }
    }
    
    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    //animate loop
    function animate(timestamp){
        const deltaTime = timestamp - lastTime
        lastTime = timestamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        animationId = requestAnimationFrame(animate);
    }
    animate(0);
});