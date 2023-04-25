"use strict";

const GAME = new function(){
    let GAME = this;
    let lastSpawned = Date.now(), spawnInterval;
    let canvas, context;
    let height, width;
    let objects = [];
    let objects_count = 0;
    let down_keys = [];
    let backgroundImage;
    let enemyImage, playerImage, bulletImage;
    let player;
    let bDeltaY = -800;
    let reloadTimer = 0;

    let scoreLabel,score =0;

    let GameOver = false;

    let enemy_ai = (object) =>{

        if(object.y>450){
            object.destroy();
            return;
        }

        object.y+=object.speed;
        let timeNow = Date.now();
        object.acceleration = object.power/object.mass;

        if(object.power<object.maxPower) object.power+=object.powerAcceleration * (timeNow - object.lastProcessedTime);

        object.speed += object.acceleration*(timeNow - object.lastProcessedTime);
        object.lastProcessedTime = timeNow;

        if(object.intersect(player)){
            player.destroy();
            GAME.EndGame();
        }
    };

    let fire = (x,y) =>{
                if (reloadTimer > 30){
                    GAME.NewObject('bullet',x,y,6,30,bulletImage,bullet_controller);
                    reloadTimer = 0;
                };
            };

    let bullet_controller = (object) =>{
        object.y -=5;
        if(object.y+object.height <0){
            object.destroy();
            return;
        }
        

        for(let i = 0;i<objects.length;i++){
            if(object.intersect(objects[i])){
                if(objects[i].type=='enemy'){
                    objects[i].destroy();
                    object.destroy();
                    score++;
                }
                break;
            }
        }
    };
    let player_controller = (object) =>{
        
        let timeNow = Date.now();

        object.acceleration = 0.5;
        let deceleration = 0.25;

        if(GAME.Key('KeyA')){
            if(object.leftSpeed<object.maxSpeed)
            object.leftSpeed+=object.acceleration;
            if(object.x<0)
                object.leftSpeed = 0;
        } else {
            if(object.leftSpeed>0){
                object.leftSpeed-=deceleration;
            }
        }
            
        if(GAME.Key('KeyD')){
            if(object.rightSpeed<object.maxSpeed)
            object.rightSpeed+=object.acceleration;
            if(object.x>(width-object.width))
                object.rightSpeed = 0;
        } else {
            if(object.rightSpeed>0){
                object.rightSpeed-=deceleration;

            }
        }

        if(GAME.Key('KeyW')){
            if(object.upSpeed<object.maxSpeed)
            object.upSpeed+=object.acceleration;
            if(object.y<0)
                object.upSpeed =0;
        } else {
            if(object.upSpeed>0){
                object.upSpeed-=deceleration;
            }
        }

        if(GAME.Key('KeyS')){
            if(object.downSpeed<object.maxSpeed)
            object.downSpeed+=object.acceleration;
            if(object.y>(height-object.height))
                object.downSpeed =0;
        } else {
            if(object.downSpeed>0){
                object.downSpeed-=deceleration;
            }
        }
        
        if(GAME.Key('Space')){
            console.log('fire');
            fire(object.x+21, object.y);
        }
        
        reloadTimer++;
        object.x+=object.rightSpeed-object.leftSpeed;
        object.y+=object.downSpeed-object.upSpeed;
        // if(SPIN.key('Space'))
        // fire(node.x+20, node.y);
    };

    class GameObject{
        constructor(type,x,y,width,height,imageBitmap, updateFunction){
            this.type = type;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;

            
            this.speed =0;
            this.mass = 10000;
            this.power = 0;
            this.acceleration = 0;
            this.maxPower = 1000;
            this.powerAcceleration = 0.01;

            this.rightSpeed =0;
            this.leftSpeed =0;
            this.upSpeed =0;
            this.downSpeed =0;

            this.maxSpeed = 10;

            this.lastProcessedTime = Date.now();
            this.id = objects_count++;
            this.image = imageBitmap;
            this._update = updateFunction;
            objects.push(this);
            this.Destroyed = false;
        }
        update(){
            if(this._update)
            this._update(this);
        }
        draw(){
            context.drawImage(this.image,this.x,this.y);
        }
        destroy(){
            this.Destroyed = true;
        }
        intersect(object){
            return !((this.x+this.width<object.x)||(this.x>object.x+object.width)||(this.y+this.height<object.y)||(this.y>object.y+object.height));
        }
    }
    GAME.NewObject = (type,x,y,w,h,image, update) => {
        if (image instanceof ImageBitmap) {
            return new GameObject(type,x, y, w, h, image, update);
        } else {
            throw new Error('The image argument is not an ImageBitmap');
        }
    };
    GAME.UpdateBackground = () =>{
        context.clearRect(0,0,width,height);
        context.drawImage(backgroundImage,0,bDeltaY);
        bDeltaY+=1;
        if(bDeltaY>-1) bDeltaY=-800;
        scoreLabel.innerHTML = "SCORE:"+score;
    };
    GAME.EndGame = ()=>{
        GameOver = true;
        scoreLabel.innerHTML = 'GAME OVER!';

        context.clearRect(0,0,width,height);
        context.font = "24px serif";
        context.fillStyle = 'white';
        context.fillText("Your score:"+score+". Press 'Space' to restart", 125, 200);
    };
    GAME.Restart = () =>{
        GameOver = false;
        objects.splice(0,objects.length);
        objects_count = 0;
        bDeltaY = -800;
        reloadTimer = 0;
        score =0;

        player = GAME.NewObject('player', 300, 350, 50, 50, playerImage, player_controller);
        GAME.Update();
    };

    GAME.Update = ()=>{
        if(!GameOver){
            GAME.UpdateBackground();
                for(let i=objects.length-1; i>=0; i--){
                    if(objects[i].Destroyed){
                        objects.splice(i,1);
                        continue;
                    }
                    objects[i].update();
                    objects[i].draw();
                }
                function getRandomInt(max) {
                    return Math.floor(Math.random() * max);
                  }

                if(objects.length<10){
                    if(Date.now()-lastSpawned>spawnInterval){
                        GAME.SpawnEnemy(getRandomInt(550),-50);
                    }
                };

                requestAnimationFrame(GAME.Update);
        }                
    };

    GAME.Key = (key) =>{
                return down_keys[key];
            };

    GAME.SpawnEnemy = (x,y)=>{
        GAME.NewObject('enemy',x,y,50,50, enemyImage, enemy_ai);
        lastSpawned = Date.now();
    };

    GAME.Start = (W,H, background, playerImg, enemyImg, bulletImg)=>{
        canvas = document.getElementById('cnv');
        context  = canvas.getContext('2d');
        scoreLabel = document.getElementById('score');
        backgroundImage = background;
        playerImage = playerImg;
        enemyImage = enemyImg;
        bulletImage = bulletImg;
        width = W;
        height = H;
        canvas.width = W;
        canvas.height = H;

        window.addEventListener('keydown', (e)=>{
            down_keys[e.code] = true;

            if(e.code=='Space' && GameOver){
                GAME.Restart();
            }
        });
        window.addEventListener('keyup', (e)=>{
            delete down_keys[e.code];
        });

        spawnInterval = 1500;

        player = GAME.NewObject('player', 300, 350, 50, 50, playerImage, player_controller);
        
        GAME.Update();
};
};

window.addEventListener('load', function(){
    let image = new Image();
    image.src = 'img/image.png';

    image.onload = () => {
        Promise.all([
          createImageBitmap(image, 0, 0, 600, 1200),
          createImageBitmap(image, 600, 0, 50, 50),
          createImageBitmap(image, 600, 50, 50, 50),
          createImageBitmap(image, 600, 100, 6, 30)
        ]).then((sprites) => {
          GAME.Start(600,400, sprites[0], sprites[1], sprites[2], sprites[3]);
        });
      };
});
