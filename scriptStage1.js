  function backToHome() {
            window.location.href = "home.html";
        }
function playAgain() {
    window.location.reload();
}
function backToHome() {
    window.location.href = 'home.html';
}
window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext("2d");
    canvas.width = 1500;
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
            window.addEventListener('keydown',(e)=>{
                if((e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.game.keys.indexOf(e.key) === -1){
                    this.game.keys.push(e.key);
                }else if(e.key === ' '){
                    this.game.player.shootTop();
                }else if(e.key === 'd'){
                    this.game.debug = !this.game.debug;
                }
                // console.log(this.game.keys);
            });
            window.addEventListener('keyup', (e)=>{
                if(this.game.keys.indexOf(e.key) > -1){
                    this.game.keys.splice(this.game.keys.indexOf(e.key),1);
                }
                // console.log(this.game.keys);
            })
        }
    }
    class Projectile{
        constructor(game,x,y){
            this.game = game;
            this.level = gameState.weapons[gameState.currentWeapon].level;
            this.x = x;
            this.y = y;
            this.baseWidth = 20;
            this.baseHeight = 15;
            this.width = this.baseWidth + this.level * 20;
            this.height = this.baseHeight + this.level * 10;
            this.speed = 3;
            this.markedForDeletion = false;
            this.image = document.getElementById("projectile");
        }
        update(){
            this.x += this.speed;
            if(this.x > this.game.width *0.8) { this.markedForDeletion = true;}
        }
        draw(context){
            if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
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
    class Player{
        constructor(game){
            this.game = game;
            this.width = 120;
            this.height = 161;
            this.x = 20;
            this.y = 100;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 6;
            this.speedY = 0;
            this.maxSpeed = 2;
            this.projectiles = [];
            this.image = document.getElementById("player");
            this.frameTimer = 0;
            this.frameInterval = 200; 
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
            this.weaponlevel = gameState.weapons[gameState.currentWeapon].level
        }
        update(deltaTime){
            if(this.game.keys.includes('ArrowUp')) {this.speedY = -this.maxSpeed}
            else if(this.game.keys.includes('ArrowDown')) {this.speedY = this.maxSpeed}
            else this.speedY = 0;
            this.y += this.speedY;
            // handle projectiles
            this.projectiles.forEach(projectile =>{
                projectile.update();
            });
           this.projectiles = this.projectiles.filter(projectile =>
                !projectile.markedForDeletion
           );
           //sprite animation
           if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            //power up
            if(this.powerUp){
                if(this.powerUpTimer>this.powerUpLimit){
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                }else{
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    if (this.game.ammo < this.game.maxammo) this.game.ammo += 0.1;
                }
            }
        }
        draw(context){
            if(this.game.debug) context.strokeRect(this.x,this.y,this.width,this.height);
            this.projectiles.forEach(projectile =>{
                projectile.draw(context);
            })
            context.drawImage(this.image,this.frameX * this.width,this.frameY*this.height,this.width,this.height,this.x,this.y,this.width,this.height);
        }
        shootTop(){
            if (this.game.ammo > 0){
                this.projectiles.push(new Projectile(this.game,this.x+80,this.y+100));
                // console.log(this.projectiles);
                this.game.ammo--;
            }
            if(this.powerUp) this.shootBottom();
        }
        shootBottom(){
            if (this.game.ammo > 0){
                this.projectiles.push(new Projectile(this.game,this.x+80,this.y+150));
                // console.log(this.projectiles);
                this.game.ammo--;
            }
        }
        enterPowerUp(){
            this.powerUpTimer = 0;
            this.powerUp = true;
            this.game.ammo = this.game.maxAmmo;
        }
    }
    class Enemy{
        constructor(game){
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.frameTimer = 0;
        }
        update(deltaTime){
            this.x += this.speedX-this.game.speed;
            if(this.x + this.width < 0){this.markedForDeletion = true}
            if (this.frameTimer > this.frameInterval) {
                this.frameTimer = 0;
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = 0;
            } else {
                this.frameTimer += deltaTime;
            }
        }
        draw(context){
            if(this.game.debug)context.strokeRect(this.x,this.y,this.width,this.height);
            context.drawImage(this.image,this.frameX*this.width,this.frameY*this.height,this.width,this.height,this.x,this.y,this.width,this.height);
            context.font = '20px Helvetica';
            context.fillStyle = "tomato";
            context.fillText(this.lives,this.x,this.y);
        }
    }

    class MiniDragon extends Enemy{
        constructor(game){
            super(game);
            this.width = 200;
            this.height =270;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById("miniDragon");
            this.lives = 10;
            this.score = this.lives;
            this.maxFrame = 5;
            this.frameInterval = 110;
        }
    }
    class BigDragon extends Enemy{
        constructor(game){
            super(game);
            this.width = 250;
            this.height =221;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById("bigDragon");
            this.lives = 15;
            this.score = this.lives;
            this.maxFrame = 11;
            this.frameInterval = 200;
        }
    }
    class DarkAngle extends Enemy{
        constructor(game){
            super(game);
            this.width = 185;
            this.height =200;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.image = document.getElementById("darkAngle");
            this.lives = 5;
            this.score = 15;
            this.maxFrame = 7;
            this.frameInterval = 150;
            this.type = 'lucky';
        }
    }

    class Layer{
        constructor(game, image, speedModifier){
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        update(){
            if(this.x <= -this.width) {this.x = 0;}
            this.x -= this.game.speed * this.speedModifier;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y);
            context.drawImage(this.image, this.x+this.width, this.y);
        }
    }
    class Background{
        constructor(game){
            this.game = game;
            this.image8 = document.getElementById('layer8');
            this.layer8 = new Layer(this.game,this.image8,0.4);
            this.layers = [this.layer8];
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
            this.fontFamily = 'Bangers';
            this.color = 'white';
        }
        draw(context){
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;
            // score
            context.fillText('Score: ' + this.game.score,20,40);
            // timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer:' + formattedTime ,20, 100);
            // ammo
            if(this.game.player.powerUp) context.fillStyle = "#38bab2";
            for(let i = 0; i< this.game.ammo; i++ ){
                context.fillRect(20+5*i,50,3,20);
            }
            context.restore();
        }
    }
    class Game{
        constructor(width,height){
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.enemies = [];
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.keys = [];
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 500;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 2000;
            this.gameTime = 0;
            this.timeLimit = 200000;
            this.speed = 1;
            this.debug = false;
        }
        update(deltaTime){
            if(!this.gameOver) {this.gameTime += deltaTime;}
            if(this.gameTime > this.timeLimit && !this.gameOver){
                this.gameOver = true;
                endGame(this.score, false);
                return;
            }
            this.background.update();
            this.player.update(deltaTime);
            if(this.ammoTimer > this.ammoInterval){
                if(this.ammo < this.maxAmmo) {this.ammo++;}
                this.ammoTimer = 0;
            }else{
                this.ammoTimer += deltaTime;
            }
            this.enemies.forEach(enemy=>{
                enemy.update(deltaTime);
                if(this.checkCollision(this.player,  enemy)){
                    enemy.markedForDeletion = true;
                }
                this.player.projectiles.forEach( projectile =>{
                    if(this.checkCollision(projectile,enemy)){
                        enemy.lives -= this.player.weaponlevel ;
                        projectile.markedForDeletion = true;
                        if(enemy.lives <= 0){
                            enemy.markedForDeletion = true;
                            if (enemy.type == 'lucky') this.player.enterPowerUp();
                            if(!this.gameOver) {this.score += enemy.score};
                            if(this.score >= this.winningScore && !this.gameOver){
                                this.gameOver = true;
                                endGame(this.score, true);
                                return;
                            }
                        }
                    }
                });
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if(this.enemyTimer > this.enemyInterval && !this.gameOver){
                this.addEnemy();
                this.enemyTimer = 0;
            }else{
                this.enemyTimer += deltaTime;
            }
        }
        draw(context){
            this.background.draw(context);
            this.player.draw(context);
            this.ui.draw(context);
            this.enemies.forEach(enemy=>{
                enemy.draw(context);
            });
        }
        addEnemy(){
            const randomize =Math.random();
            if(randomize < 0.3){
                this.enemies.push(new MiniDragon(this));
            }else if(randomize <0.6){
                this.enemies.push(new DarkAngle(this));
            }else{
                this.enemies.push(new BigDragon(this));
            }
            
            console.log(this.enemies);
        }
        checkCollision(rect1,rect2){
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height+rect1.y  > rect2.y
            )
        }
    }
    const game = new Game(canvas.width,canvas.height);
    let lastTime = 0;
    // animation loop
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        // console.log(deltaTime);
        lastTime = timeStamp;
        ctx.clearRect(0,0, canvas.width,canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate(0);
});