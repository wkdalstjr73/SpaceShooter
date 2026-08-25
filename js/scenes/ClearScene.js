// 게임 클리어 화면
class ClearScene extends Phaser.Scene {
  constructor() {
    super('ClearScene');
  }

  // GameScene에서 scene.start('ClearScene', {kills, time})로 넘긴 데이터를 받음
  init(data) {
    this.resultKills = (data && data.kills !== undefined) ? data.kills : 0;
    this.resultTime = (data && data.time !== undefined) ? data.time : 0;
  }

  create() {
    document.getElementById('hud-bar').style.display = 'none';
    if (window.resizeGame) window.resizeGame();

    const centerX = GameConfig.WIDTH / 2;

    // 클리어 문구
    this.add.text(centerX, 220, 'GAME CLEAR', {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ffe066'
    }).setOrigin(0.5);

    // 결과 (처치수 / 생존시간)
    const minutes = Math.floor(this.resultTime / 60);
    const seconds = this.resultTime % 60;
    const timeText = minutes + ':' + String(seconds).padStart(2, '0');

    this.add.text(centerX, 300, '처치 ' + this.resultKills, {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, 330, '무한모드 생존시간 ' + timeText, {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 랭킹판 자리 (서버 연동 예정)
    this.add.text(centerX, 450, '랭킹판 준비 중', {
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);

    // 재시작 버튼
    const restartButton = this.add.rectangle(centerX, 620, 200, 60, 0x4a90d9);
    const restartButtonText = this.add.text(centerX, 620, 'RESTART', {
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