// 게임 클리어 화면
class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  create() {
    // html 상단바 숨김
	document.getElementById('hud-bar').style.display = 'none';
	if (window.resizeGame) window.resizeGame();

    const centerX = GameConfig.WIDTH / 2;

    // 클리어 문구
    this.add.text(centerX, 380, 'GAME CLEAR', {
      fontSize: '46px',
      fontStyle: 'bold',
      color: '#ffe066'
    }).setOrigin(0.5);

    // 다시 시작 버튼 (기존 게임오버 화면과 동일한 구조)
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