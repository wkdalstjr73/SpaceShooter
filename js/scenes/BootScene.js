// 진입점
class BootScene extends Phaser.Scene {
		  constructor() {
		    super('BootScene');
		  }
	
		  preload() {
		    // 추후 공통 리소스(로딩 화면 이미지 등)를 여기서 로드
		  }
	
		  create() {
		    this.scene.start('StartScene');
		  }
		}