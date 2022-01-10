class EnemyTank extends BaseTank{

    /** @type {PlayerTank} */
    player
    /** @type {number} */
    range = 250
    /** @type {number} */
    shotInterval = 2000
    /** @type {number} */
    nextShot = 0

    constructor(scene, x, y, texture, frame, player) {
        super(scene, x, y, texture, frame)
        this.cursors = scene.input.keyboard.createCursorKeys()
        this.player = player
        this.hull.angle = Phaser.Math.RND.angle()
    }

    initMovement(){
        this.scene.physics.velocityFromRotation(this.hull.rotation,this.tankSpeed,this.hull.body.velocity)
    }

    update(time,delta){
        super.update()
        this.turret.rotation = Phaser.Math.Angle.Between(this.hull.x,this.hull.y,this.player.hull.x,this.player.hull.y)
        if(this.damageCount<this.damageMax-2&&Phaser.Math.Distance.Between(this.hull.x,this.hull.y,this.player.hull.x,this.player.hull.y)<this.range){
            //within range and tank not disabled
            if(this.nextShot > time){
                //Wait to take shot
                return
            }
            this.nextShot = time + this.shotInterval

            let bullet = this.bullets.get(this.turret.x,this.turret.y)
            if(bullet){
                this.scene.fireBullet(bullet,this.turret.rotation,this.player)
            }
        }
    }
    // isClose(){
    //     let dx = Math.abs(this.hull.x - this.player.hull.x)
    //     let dy = Math.abs(this.hull.y - this.player.hull.y)
    //     let d = Math.sqrt((dx*dx)+(dy*dy))
    //     if(d<this.range){
    //         this.hull.setVelocity(0)
    //         this.isAttacking = true
    //     }else{
    //         this.initMovement()
    //         this.isAttacking = false
    //     }
    // }

    damage(){
        this.damageCount++
        if(this.damageCount >= this.damageMax){
            this.turret.destroy()
            this.hull.destroy()
        }else if(this.damageCount == this.damageMax-1){
            this.burn()
        }
    }
}