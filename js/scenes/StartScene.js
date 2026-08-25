// 시작 화면
class StartScene extends Phaser.Scene {
		  constructor() {
		    super('StartScene');
		  }
	
		  preload() {
		    // 시작 화면용 리소스는 다음 단계에서 추가 예정
		  }
	
		  create() {
			// html 상단바 숨김
			document.getElementById('hud-bar').style.display = 'none';
			if (window.resizeGame) window.resizeGame();
		    // 시작 화면 UI 구현
		    const centerX = GameConfig.WIDTH / 2;
		
		    // 게임 제목
		    this.add.text(centerX, 200, '탄막 슈팅', {
		      fontSize: '48px',
		      fontStyle: 'bold',
		      color: '#ffffff'
		    }).setOrigin(0.5);
		
		    // 부제목 (원하면 나중에 수정)
		    this.add.text(centerX, 260, '종방향 슈팅 게임', {
		      fontSize: '20px',
		      color: '#888888'
		    }).setOrigin(0.5);
		
			// 조작키 설명
		    const labelX = centerX - 30;
			const colonX = centerX;
			const valueX = centerX + 30;
			
			const textStyle = {
			    fontSize: '22px',
			    color: '#cccccc'
			};
			
			this.add.text(colonX, 370, '< 조작 설명 >', textStyle)
			    .setOrigin(0.5, 0.5);
			
			// 이동
			this.add.text(labelX, 420, '이동', textStyle)
			    .setOrigin(1, 0.5);
			
			this.add.text(colonX, 420, ':', textStyle)
			    .setOrigin(0.5, 0.5);
			
			this.add.text(valueX, 420, '방향키, 터치', textStyle)
			    .setOrigin(0, 0.5);
			
			// 공격
			this.add.text(labelX, 450, '공격', textStyle)
			    .setOrigin(1, 0.5);
			
			this.add.text(colonX, 450, ':', textStyle)
			    .setOrigin(0.5, 0.5);
			
			this.add.text(valueX, 450, '자동', textStyle)
			    .setOrigin(0, 0.5);
			
			// 일시정지
			this.add.text(labelX, 480, '일시정지', textStyle)
			    .setOrigin(1, 0.5);
			
			this.add.text(colonX, 480, ':', textStyle)
			    .setOrigin(0.5, 0.5);
			
			this.add.text(valueX, 480, '스페이스, 더블탭', textStyle)
			    .setOrigin(0, 0.5);
		
		    // 시작 버튼 (사각형 + 텍스트로 구성)
		    const startButton = this.add.rectangle(centerX, 650, 200, 60, 0x4a90d9);
		    const startButtonText = this.add.text(centerX, 650, 'START', {
		      fontSize: '28px',
		      fontStyle: 'bold',
		      color: '#ffffff'
		    }).setOrigin(0.5);
		
		    // 버튼 클릭 가능하게 설정
		    startButton.setInteractive({ useHandCursor: true });
		
		    // 마우스 올렸을 때 색상 변화 (선택적 효과)
		    startButton.on('pointerover', () => {
		      startButton.setFillStyle(0x6aa8e8);
		    });
		    startButton.on('pointerout', () => {
		      startButton.setFillStyle(0x4a90d9);
		    });
		
		    // 클릭 시 GameScene으로 전환
		    startButton.on('pointerdown', () => {
		      this.scene.start('GameScene');
		    });
		  }
		}