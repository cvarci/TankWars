class TankScene extends Phaser.Scene {
    
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
    preload() {
        this.load.image('bullet','assets/tanks/bullet.png')
        this.load.atlas('tank','assets/tanks/tanks.png','assets/tanks/tanks.json')
        this.load.atlas('enemy','assets/tanks/enemy-tanks.png','assets/tanks/tanks.json')
        this.load.atlas('boss','assets/tanks/boss-tanks.png','assets/tanks/tanks.json')
        this.load.image('tileset','assets/tanks/landscape-tileset.png')
        this.load.tilemapTiledJSON('tilemap','assets/maps/level2.json')
        this.load.spritesheet('explosion','assets/tanks/explosion.png',{
            frameWidth: 64,
            frameHeight: 64,
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
    }

    createPlayer(dataObj){
        this.player = new PlayerTank(this,dataObj.x,dataObj.y,'tank','tank1')
        this.player.enableCollisions(this.destructLayer)
    }

    tryShoot(pointer){
        /**@type {Phaser.Physics.Arcade.Sprite} */
        let bullet = this.playerBullets.get(this.player.turret.x,this.player.turret.y)
        if(bullet){
            this.fireBullet(bullet,this.player.turret.rotation,this.enemyArray)
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
    bulletHitPlayer(player,bullet){
        this.disposeBullet(bullet)
        this.player.damage()
        if(this.player.isDestroyed()){
            this.input.enabled = false
            this.enemyArray = []
            this.physics.pause()
            let explosion = this.explosions.get(this.player.hull.x,this.player.hull.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on('animationcomplete',this.animComplete,this)
                explosion.play('explode')
            }
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
            let explosion = this.explosions.get(hull.x,hull.y)
            if(explosion){
                this.activateExplosion(explosion)
                explosion.on('animationcomplete',this.animComplete,this)
                explosion.play('explode')
            }
            //remove from array
            this.enemyArray.splice(index,1)
            
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
    }


    createEnemy(dataObj){
        let enemyTank
        if(dataObj.type == 'enemySpawn'){
            enemyTank = new EnemyTank(this,dataObj.x,dataObj.y,'enemy','tank3',this.player)
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
            enemyTank = new BossTank(this,dataObj.x,dataObj.y,'boss','tank3',this.player)
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
}