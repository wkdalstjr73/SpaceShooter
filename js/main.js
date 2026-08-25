// 게임 실행 진입점
const config = {
			  type: Phaser.AUTO,
			  parent: 'container',
			  width: GameConfig.WIDTH,
			  height: GameConfig.HEIGHT,
			  backgroundColor: GameConfig.BACKGROUND_COLOR,
			  pixelArt: true,
			  scale: {
			    mode: Phaser.Scale.NONE		// 자동 크기조절 대신 직접 계산 (HUD 바 높이를 고려해야 하므로)
			  },
			  physics: {
			    default: 'arcade',
			    arcade: {
			      gravity: { y: 0 },   // 탄막 게임은 중력 없음
			      debug: false
			    }
			  },
			  scene: [BootScene, StartScene, GameScene, GameOverScene, ClearScene]		// 시작 순서
			};
	
const game = new Phaser.Game(config);

// HUD 기준 크기 (540px 폭 기준으로 디자인된 값 — 캔버스 기준 해상도와 동일한 기준점)
const HUD_BASE_FONT_SIZE = 18;   // px
const HUD_BASE_PADDING_V = 8;    // px
const HUD_BASE_PADDING_H = 16;   // px

// HUD 바 높이까지 고려해서, 창 크기에 맞는 최적의 캔버스 표시 크기를 직접 계산
function resizeGame() {
  const hudBar = document.getElementById('hud-bar');
  const isHudVisible = hudBar && hudBar.style.display !== 'none';

  // HUD 높이를 계산하기 전, 우선 기준 폰트 크기로 임시 설정해서 실제 필요한 높이를 가늠
  if (hudBar) {
    hudBar.style.fontSize = HUD_BASE_FONT_SIZE + 'px';
    hudBar.style.padding = HUD_BASE_PADDING_V + 'px ' + HUD_BASE_PADDING_H + 'px';
  }

  const hudHeightAtBaseScale = isHudVisible ? hudBar.offsetHeight : 0;

  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight - hudHeightAtBaseScale;

  // 가로/세로 중 더 작게 맞춰지는 비율로 스케일 결정 (비율 유지)
  const scale = Math.min(
    availableWidth / GameConfig.WIDTH,
    availableHeight / GameConfig.HEIGHT
  );

  const displayWidth = Math.floor(GameConfig.WIDTH * scale);
  const displayHeight = Math.floor(GameConfig.HEIGHT * scale);

  game.canvas.style.width = displayWidth + 'px';
  game.canvas.style.height = displayHeight + 'px';

  if (hudBar) {
    hudBar.style.width = displayWidth + 'px';
    // 캔버스와 동일한 scale을 HUD 폰트/패딩에도 적용 → 화면이 작아지면 글자도 같이 작아짐
    hudBar.style.fontSize = (HUD_BASE_FONT_SIZE * scale) + 'px';
    hudBar.style.padding = (HUD_BASE_PADDING_V * scale) + 'px ' + (HUD_BASE_PADDING_H * scale) + 'px';
  }
}

// 다른 Scene 파일에서도 HUD 표시/숨김을 바꿀 때마다 호출할 수 있도록 전역으로 노출
window.resizeGame = resizeGame;

game.events.on('ready', resizeGame);
window.addEventListener('resize', resizeGame);
