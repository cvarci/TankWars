class Tutorial extends Phaser.Scene {
    
    /**@type {Phaser.Tilemaps.Tilemap}*/
    map
    /** @type {Phaser.Tilemaps.TilemapLayer} */
    destructLayer
    /** @type {PlayerTank} */
    player
    /** @type {Array.<EnemyTank>} */
    enemyArray = []
    /** @type {Phaser.Physics.Arcade.Group} */
    playerBullets
    /** @type {Phaser.Physics.Arcade.Group} */
    enemyBullets
    /** @type {Phaser.GameObjects.Group} */
    explosions
    /** @type {Phaser.GameObjects.Image} */
    healthBar
    /** @type {Phaser.GameObjects.Image} */
    bulletBar
    /** @type {Phaser.GameObjects.Sprite} */
    crosshair
    /** @type {Phaser.GameObjects.Text} */
    Remaining

    enemiesLeft = 0
    constructor(){
        super('Tutorial')
    }
    preload() {
        this.load.image('bullet','assets/tanks/bullet.png')
        this.load.atlas('tank','assets/tanks/newTank.png','assets/tanks/newTanks.json')
        this.load.atlas('enemy','assets/tanks/enemy-tanks.png','assets/tanks/newTanks.json')
        this.load.atlas('boss','assets/tanks/boss-tanks.png','assets/tanks/newTanks.json')
        this.load.image('tileset','assets/tanks/landscape-tileset.png')
        this.load.tilemapTiledJSON('tilemap','assets/maps/tutorial.json')
        this.load.spritesheet('explosion','assets/tanks/explosion_c.png',{
            frameWidth: 64,
            frameHeight: 64,
        })
        this.load.spritesheet('health-bar','assets/tanks/Health-bar.png',{
            frameWidth: 65,
            frameHeight: 144
        })
        this.load.spritesheet('bullet-bar','assets/tanks/Bullet-count.png',{
            frameWidth: 80,
            frameHeight: 164
        })
        this.load.spritesheet('cooldown','assets/tanks/cooldown.png',{
            frameWidth: 51,
            frameHeight: 13
        })

    }
    create() {
        //Init Level
        this.map = this.make.tilemap({key:'tilemap'})
        const landscape = this.map.addTilesetImage('Environment','tileset')
        this.map.createLayer('backgroundLayer',[landscape],0,0)
        this.destructLayer =this.map.createLayer('destructableLayer',[landscape],0,0)
        this.destructLayer.setCollisionByProperty({collide:true})
        const objectLayer = this.map.getObjectLayer('objectLayer')
        //Bullet INIT
        this.enemyBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        })
        this.playerBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 5
            
        })

        //UI
        this.healthBar = this.add.image(780,550,'health-bar',0).setScrollFactor(0).setDepth(10)
        this.bulletBar = this.add.image(60,540,'bullet-bar',0).setScrollFactor(0).setDepth(10)
        this.crosshair = this.add.sprite(416,320,'cooldown',16).setScrollFactor(0).setDepth(10)
        this.Remaining = this.add.text(20,20,"Enemies Remaining: "+this.enemiesLeft,{
            fontFamily:'CustomFont',
            fontSize: '22px'
        }).setScrollFactor(0)

        //Tutorial
        this.add.text(20,150,"Break out of your cage with LMB.",{
            fontFamily:'CustomFont',
            fontSize: '17px'
        })
        this.add.text(745,130,"Kill enemies and avoid",{
            fontFamily:'CustomFont',
            fontSize: '17px',
        })
        this.add.text(815,155,"taking damage.",{
            fontFamily:'CustomFont',
            fontSize: '17px',
        })
        this.add.text(700,470,"Kill all enemies to move on",{
            fontFamily:'CustomFont',
            fontSize: '17px',
        })
        let enemyObjects = []
        let actor
        objectLayer.objects.forEach(function(object){
            actor = Utils.RetrieveCustomProperties(object)
            if(actor.type == 'playerSpawn'){
                this.createPlayer(actor)
            }else if(actor.type == 'enemySpawn'|| actor.type == 'bossSpawn'){
                enemyObjects.push(actor)
            }
        },this)

        for(let i=0;i<enemyObjects.length;i++){
            this.createEnemy(enemyObjects[i])
        }

        //Make Explosions
        this.explosions = this.add.group({
            defaultKey: 'explosion',
            maxSize: enemyObjects.length+1,
        })
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion',{
                start: 0,
                end: 24,
                first: 23,
        }),
        frameRate: 24,
        })
        this.anims.create({
            key: 'cool',
            frames: this.anims.generateFrameNumbers('cooldown',{
                start:0,
                end:16,
                first: 16,
            }),
            frameRate: 24
        })

        //Camera
        this.cameras.main.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
        this.physics.world.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
        this.cameras.main.startFollow(this.player.hull,true,0.25,0.25)

        this.input.on('pointerdown',this.tryShoot,this)
        this.physics.world.on('worldbounds',function(body){
            this.disposeBullet(body.gameObject.disableBody(true,true))
        },this)

        

    }
    update(time, delta) {
        this.player.update()
        for(let i = 0;i<this.enemyArray.length;i++){
            this.enemyArray[i].update(time,delta)
        }
        this.crosshair.setPosition(this.input.x,this.input.y+30)
    }

    createPlayer(dataObj){
        this.player = new PlayerTank(this,dataObj.x,dataObj.y,'tank','tank1')
        this.player.enableCollisions(this.destructLayer)
        this.player.bulletCount = 5
    }

    tryShoot(pointer){
        if(this.player.canShoot){
            /**@type {Phaser.Physics.Arcade.Sprite} */
            let bullet = this.playerBullets.get(this.player.turret.x,this.player.turret.y)
            if(bullet){
                this.fireBullet(bullet,this.player.turret.rotation,this.enemyArray)
                this.player.bulletCount--
                this.updateCounter(this.player.bulletCount)
                this.crosshair.anims.play('cool')
                this.player.canShoot = false
                this.crosshair.on('animationcomplete',() =>{
                    this.player.canShoot = true
    })
}
        }
        
    }
    fireBullet(bullet,rotation,target){
        //Bullet is a sprite
        
        bullet.setDepth(3)
        bullet.body.collideWorldBounds = true
        bullet.body.onWorldBounds = true
        bullet.enableBody(false,bullet.x,bullet.y,true,true)
        bullet.rotation = rotation
        this.physics.velocityFromRotation(bullet.rotation,400,bullet.body.velocity)

        //Bullet Event Manager
        this.physics.add.collider(bullet,this.destructLayer,this.damageWall,null,this)
        if(target===this.player){
            this.physics.add.overlap(this.player.hull,bullet,this.bulletHitPlayer,null,this)
        }else{
            for(let i = 0;i<this.enemyArray.length;i++){
                this.physics.add.overlap(this.enemyArray[i].hull,bullet,this.bulletHitEnemy,null,this)
            }
        }
    }

    updateCounter(bullet){
        this.bulletBar.setFrame(5-bullet)
    }
    updateLeft(num){
        this.Remaining.setText("Enemies Remaining: "+num)
    }

    bulletHitPlayer(player,bullet){
        this.disposeBullet(bullet)
        this.player.damage()
        this.updateHealth(this.player.damageCount)
        if(this.player.isDestroyed()){
            this.input.enabled = false
            this.enemyArray = []
            this.physics.pause()
            let explosion = this.explosions.get(this.player.hull.x,this.player.hull.y)
            this.cameras.main.fadeOut(1500, 0, 0, 0)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
                this.endGame()
            })
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on('animationcomplete',this.animComplete,this)
                explosion.play('explode')
            }
        }
    }
    updateHealth(dmg){
        if(dmg<=3){
            this.healthBar.setFrame(0)
        }else if(dmg>3&&dmg<6){
            this.healthBar.setFrame(1)
        }else if(dmg>=6&&dmg<9){
            this.healthBar.setFrame(2)
        }else{
            this.healthBar.setFrame(3)
        }
    }
    bulletHitEnemy(hull,bullet){
        /** @type {EnemyTank} */
        let enemy
        /** @type {number} */
        let index
        for(let i = 0;i<this.enemyArray.length;i++){
            if(this.enemyArray[i].hull === hull){
                enemy = this.enemyArray[i]
                index = i
                break
            }
        }
        this.disposeBullet(bullet)
        enemy.damage()
        
        if(enemy.isImmobillised()){
            
        }
        if(enemy.isDestroyed()){
            this.enemiesLeft--
            this.updateLeft(this.enemiesLeft)
            let explosion = this.explosions.get(hull.x,hull.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on('animationcomplete',this.animComplete,this)
                explosion.play('explode')
            }
            //remove from array
            this.enemyArray.splice(index,1)
            if(this.enemiesLeft<=0){
                this.endGame()
            }
        }
    }
    animComplete(animation,frame,obj){
        this.explosions.killAndHide(obj)
    }
    activateExplosion(explosion){
        explosion.setDepth(5)
        explosion.setActive(true)
        explosion.setVisible(true)
    }
    damageWall(bullet,tile){
        this.disposeBullet(bullet)
        // retrieve the tileset firstgid {used as an offset}
        let firstGID = this.destructLayer.tileset[0].firstgid
        //get next tile id
        let nextTileID = tile.index+1-firstGID
        //get next tile properties
        let tileProperties = this.destructLayer.tileset[0].tileProperties[nextTileID]
        let newTile = this.destructLayer.putTileAt(nextTileID+firstGID,tile.x,tile.y)
        if(tileProperties&&tileProperties.collide){
            newTile.setCollision(true)
        }
    }
    disposeBullet(bullet){
        bullet.disableBody(true,true)
        if(this.playerBullets.contains(bullet)){
            this.player.bulletCount++
            this.updateCounter(this.player.bulletCount)
        }
        
    }


    createEnemy(dataObj){
        this.enemiesLeft++
        this.updateLeft(this.enemiesLeft)
        let enemyTank
        if(dataObj.type == 'enemySpawn'){
            enemyTank = new EnemyTank(this,dataObj.x,dataObj.y,'enemy','tank1',this.player)
            enemyTank.initMovement()
            enemyTank.enableCollisions(this.destructLayer,this.player.hull)
            enemyTank.setBullets(this.enemyBullets)
            this.enemyArray.push(enemyTank)
            if(this.enemyArray.length>1){
                for(let i = 0;i<this.enemyArray.length-1;i++){
                    this.physics.add.collider(enemyTank.hull,this.enemyArray[i].hull)
                }
            }
        }else if(dataObj.type == 'bossSpawn'){
            enemyTank = new BossTank(this,dataObj.x,dataObj.y,'boss','tank1',this.player)
            enemyTank.initMovement()
            enemyTank.enableCollisions(this.destructLayer,this.player.hull)
            enemyTank.setBullets(this.enemyBullets)
            this.enemyArray.push(enemyTank)
            if(this.enemyArray.length>1){
                for(let i = 0;i<this.enemyArray.length-1;i++){
                    this.physics.add.collider(enemyTank.hull,this.enemyArray[i].hull)
                }
            }
        }
 
    }
    endGame(){
        if(this.enemiesLeft<=0){
            this.scene.start('Level2')
        }else{
            this.scene.restart()
        }
        
    }
}