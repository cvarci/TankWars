class EnemyTank extends BaseTank{

    /** @type {PlayerTank} */
    player
    /** @type {number} */
    range = 250

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
        console.log(this.isClose())
    }
    isClose(){
        let dx = Math.abs(this.hull.x - this.player.hull.x)
        let dy = Math.abs(this.hull.y - this.player.hull.y)
        let d = Math.sqrt((dx*dx)+(dy*dy))
        if(d<this.range){
            //Stop and shoot
        }else{
            //Move towards and shoot
        }
    }
}