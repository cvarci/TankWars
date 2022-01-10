class BossTank extends EnemyTank{
    /** @type {number} */
    shotInterval = 1250
    /** @type {number} */
    damageMax = 6
    /** @type {number} */
    tankSpeed = 80

    constructor(scene, x, y, texture, frame, player) {
        super(scene, x, y, texture, frame)
        this.cursors = scene.input.keyboard.createCursorKeys()
        this.player = player
        this.hull.angle = Phaser.Math.RND.angle()
    }

}