// 진입점
class BootScene extends Phaser.Scene {
		  constructor() {
		    super('BootScene');
		  }
	
		  preload() {
		    // 시작·게임오버·클리어 화면에서 공통으로 사용할 배경
		    this.load.spritesheet('BackGrounds', 'assets/images/BackGrounds.png', {
		      frameWidth: 128,
		      frameHeight: 256
		    });
		  }
	
		  create() {
		    this.scene.start('StartScene');
		  }
		}