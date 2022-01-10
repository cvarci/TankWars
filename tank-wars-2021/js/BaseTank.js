class BaseTank{

    /** @type {number} */
    tankSpeed = 100
    /** @type {number} */
    damageMax = 3
    /** @type {Phaser.Physics.Arcade.Group} */
    bullets

    constructor(scene,x,y,texture,frame){
        this.scene=scene
        this.shadow = this.scene.add.image(x,y,texture,'shadow')
        this.shadow.setDepth(1)
        this.hull = this.scene.physics.add.sprite(x,y,texture,frame)
        this.hull.setDepth(2).setSize(56,56)
        this.hull.body.collideWorldBounds = true
        this.hull.body.bounce.setTo(1,1)
        this.turret = this.scene.physics.add.sprite(x,y,texture,'turret')
        this.turret.setDepth(4)
        this.damageCount = 0
        
    }

    update(){
        this.shadow.x = this.turret.x = this.hull.x
        this.shadow.y = this.turret.y = this.hull.y
        this.shadow.rotation = this.hull.rotation

    }

    damage(){
        
    }

    setBullets(bullets){
        this.bullets = bullets
    }

    burn(){
        this.turret.setVisible(false)
        this.hull.setVelocity(0)
        this.hull.body.immovable = true
    }

    isDestroyed(){
        if(this.damageCount >= this.damageMax){
            return true
        }
    }

    isImmobillised(){
        if(this.damageCount == this.damageMax-1){
            return true
        }
    }

    enableCollisions(destructLayer,tanks){
        this.scene.physics.add.collider(this.hull,destructLayer)
        this.scene.physics.add.collider(this.hull,tanks)
    }
}