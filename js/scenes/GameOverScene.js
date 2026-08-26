// 게임 오버 화면
class GameOverScene extends Phaser.Scene {
		  constructor() {
		    super('GameOverScene');
		  }
	
		  create() {
			// html 상단바 숨김
			document.getElementById('hud-bar').style.display = 'none';
			if (window.resizeGame) window.resizeGame();
		    const centerX = GameConfig.WIDTH / 2;
		    
		    const background = this.add.image(
			  GameConfig.WIDTH / 2,
			  GameConfig.HEIGHT / 2,
			  'BackGrounds',
			  0
			);
			
			background.setDisplaySize(GameConfig.WIDTH, GameConfig.HEIGHT);
			background.setDepth(-10);
		
		    // 게임 오버 문구
		    this.add.text(centerX, 380, 'GAME OVER', {
		      fontSize: '48px',
		      fontStyle: 'bold',
		      color: '#ff5555'
		    }).setOrigin(0.5);
		
		    // 재시작 버튼 (시작 화면과 동일한 구조)
		    const restartButton = this.add.rectangle(centerX, 550, 200, 60, 0x4a90d9);
		    const restartButtonText = this.add.text(centerX, 550, 'RESTART', {
		      fontSize: '26px',
		      fontStyle: 'bold',
		      color: '#ffffff'
		    }).setOrigin(0.5);
		
		    restartButton.setInteractive({ useHandCursor: true });
		
		    restartButton.on('pointerover', () => {
		      restartButton.setFillStyle(0x6aa8e8);
		    });
		    restartButton.on('pointerout', () => {
		      restartButton.setFillStyle(0x4a90d9);
		    });
		
		    restartButton.on('pointerdown', () => {
		      this.scene.start('GameScene');
		    });
		  }
		}