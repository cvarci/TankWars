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
    preload() {
        this.load.image('bullet','assets/tanks/bullet.png')
        this.load.atlas('tank','assets/tanks/tanks.png','assets/tanks/tanks.json')
        this.load.atlas('enemy','assets/tanks/enemy-tanks.png','assets/tanks/tanks.json')
        this.load.image('tileset','assets/tanks/landscape-tileset.png')
        this.load.tilemapTiledJSON('tilemap','assets/maps/level1.json')
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
            }else if(actor.type == 'enemySpawn'){
                enemyObjects.push(actor)
            }
        },this)

        for(let i=0;i<enemyObjects.length;i++){
            this.createEnemy(enemyObjects[i])
        }

        //Camera
        this.cameras.main.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
        this.physics.world.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
        this.cameras.main.startFollow(this.player.hull,true,0.25,0.25)

        
    }
    update(time, delta) {
        this.player.update()
        for(let i = 0;i<this.enemyArray.length;i++){
            this.enemyArray[i].update()
        }
        
    }

    createPlayer(dataObj){
        this.player = new PlayerTank(this,dataObj.x,dataObj.y,'tank','tank1')
        this.player.enableCollisions(this.destructLayer)
    }

    createEnemy(dataObj){
        let enemyTank = new EnemyTank(this,dataObj.x,dataObj.y,'enemy','tank3',this.player)
        enemyTank.initMovement()
        enemyTank.enableCollisions(this.destructLayer,this.player.hull)
        this.enemyArray.push(enemyTank)
        if(this.enemyArray.length>1){
            for(let i = 0;i<this.enemyArray.length-1;i++){
                this.physics.add.collider(enemyTank.hull,this.enemyArray[i].hull)
            }
        }
    }
}