class GameScene extends Phaser.Scene {
		  constructor() {
		    super('GameScene');
		  }
	
		  preload() {
		    // 게임 플레이용 리소스는 다음 단계에서 추가 예정
		    this.load.spritesheet('ships', 'assets/images/Ships.png', {
				frameWidth: 8,
				frameHeight: 8
			});
			this.load.spritesheet('Projectiles', 'assets/images/Projectiles.png', {
				frameWidth: 8,
				frameHeight: 8
			})
			this.load.image('laserMiddleTex', 'assets/images/laser_middle.png');
			// 같은 파일을 16x16 기준으로 한 번 더 로드 (보스급 큰 함선 추출용)
			this.load.spritesheet('shipsBig', 'assets/images/Ships.png', {
				frameWidth: 16,
				frameHeight: 16
			});
			// 효과음
			this.load.audio('sfxPlayerEntry', 'assets/sounds/playerEntry.wav');
			this.load.audio('sfxBossEntry', 'assets/sounds/bossEntry.wav');
			this.load.audio('sfxPlayerDeath', 'assets/sounds/playerDeath.wav');
			this.load.audio('sfxEnemyDeath', 'assets/sounds/enemyDeath.wav');
			this.load.audio('sfxBossDeath', 'assets/sounds/bossDeath.wav');
			this.load.audio('sfxPauseToggle', 'assets/sounds/pause.wav');
			this.load.audio('sfxPlayerHit', 'assets/sounds/playerHit.wav');
			this.load.audio('sfxHeal', 'assets/sounds/heal.wav');
		  }
	
		  // 상태 초기화
		  // scene 전체에서 계속 참조 및 수정 하는 값은 this. 저장
		  // GameScene이 시작될 때 한 번만 실행
		  create() {
			// html에 있는 상단바 노출
			document.getElementById('hud-bar').style.display = 'flex';
			if (window.resizeGame) window.resizeGame();
			
			
			// 배경 설정
			const bgScale = GameConfig.WIDTH / 128;
			this.backgrounds = [];
			for (let i = 0; i < 3; i++) {
			    const bg = this.add.image(
			        GameConfig.WIDTH / 2,
			        i * 256 * bgScale + (256 * bgScale / 2),
			        'BackGrounds',
			        0
			    );
			    bg.setScale(bgScale);
			    bg.setDepth(-10);
			    this.backgrounds.push(bg);
			}
			
			
		    // 게임 화면의 화면 중앙값 계산
		    const centerX = GameConfig.WIDTH / 2;
		
			// 플레이어 체력/공격력 상태값
			// 플레이어 hp 초기화
		    this.playerHP = GameConfig.PLAYER_MAX_HP;
		    const hpEl = document.getElementById('hud-hp');

			if (hpEl) {
			  hpEl.textContent =
			    'HP: ' + this.playerHP + ' / ' + GameConfig.PLAYER_MAX_HP;
			}
		    // 플레이어 공격력 저장
		    this.playerAttackPower = GameConfig.PLAYER_ATTACK_POWER;
	    	this.isGameOver = false;   // 중복으로 게임오버 처리되는 것 방지용 플래그
		    this.hasBeatenBoss = false;   // 보스를 이겼는지 여부 (사망 시 어느 화면으로 갈지 결정)
		    this.isInfiniteStage = false; // 무한 스테이지 진행 중인지
		    this.infinitePlayTime = 0;
		    
		    // 일시정지 상태
			this.isPaused = false; // false: 진행중, true: 일시정지
			this.pauseText = null; // 일시정지 텍스트값
		
			this.playerTargetY = GameConfig.HEIGHT - 150;
			
			// 화면 아래쪽 바깥에서 시작
			this.player = this.physics.add.sprite(
			  centerX,
			  GameConfig.HEIGHT + 50,
			  'ships',
			  11
			);
			
			this.player = this.player.setScale(5);
			this.isPlayerEntering = true;
		    this.player.body.setCollideWorldBounds(false);
		
		    // 키보드 방향키 입력 등록
		    this.cursors = this.input.keyboard.createCursorKeys();
		    
		    // 스페이스바로 일시정지 / 재개
			this.input.keyboard.on('keydown-SPACE', () => {
			  this.togglePause();
			});
		    
		    // 상대 이동형 터치 상태값
			this.isTouchActive = false;
			this.touchPointerId = null;
			this.touchLastX = 0;
			this.touchLastY = 0;
			
			// 더블 탭 판정을 위한 상태값
			this.lastTapTime = 0;
			
			// 터치 시작: 더블 탭이면 일시정지 토글, 아니면 현재 손가락 위치 저장
			this.input.on('pointerdown', (pointer) => {
			  if (this.isGameOver) {
			    return;
			  }
			
			  const now = this.time.now;
			  const isDoubleTap =
			    (now - this.lastTapTime) < GameConfig.DOUBLE_TAP_WINDOW;
			
			  this.lastTapTime = isDoubleTap ? 0 : now;
			
			  if (isDoubleTap) {
			    this.togglePause();
			    this.cancelTouchControl();
			    return;
			  }
			
			  if (this.isPaused || this.isTouchActive) {
			    return;
			  }
			
			  this.isTouchActive = true;
			  this.touchPointerId = pointer.id;
			  this.touchLastX = pointer.x;
			  this.touchLastY = pointer.y;
			
			  // 키보드로 이동 중이었다면 터치 시작 시 즉시 멈춤
			  this.player.body.setVelocity(0, 0);
			  this.player.setFrame(11);
			});
			
			// 터치 이동: 손가락이 직전 이벤트에서 움직인 거리만큼 플레이어 이동
			this.input.on('pointermove', (pointer) => {
			  if (
			    !this.isTouchActive ||
			    pointer.id !== this.touchPointerId ||
			    this.isPaused ||
			    this.isGameOver
			  ) {
			    return;
			  }
			
			  const dx = pointer.x - this.touchLastX;
			  const dy = pointer.y - this.touchLastY;
			
			  // 다음 이동 계산을 위해 현재 위치를 저장
			  this.touchLastX = pointer.x;
			  this.touchLastY = pointer.y;
			
			  const moveX = dx * GameConfig.TOUCH_MOVE_SCALE;
			  const moveY = dy * GameConfig.TOUCH_MOVE_SCALE;
			
			  // 플레이어 이미지 크기를 고려해 화면 안으로 제한
			  const halfWidth = this.player.displayWidth / 2;
			  const halfHeight = this.player.displayHeight / 2;
			
			  const nextX = Phaser.Math.Clamp(
			    this.player.x + moveX,
			    halfWidth,
			    GameConfig.WIDTH - halfWidth
			  );
			
			  const nextY = Phaser.Math.Clamp(
			    this.player.y + moveY,
			    halfHeight,
			    GameConfig.HEIGHT - halfHeight
			  );
			
			  this.player.setPosition(nextX, nextY);
			  this.player.body.setVelocity(0, 0);
			  this.player.body.updateFromGameObject();
			
			  // 좌우 이동 방향에 맞춰 함선 포즈 변경
			  if (dx < -0.1) {
			    this.player.setFrame(10);
			  } else if (dx > 0.1) {
			    this.player.setFrame(12);
			  } else {
			    this.player.setFrame(11);
			  }
			});
			
			// 터치 종료
			this.input.on('pointerup', (pointer) => {
			  if (pointer.id === this.touchPointerId) {
			    this.cancelTouchControl();
			  }
			});
		    
		    
		    // 플레이어 발사체 그룹 생성 (여러 발사체를 한 번에 관리)
		    this.playerBullets = this.physics.add.group();
		
		    // 1초마다 자동으로 발사체 생성
		    this.time.addEvent({
		      delay: GameConfig.PLAYER_FIRE_RATE,	// 얼마나 자주 발사할지 결정
		      callback: this.firePlayerBullet,		// 위 시간이 지나면 실행할 함수(발사 함수)
		      callbackScope: this,					// firePlayerBullet내부 this가 현재 GameScene을 가리키도록 설정
		      loop: true							// 계속 반복
		    });
		    
		    // 적 & 적 발사체 그룹 생성
		    this.enemies = this.physics.add.group();		// 모든 적 관리
		    this.enemyBullets = this.physics.add.group();	// 모든 적 발사체 관리
		    
		    // 충돌 판정 등록
		    this.physics.add.overlap(
		      this.playerBullets,
		      this.enemies,
		      this.handlePlayerBulletHitEnemy,		// 플레이어 총알과 적이 충돌하면 실행
		      null,
		      this
		    );
		
		    this.physics.add.overlap(
		      this.enemyBullets,
		      this.player,
		      this.handleEnemyBulletHitPlayer,		// 적 총알과 플레이어가 충돌하면 실행
		      null,
		      this
		    );
		    
		    // 랜덤 표식 공격 시스템 (실제 시작은 스테이지4 진입 시점에 스테이지 시스템이 호출)
		    this.markers = [];
		
		    // 하트 회복 아이템 그룹 (무한 스테이지 진입 시점부터 생성 시작)
		    this.hearts = this.physics.add.group();
		    this.physics.add.overlap(this.player, this.hearts, this.handlePlayerHeartPickup, null, this);
		
		    // 스테이지 시스템 시작 (첫 스테이지 안내 문구 표시 → 적 생성 시작)
		    this.startPlayerEntrance();
		  }
	
		  startPlayerEntrance() {
		    this.sound.play('sfxPlayerEntry', { volume: 0.8 });
		
		    this.tweens.add({
		      targets: this.player,
		      y: this.playerTargetY,
		      duration: 1400,
		      ease: 'Sine.easeOut',
		
		      // 트윈으로 움직인 위치를 물리 바디에도 반영
		      onUpdate: () => {
		        this.player.body.updateFromGameObject();
		      },
		
		      onComplete: () => {
		        this.player.body.updateFromGameObject();
		        this.player.body.setCollideWorldBounds(true);
		
		        this.isPlayerEntering = false;
		
		        // 플레이어가 도착한 후 스테이지 문구와 게임 진행 시작
		        this.startStageSystem();
		      }
		    });
		  }
	
		  // 매 프레임 실행
		  update(time, delta) {
		    // 매 프레임 게임 로직 구현
		    if (this.isGameOver || this.isPaused) {
		      return; // 게임오버 처리 중에는 나머지 로직 정지 (페이드아웃만 진행)
		    }
		    if (this.isPlayerEntering) {
			  return;
			}
		    
		    if (this.isInfiniteStage) {
			    this.infinitePlayTime += delta;
			    this.updateHUD();
			}
		    
		    const backgroundSpeed = 0.3;
		    for (const bg of this.backgrounds) {
		        bg.y += backgroundSpeed;
		        // 배경이 화면 아래로 완전히 나가면
		        // 가장 위로 이동
		        if (bg.y - bg.displayHeight / 2 >= GameConfig.HEIGHT) {
		            const topBg = this.backgrounds.reduce(
		                (top, current) => {
		                    return current.y < top.y ? current : top;
		                }
		            );
		            bg.y = topBg.y - bg.displayHeight;
		        }
		    }
		
		    this.handlePlayerMovement();		// 플레이어 이동 처리
		    this.cleanupPlayerBullets();		// 화면 밖으로 나간 플레이어 총알 제거
		    this.updateEnemies();				// 적 상태 업데이트
		    this.cleanupEnemyBullets();			// 화면 밖으로 나간 적 총알 제거
		    this.updateHomingBullets(delta);	// 유도탄 방향을 매 프레임 조정
		    this.updateLasers();				// 레이저 그래픽을 적 위치에 맞춰 조정
		    this.updateMarkers();				// 플레이어를 따라오는 표식 위치 조정
		    this.updateBossMovement();			// 보스 이동 처리 (보스전이 아니면 내부에서 즉시 종료)
    		this.updateBossHpBar();				// 보스 체력바 위치/게이지 갱신
    		this.cleanupHearts();				// 화면 밖으로 나간 하트 제거
		  }
		  
		  // 일시정지 / 재개
		  togglePause() {
			if (this.isGameOver || this.isPlayerEntering) {
			  return;
			}
		    if (this.isPaused) {				// 이미 일시정지 상태라면 게임 재개
		      // 게임 재개
		      this.isPaused = false;		
		      this.sound.resumeAll();
		      this.sound.play('sfxPauseToggle', { volume: 0.7 });
		
		      // 물리 재개
		      this.physics.resume();			// 물리엔진 재개(적, 총알의 물리 이동 등)
		
		      // 타이머 재개
		      this.time.paused = false;
		      
		      // 애니메이션 재개
		      this.tweens.resumeAll();
		
		      // 일시정지 문구 제거
		      if (this.pauseText && this.pauseNoticeText) {				// 일시정지 텍스트 존재시 제거
		        this.pauseText.destroy();
		        this.pauseText = null;
		        this.pauseNoticeText.destroy();
		        this.pauseNoticeText = null;
		      }
		
		    } else {							// 일시정지가 아니라면 정지
		      // 게임 일시정지
		      this.isPaused = true;
		      this.sound.pauseAll();
		      this.sound.play('sfxPauseToggle', { volume: 0.7 });
		
		      // 물리 정지
		      this.physics.pause();				// 물리엔진 정지(적, 총알의 물리 이동 등)
		
		      // 타이머 정지
		      this.time.paused = true;
		      
		      // 애니메이션 정지
		      this.tweens.pauseAll();
		
		      // 일시정지 문구 표시
		      this.pauseText = this.add.text(	// 일시정지 문구 생성
		        GameConfig.WIDTH / 2,			// 폰트 생성 위치
		        GameConfig.HEIGHT / 2,			// 폰트 생성 위치
		        'PAUSED',						// 생성 문구
		        {
		          fontSize: '56px',				// 폰트 크기
		          fontStyle: 'bold',			// 폰트 굵기
		          color: '#ff5555',				// 폰트 색상
		          stroke: '#ffffff',			// 외곽선 색상
		          strokeThickness: 8			// 외곽선 굵기
		        }
		      )
		      .setOrigin(0.5)					// 텍스트 중심을 기준점으로 만들어 화면 중앙에 정확히 위치
		      .setDepth(2000);					// 다른 게임 오브젝트보다 위에 표시
		      
		      this.pauseNoticeText = this.add.text(
				  GameConfig.WIDTH / 2,			// 폰트 생성 위치
		        GameConfig.HEIGHT / 2 + 50,			// 폰트 생성 위치
		        '< 화면 더블탭 또는 스페이스바를 눌러 게임 재개 >',						// 생성 문구
		        {
		          fontSize: '16px',				// 폰트 크기
		          fontStyle: 'bold',			// 폰트 굵기
		          color: '#ffffff',				// 폰트 색상
		        }
			  )
			  .setOrigin(0.5)
			  .setDepth(2000);
		    }
		  }
		  
		  // 플레이어 이동
		  handlePlayerMovement() {
		    if (this.isTouchActive) {
		      this.handleTouchMovement();		// 터치 중이라면 터치 이동 함수 실행
		    } else {
		      this.handleKeyboardMovement();	// 아니라면 키보드 이동 함수 실행
		    }
		  }
		
		  // 플레이어 이동
		  handleKeyboardMovement() {
		    const speed = GameConfig.PLAYER_SPEED;			// 플레이어 이동속도 저장
		
		    // 현재 눌린 키에 따라 x, y 방향 결정 (-1, 0, 1)
		    let velocityX = 0;								// 처음에는 움직이지 않음
		    let velocityY = 0;								// 처음에는 움직이지 않음
		
		    if (this.cursors.left.isDown) {
		      velocityX = -1;								// 왼쪽 누르면 왼쪽
		      this.player.setFrame(10);					// 왼쪽으로 기운 포즈
		    } else if (this.cursors.right.isDown) {
		      velocityX = 1;								// 오른쪽 누르면 오른쪽
		      this.player.setFrame(12);					// 오른쪽으로 기운 포즈
		    } else {
		      this.player.setFrame(11);					// 좌우 입력이 없으면 정면 포즈
		    }

		    if (this.cursors.up.isDown) {
		      velocityY = -1;								// 위쪽 누르면 위쪽
		    } else if (this.cursors.down.isDown) {
		      velocityY = 1;								// 아래쪽 누르면 아래쪽
		    }
		
		    // 대각선 이동 시 속도가 더 빨라지는 것 방지 (벡터 정규화)
		    const velocity = new Phaser.Math.Vector2(velocityX, velocityY);			// x/y값을 벡터로 만듦
		    velocity.normalize();													// 벡터의 길이를 1로 만듦
		
		    this.player.body.setVelocity(		// 실제 플레이어의 물리 속도 설정
				velocity.x * speed,
				velocity.y * speed
			);
		  }
		
		  // 상대 이동형 터치는 pointermove에서 이미 위치를 직접 갱신한다.
		  handleTouchMovement() {
		    this.player.body.setVelocity(0, 0);
		  }
		
		  // 터치 상태 정리
		  cancelTouchControl() {
		    this.isTouchActive = false;
		    this.touchPointerId = null;
		    this.touchLastX = 0;
		    this.touchLastY = 0;
		
	  	    this.player.body.setVelocity(0, 0);
		    this.player.setFrame(11);
		  }
		  
		  
		  
		  firePlayerBullet() {
			if (this.isPlayerEntering) {
			  return;
			}
		    const bullet = this.add.sprite(
		      this.player.x,
		      this.player.y,
		      'Projectiles',
		      2
		    );
		    bullet.setScale(5);
		
		    this.physics.add.existing(bullet);								// 물리엔진 적용
		    this.playerBullets.add(bullet);                                 // 그룹 추가를 먼저, 플레이어 총알 그룹 추가
		
		    bullet.body.setVelocityY(-GameConfig.PLAYER_BULLET_SPEED);      // 속도 설정은 나중에, 위쪽으로 이동
		  }
		  
		  // 플레이어 자동 공격
		  cleanupPlayerBullets() {
		  	// 화면 위쪽을 벗어난 발사체 제거
		  	this.playerBullets.getChildren().forEach((bullet) => {	// 현재 존재하는 모든 플레이어 총알 순회
		    	if (bullet.y < -20) {								// 화면 위로 완전히 나갔다면
		      		bullet.destroy();								// 제거
		    	}
		  	});
		  }
		  
	  	  updateHUD() {													// HTML HUD에 현재 게임 상태 표시
		    const hpEl = document.getElementById('hud-hp');				// hp 표시 정보
		    const stageEl = document.getElementById('hud-stage');		// 스테이지 표시 정보
		    const killsEl = document.getElementById('hud-kills');		// 킬 수 표시 정보
	
		    if (hpEl) {		// hp표시
		      hpEl.textContent = 'HP: ' + this.playerHP + ' / ' + GameConfig.PLAYER_MAX_HP;
		    }
	
		    const isBossStage = (this.currentStageIndex === 3);
	
		    if (stageEl) {	// 스테이지 및 웨이브 표시
			    if (this.isInfiniteStage) {
			        const playSeconds = Math.floor(this.infinitePlayTime / 1000);
			        const minutes = Math.floor(playSeconds / 60);
			        const seconds = playSeconds % 60;
			
			        stageEl.textContent =
			            minutes + ':' + String(seconds).padStart(2, '0');
			
			    } else if (isBossStage) {
			        stageEl.textContent = '4-BOSS';
			    } else {
			        stageEl.textContent =
			            (this.currentStageIndex + 1) + '-' + (this.currentWaveIndex + 1);
			    }
			}
	
		    if (killsEl) {	// 킬 수 표시
		      if (this.isInfiniteStage || isBossStage) {
		        // 보스전/무한 스테이지는 웨이브 목표치가 없으니 게임 전체 누적 처치수를 표시
		        killsEl.textContent = 'KILL ' + this.totalKillCount;
		      } else {
		        // 일반 스테이지는 "현재 웨이브에서 처치한 수 / 이 웨이브의 목표 처치수"
		        const waveConfig = GameConfig.STAGE_WAVES[this.currentStageIndex][this.currentWaveIndex];
		        killsEl.textContent = 'KILL ' + this.waveKillCount + '/' + waveConfig.killTarget;
		      }
		    }
		  }
		
		  // 체력/게임오버
		  // 플레이어 피격
		  damagePlayer(amount) {
		    if (this.isGameOver) {
		      return; // 이미 게임오버 처리된 상태면 추가 데미지 무시
		    }
		
		    this.playerHP -= amount;	// hp감소 계산
		
		    if (this.playerHP < 0) {	// hp 음수 방지
		      this.playerHP = 0;
		    }
		
			if (this.playerHP > 0) {
			  this.sound.play('sfxPlayerHit', { volume: 1 });
			}
		
		    this.updateHUD();			// HUD 갱신
		
		    // 피격 이펙트 (맞을 때마다 표시)
		    // 플레이어 위치에 빨간피격 이펙트 생성
		    this.spawnBurstEffect(
		      this.player.x, this.player.y,
		      0xff5555,
		      GameConfig.PLAYER_HIT_EFFECT_RADIUS,
		      GameConfig.PLAYER_HIT_EFFECT_DURATION
		    );
		
		    if (this.playerHP <= 0) {	// hp가 0이라면
		      this.isGameOver = true;	// 게임 오버 플래그 true
		      this.handlePlayerDeath();	// 실행
		    }
		  }
		
  		  handlePlayerDeath() {
			this.sound.play('sfxPlayerDeath', { volume: 0.8 });
	
		    // scene의 남은 모든 타이머 정리 (적 생성, 발사, 표식 등이 페이드아웃 중에 계속 동작하지 않도록)
		    this.time.removeAllEvents();
		
		    // 사망 이펙트 (크게 한 번)
		    this.spawnBurstEffect(
		      this.player.x, this.player.y,
		      0xffffff,
		      GameConfig.PLAYER_DEATH_EFFECT_RADIUS,
		      GameConfig.PLAYER_DEATH_EFFECT_DURATION
		    );
		    this.player.setVisible(false);		// 플레이어 숨김
		
		    const survivalSeconds =
    			Math.floor(this.infinitePlayTime / 1000);
		
		    // 화면이 서서히 어두워지며 페이드아웃된 후 결과 화면으로 전환
		    this.cameras.main.fadeOut(GameConfig.GAME_OVER_FADE_DURATION, 0, 0, 0);	// 검은 화면 전환
		    this.cameras.main.once('camerafadeoutcomplete', () => {		// 페이드 아웃이 끝나면
		      if (this.hasBeatenBoss) {
		        // 보스를 이긴 뒤(무한 스테이지 도중) 사망 → 결과와 함께 클리어 화면
		        this.scene.start('ClearScene', {
		          kills: this.totalKillCount,
		          time: survivalSeconds
		        });
		      } else {
		        // 보스를 못 이기고 사망 → 기존처럼 게임오버 화면
		        this.scene.start('GameOverScene');
		      }
		    });
		  }
		  
		  // 적 생성
		  spawnRandomEnemy() {
		    // 현재 스테이지에서 활성화된 적 종류 중 랜덤으로 하나 선택
		    const randomType = Phaser.Utils.Array.GetRandom(this.activeEnemyTypes);
		    this.spawnEnemy(randomType);		// 선택된 적을 실제 생성
		  }
		
		  // 스테이지 & 웨이브 시스템
		  startStageSystem() {
		    this.currentStageIndex = 0;    		// 0 = 스테이지1
		    this.currentWaveIndex = 0;     		// 0 = 웨이브1 (스테이지4는 웨이브 개념 없음)
		    this.waveKillCount = 0;				// 현재 웨이브에서 처치한 수
		    this.totalKillCount = 0;			// 게임 전체 처치 수
		    this.spawningEnabled = false;		// 현재 적 생성 비활성화
		    this.isWaveTransitioning = false;	// 웨이브 전환 중인지 저장
	
		    if (typeof DEBUG_STAGE !== 'undefined' && DEBUG_STAGE >= 1 && DEBUG_STAGE <= 5) {
			    // 디버그로 시작할 스테이지 설정
			    // DEBUG_STAGE는 1~4
			    // currentStageIndex는 0~3
			    this.currentStageIndex = DEBUG_STAGE - 1;
			    // 웨이브는 항상 1웨이브부터 시작
			    this.currentWaveIndex = 0;
			    this.waveKillCount = 0;
			    // 4스테이지는 보스전이므로 웨이브 설정이 필요 없음
			    if (DEBUG_STAGE === 4) {
			        this.updateHUD();
			        this.showStageAnnouncement(4, () => {
			            this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
			                this.startBossFight();
			            });
			        });
			        return;
			    } else if(DEBUG_STAGE === 5) {
					this.startInfiniteTransition();
					return;
				}
			    // 1~3스테이지는 해당 스테이지의 1웨이브 설정을 가져옴
			    const waveConfig =
			        GameConfig.STAGE_WAVES[
			            this.currentStageIndex
			        ][
			            this.currentWaveIndex
			        ];
			    // 현재 웨이브의 적 종류와 생성 간격 설정
			    this.activeEnemyTypes = waveConfig.enemyTypes;
			    this.currentSpawnInterval = waveConfig.spawnInterval;
			    this.updateHUD();
			    this.showStageAnnouncement(DEBUG_STAGE, () => {
			        this.showWaveAnnouncement(() => {
			            this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
			                this.beginWaveSpawning();
			            });
			        });
			    });
			    return;
			}

		    const waveConfig = GameConfig.STAGE_WAVES[this.currentStageIndex][this.currentWaveIndex];
		    this.activeEnemyTypes = waveConfig.enemyTypes;			// 현재 웨이브에서 등장 가능한 적 종류 저장
		    this.currentSpawnInterval = waveConfig.spawnInterval;	// 적 생성 간격 저장
	
		    this.updateHUD();	// HUD 갱신
	
		    this.showStageAnnouncement(this.currentStageIndex + 1, () => {		// 화면에 스테이지 문구 표시
		      this.showWaveAnnouncement(() => {
		        this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
		          this.beginWaveSpawning();
		        });
		      });
		    });
		  }
		
		  // 웨이브 적 생성 시작
		  beginWaveSpawning() {
		    this.spawningEnabled = true;	// 적 생성 활성화
		    this.scheduleNextEnemySpawn();	// 다음 적 생성 예약
		  }
		  
		  // ===== 보스전 (스테이지4) =====
		  startBossFight() {
		    this.spawningEnabled = false; // 일반 잡몹은 등장하지 않음 (보스전 전용)
		    this.sound.play('sfxBossEntry', { volume: 1 });
		    this.spawnBoss();
		  }
		
		  spawnBoss() {
		    const startX = GameConfig.WIDTH / 2;
		    const halfSize = GameConfig.BOSS.size / 2;
		    const startY = -halfSize;
		
		    const boss = this.physics.add.sprite(startX, startY, 'shipsBig', 23); // 원하는 보스 프레임 번호로 교체
		    boss.setDisplaySize(GameConfig.BOSS.size, GameConfig.BOSS.size);
		
		    boss.hp = GameConfig.BOSS.hp;
		    boss.maxHp = GameConfig.BOSS.hp;
		    boss.isVisible = false;   // 등장 연출이 끝나기 전까지는 피격 불가
		    boss.phase = 1;
		    boss.state = 'entering';
		    boss.halfSize = halfSize;
		
		    this.boss = boss;
		
		    // 보스 전용 충돌 판정 그룹 (일반 적 그룹과 분리해서, 일반 처치/도망 로직과 안 섞이게 함)
		    this.bossGroup = this.physics.add.group();
		    this.bossGroup.add(boss);                              // 그룹 추가를 먼저 (속도 초기화 방지)
		
		    boss.body.setVelocityY(GameConfig.BOSS.entrySpeed);    // 속도 설정은 그 다음
		
		    this.physics.add.overlap(this.playerBullets, this.bossGroup, this.handlePlayerBulletHitBoss, null, this);
		
		    // 체력바 (배경 + 채워지는 바) — 너비를 보스의 한 변 크기와 동일하게 설정
		    const hpBarWidth = GameConfig.BOSS.size;
		    this.bossHpBarBg = this.add.rectangle(startX, startY, hpBarWidth, 10, 0x333333);
		    this.bossHpBarFill = this.add.rectangle(startX - hpBarWidth / 2, startY, hpBarWidth, 10, 0xff4444).setOrigin(0, 0.5);
		  }
		
		  updateBossMovement() {
		    if (!this.boss || !this.boss.active) {
		      return;
		    }
		
		    // 등장 연출: 목표 y좌표까지 내려오는 중
		    if (this.boss.state === 'entering') {
		      if (this.boss.y >= GameConfig.BOSS.entryTargetY) {
		        this.boss.y = GameConfig.BOSS.entryTargetY;
		        this.boss.body.setVelocity(0, 0);
		        this.boss.isVisible = true;
		        this.boss.state = 'moving';
		
		        this.pickNewBossMoveTarget();
		        this.startBossAttackLoop();
		        this.startBossCoordAttackLoop();
		      }
		      return;
		    }
		
		    if (this.boss.state !== 'moving') {
		      return; // 'waiting' 상태 (목표 지점에서 대기 중)
		    }
		
		    const dx = this.boss.targetX - this.boss.x;
		    const dy = this.boss.targetY - this.boss.y;
		    const distance = Math.sqrt(dx * dx + dy * dy);
		
		    if (distance < GameConfig.BOSS.moveArriveThreshold) {
		      this.boss.body.setVelocity(0, 0);
		      this.boss.state = 'waiting';
		
		      const waitTime = Phaser.Math.Between(GameConfig.BOSS.moveWaitMin, GameConfig.BOSS.moveWaitMax);
		      this.time.delayedCall(waitTime, () => {
		        if (!this.boss || !this.boss.active) {
		          return;
		        }
		        this.pickNewBossMoveTarget();
		        this.boss.state = 'moving';
		      });
		      return;
		    }
		
		    const direction = new Phaser.Math.Vector2(dx, dy).normalize();
		    this.boss.body.setVelocity(
		      direction.x * GameConfig.BOSS.moveSpeed,
		      direction.y * GameConfig.BOSS.moveSpeed
		    );
		  }
		
		  pickNewBossMoveTarget() {
		    const bounds = GameConfig.BOSS.moveBounds;
		    this.boss.targetX = Phaser.Math.Between(bounds.minX, bounds.maxX);
		    this.boss.targetY = Phaser.Math.Between(bounds.minY, bounds.maxY);
		  }
		
		  updateBossHpBar() {
		    if (!this.boss || !this.bossHpBarBg) {
		      return;
		    }
		
		    const barY = this.boss.y - this.boss.halfSize - 16;
		    const hpBarWidth = GameConfig.BOSS.size;
		
		    this.bossHpBarBg.x = this.boss.x;
		    this.bossHpBarBg.y = barY;
		    this.bossHpBarFill.x = this.boss.x - hpBarWidth / 2;
		    this.bossHpBarFill.y = barY;
		    this.bossHpBarFill.scaleX = Phaser.Math.Clamp(this.boss.hp / GameConfig.BOSS.hp, 0, 1);
		  }
		
		  // ===== 보스 공격 패턴 =====
		
		  startBossAttackLoop() {
		    this.scheduleNextBossPattern();
		  }
		
		  scheduleNextBossPattern() {
		    const phaseConfig = (this.boss.phase === 1) ? GameConfig.BOSS.PHASE1 : GameConfig.BOSS.PHASE2;
		
		    this.bossPatternEvent = this.time.delayedCall(phaseConfig.attackInterval, () => {
		      if (!this.boss || !this.boss.active) {
		        return;
		      }
		
		      const patternName = Phaser.Utils.Array.GetRandom(phaseConfig.patterns);
		      this.executeBossPattern(patternName);
		      this.scheduleNextBossPattern();
		    });
		  }
		
		  executeBossPattern(patternName) {
		    const attacks = GameConfig.BOSS.ATTACKS;
		
		    if (patternName === 'straight') {
		      this.fireBossStraightSpread();
		    } else if (patternName === 'split') {
		      this.fireEnemyBullet(this.boss, attacks.split);
		    } else if (patternName === 'homing') {
		      this.fireEnemyBullet(this.boss, attacks.homing);
		    } else if (patternName === 'laser') {
		      this.startLaserCycle(this.boss, attacks.laser);
		    }
		  }
		
		  fireBossStraightSpread() {
		    const attack = GameConfig.BOSS.ATTACKS.straight;
		    const spreadAngles = [-15, 0, 15]; // 부채꼴 3way
		
		    spreadAngles.forEach((angleOffsetDeg) => {
		      //const bullet = this.add.circle(this.boss.x, this.boss.y, attack.bulletSize, attack.bulletColor);
		      const bullet = this.add.sprite(this.boss.x, this.boss.y, 'Projectiles', attack.bulletFrame);
		      bullet.setDisplaySize(attack.bulletSize * 2, attack.bulletSize * 2);
		      this.physics.add.existing(bullet);
		      this.enemyBullets.add(bullet);
		      bullet.attackPower = attack.attackPower;
		
		      const angleRad = Phaser.Math.DegToRad(90 + angleOffsetDeg); // 90도 = 아래 방향
		      bullet.body.setVelocity(
		        Math.cos(angleRad) * attack.bulletSpeed,
		        Math.sin(angleRad) * attack.bulletSpeed
		      );
		    });
		  }
		
		  // ===== 보스 좌표(표식) 공격 =====
		
		  startBossCoordAttackLoop() {
		    this.scheduleNextBossCoordAttack();
		  }
		
		  scheduleNextBossCoordAttack() {
		    this.bossCoordEvent = this.time.delayedCall(GameConfig.BOSS.COORD_ATTACK_INTERVAL, () => {
		      if (!this.boss || !this.boss.active) {
		        return;
		      }
		
		      const count = (this.boss.phase === 1)
		        ? GameConfig.BOSS.COORD_MARKER_COUNT_PHASE1
		        : GameConfig.BOSS.COORD_MARKER_COUNT_PHASE2;
		
		      for (let i = 0; i < count; i++) {
		        this.spawnMarker();
		      }
		
		      this.scheduleNextBossCoordAttack();
		    });
		  }
		
		  // ===== 보스 피격 / 페이즈 전환 / 처치 =====
		
		  handlePlayerBulletHitBoss(obj1, obj2) {
		    if (this.isGameOver) {
		      return; // 이미 게임이 종료 처리 중이면(플레이어 사망 등) 보스 피격도 무시
		    }
		
		    const boss = (obj1 === this.boss) ? obj1 : obj2;
		    const bullet = (boss === obj1) ? obj2 : obj1;
		
		    if (!boss.isVisible) {
		      return; // 등장 연출 중에는 피격 무시
		    }
		
		    //this.spawnBurstEffect(bullet.x, bullet.y, boss.fillColor, GameConfig.HIT_EFFECT_RADIUS, GameConfig.HIT_EFFECT_DURATION);
		    this.spawnBurstEffect(bullet.x, bullet.y, 0xffaa00, GameConfig.HIT_EFFECT_RADIUS, GameConfig.HIT_EFFECT_DURATION); // 보스는 이미지라 fillColor가 없으므로 고정 색상 사용
		    bullet.destroy();
		
		    boss.hp -= this.playerAttackPower;
		    if (boss.hp < 0) {
		      boss.hp = 0;
		    }
		
		    if (boss.phase === 1 && boss.hp <= GameConfig.BOSS.phase2Threshold) {
		      this.transitionBossToPhase2();
		    }
		
		    if (boss.hp <= 0) {
		      this.handleBossDefeated();
		    }
		  }
		
		  transitionBossToPhase2() {
		    this.boss.phase = 2;
		
		    // 기존 패턴 타이머를 취소하고 2페이즈 간격으로 즉시 재시작
		    if (this.bossPatternEvent) {
		      this.bossPatternEvent.remove(false);
		    }
		    this.scheduleNextBossPattern();
		
		    // 페이즈 전환 시각 효과 (짧게 흰색으로 번쩍임) — 이미지 스프라이트는 setTint 사용
		    this.boss.setTint(0xffffff);
		    this.time.delayedCall(150, () => {
		      if (this.boss && this.boss.active) {
		        this.boss.clearTint(); // 원래 이미지 색상으로 복구
		      }
		    });
		  }
		
  		  handleBossDefeated() {
			this.sound.play('sfxBossDeath', { volume: 0.8 });
		    // 주의: isGameOver는 여기서 true로 만들지 않음 — 보스를 잡아도 게임은 계속 진행(무한 스테이지)되어야 하기 때문

		    if (this.bossPatternEvent) {
		      this.bossPatternEvent.remove(false);
		    }
		    if (this.bossCoordEvent) {
		      this.bossCoordEvent.remove(false);
		    }
		
		    this.spawnBurstEffect(this.boss.x, this.boss.y, 0xffffff, 60, 700);
		
		    this.totalKillCount++;
		    this.updateHUD();
		
		    if (this.bossHpBarBg) {
		      this.bossHpBarBg.destroy();
		    }
		    if (this.bossHpBarFill) {
		      this.bossHpBarFill.destroy();
		    }
		
		    this.destroyEnemy(this.boss); // 레이저/경고선 관련 타이머·그래픽까지 기존 함수로 한 번에 정리
		    this.boss = null;
		
		    this.startInfiniteTransition(); // 클리어 화면 대신 무한 스테이지 진입 연출로 이동
		  }
		  
  		  // ===== 무한 스테이지 (보스 이후) =====
		  startInfiniteTransition() {
		    const centerX = GameConfig.WIDTH / 2;
		    const centerY = GameConfig.HEIGHT / 2;

		    const text = this.add.text(centerX, centerY, 'BOSS CLEAR!\nENDLESS MODE START', {
		      fontSize: '34px',
		      fontStyle: 'bold',
		      color: '#ffe066',
		      align: 'center',
		      stroke: '#000000',
		      strokeThickness: 6
		    }).setOrigin(0.5).setAlpha(0).setDepth(1000);

		    this.tweens.add({
		      targets: text,
		      alpha: 1,
		      duration: GameConfig.TEXT_FADE_IN,
		      onComplete: () => {
		        this.time.delayedCall(GameConfig.TEXT_HOLD, () => {
		          this.tweens.add({
		            targets: text,
		            alpha: 0,
		            duration: GameConfig.TEXT_FADE_OUT,
		            onComplete: () => {
		              text.destroy();
		              this.startInfiniteStage();
		            }
		          });
		        });
		      }
		    });
		  }

		  startInfiniteStage() {
		    this.hasBeatenBoss = true;
		    this.isInfiniteStage = true;
		    this.infiniteStartTime = this.time.now;
		    this.infinitePlayTime = 0;

		    this.activeEnemyTypes = [
		      GameConfig.ENEMY_TYPES.TYPE1,
		      GameConfig.ENEMY_TYPES.TYPE2,
		      GameConfig.ENEMY_TYPES.TYPE3,
		      GameConfig.ENEMY_TYPES.TYPE4
		    ];
		    this.spawningEnabled = true;
		    this.updateHUD();

		    this.scheduleNextInfiniteSpawn();
		    this.scheduleNextHeart();
		  }

		  scheduleNextInfiniteSpawn() {
		    // 생존 시간이 길어질수록 생성 간격이 점점 짧아짐 (최소값 밑으로는 안 내려감)
		    const elapsedSeconds = (this.time.now - this.infiniteStartTime) / 1000;
		    const interval = Math.max(
		      GameConfig.INFINITE.minSpawnInterval,
		      GameConfig.INFINITE.baseSpawnInterval - elapsedSeconds * GameConfig.INFINITE.intervalDecreasePerSecond
		    );

		    this.time.delayedCall(interval, () => {
		      if (!this.spawningEnabled || this.isGameOver) {
		        return;
		      }

		      const type = Phaser.Utils.Array.GetRandom(this.activeEnemyTypes);

		      if (Math.random() < GameConfig.INFINITE.sideSpawnChance) {
		        this.spawnSideEnemy(type);
		      } else {
		        this.spawnEnemy(type);
		      }

		      this.scheduleNextInfiniteSpawn();
		    });
		  }

		  // 화면 좌우 가장자리(상단 1/3 영역)에서 대각선으로 진입하는 적 생성
		  spawnSideEnemy(type) {
		    const halfSize = type.size / 2;
		    const fromLeft = Math.random() < 0.5;
		    const spawnX = fromLeft ? -halfSize : GameConfig.WIDTH + halfSize;
		    const spawnY = Phaser.Math.Between(halfSize, GameConfig.INFINITE.sideSpawnYMax);

		    const enemy = this.physics.add.sprite(spawnX, spawnY, 'ships', type.enemyFrame);
		    enemy.setDisplaySize(type.size, type.size);

		    this.enemies.add(enemy); // 그룹 추가를 먼저 (속도 초기화 방지)

		    const directionX = fromLeft ? 1 : -1;
		    enemy.body.setVelocity(directionX * type.speed, type.speed); // 대각선(가로+세로) 방향

		    enemy.hp = type.hp;
		    enemy.maxHp = type.hp;
		    enemy.attackPower = type.attackPower;
		    enemy.effectColor = type.color;
		    enemy.isVisible = false;
		    enemy.spawnSide = fromLeft ? 'left' : 'right'; // 화면 진입 판정 방식을 구분하기 위한 표시

		    if (type.laserDuration) {
		      enemy.fireEvent = this.time.addEvent({
		        delay: type.fireRate,
		        callback: () => this.startLaserCycle(enemy, type),
		        loop: true
		      });
		    } else {
		      enemy.fireEvent = this.time.addEvent({
		        delay: type.fireRate,
		        callback: () => this.fireEnemyBullet(enemy, type),
		        loop: true
		      });
		    }
		  }

		  // ===== 하트 회복 아이템 =====

		  scheduleNextHeart() {
		    const delay = Phaser.Math.Between(GameConfig.HEART.minInterval, GameConfig.HEART.maxInterval);

		    this.time.delayedCall(delay, () => {
		      if (!this.isGameOver && this.isInfiniteStage) {
		        this.spawnHeart();
		        this.scheduleNextHeart();
		      }
		    });
		  }

  		  spawnHeart() {
		    const spawnX = Phaser.Math.Between(40, GameConfig.WIDTH - 40);
		
		    const heart = this.createHeartShape(spawnX, -20);
		
		    this.physics.add.existing(heart);
		    this.hearts.add(heart); // 그룹 추가를 먼저
		
		    heart.body.setVelocityY(GameConfig.HEART.speed);
		  }
		
		  // 하트 모양을 그래픽으로 직접 그려서 컨테이너로 반환 (색상을 확실하게 지정하기 위해 이모지 대신 도형 사용)
		  createHeartShape(x, y) {
		    const size = GameConfig.HEART.fontSize;
		    const color = GameConfig.HEART.color;
		
		    const graphics = this.add.graphics();
		    graphics.fillStyle(color, 1);
		
		    const s = size / 2;
		    // 원 두 개(하트 윗부분) + 삼각형(하트 아랫부분)을 조합해서 하트 모양 생성
		    graphics.fillCircle(-s * 0.5, -s * 0.3, s * 0.5);
		    graphics.fillCircle(s * 0.5, -s * 0.3, s * 0.5);
		    graphics.fillTriangle(
		      -s, -s * 0.15,
		      s, -s * 0.15,
		      0, s
		    );
		
		    const container = this.add.container(x, y, [graphics]);
		    container.setSize(size, size); // 물리 body 크기 계산을 위해 컨테이너 크기 지정

		    return container;
		  }

		  cleanupHearts() {
		    this.hearts.getChildren().forEach((heart) => {
		      if (heart.y > GameConfig.HEIGHT + 30) {
		        heart.destroy();
		      }
		    });
		  }

		  handlePlayerHeartPickup(player, heart) {
		    heart.destroy();

		    const previousHP = this.playerHP;
			
			this.playerHP = Math.min(
			  GameConfig.PLAYER_MAX_HP,
			  this.playerHP + GameConfig.HEART.healAmount
			);
			
			if (this.playerHP > previousHP) {
			  this.sound.play('sfxHeal', { volume: 0.7 });
			}
		    this.updateHUD();

		    this.spawnBurstEffect(player.x, player.y, 0x66ff99, 14, 200);
		  }
		
		  // 적 생성 예약
		  scheduleNextEnemySpawn() {
		    this.time.delayedCall(this.currentSpawnInterval, () => {	// 적 생성 간격
		      if (!this.spawningEnabled) {		// 웨이브가 끝나면 적 생성 정지
		        return; // 웨이브/스테이지 전환 중이면 생성 체인을 여기서 멈춤
		      }
		
		      this.spawnRandomEnemy();			// 랜덤 적 생성
		      this.scheduleNextEnemySpawn();	// 다음 적 생성 예약
		    });
		  }
		
	  	  // 적을 실제로 처치했을 때만 호출 (화면 밖으로 도망친 경우는 호출하지 않음)
		  registerEnemyKill() {
		    this.totalKillCount++;		// 전체 킬 수 증가
		    
		    const isInfiniteStage = (this.isInfiniteStage === true);
		    const isBossStage = (this.currentStageIndex === 3);
		    if(isInfiniteStage) {
				this.updateHUD();
				return;
			} else if (isBossStage) {
		      this.updateHUD();			// HUD 갱신 (보스전은 누적 처치수만 표시하므로 여기서 갱신해도 충분)
		      return; // 스테이지4(보스전)는 웨이브 목표치가 없음
		    }
	
		    this.waveKillCount++;		// 현재 웨이브 킬 수 증가 → HUD 갱신보다 먼저 반영되도록 순서 조정
		    this.updateHUD();			// HUD 갱신 (증가된 값이 정확히 반영된 상태로 표시)
	
		    const waveConfig = GameConfig.STAGE_WAVES[this.currentStageIndex][this.currentWaveIndex];
		    if (this.waveKillCount >= waveConfig.killTarget) {
		      this.onWaveKillTargetReached();
		    }
		  }
		
		  onWaveKillTargetReached() {
			  // 목표 달성 즉시 신규 적 생성 중단
			  this.spawningEnabled = false;
			
			  // 남아있는 적 탄환 전체 제거
			  this.clearEnemyBullets();
			
			  // 남아있는 모든 적을 복사해서 배열로 만듦
			  const remainingEnemies = [...this.enemies.getChildren()];
			  // 남아있는 모든 적 하나씩 제거
			  remainingEnemies.forEach((enemy) => {
			    if (!enemy.active) {	// 이미 제거된 적이면 무시
			      return;
			    }
			
			    // 남아있는 적 제거시 플레이어가 직접 처치했을 때와 동일한 사망 이펙트
			    this.spawnBurstEffect(
			      enemy.x,
			      enemy.y,
			      enemy.effectColor,
			      GameConfig.ENEMY_DEATH_EFFECT_RADIUS,
			      GameConfig.ENEMY_DEATH_EFFECT_DURATION
			    );
			
			    // 실제 처치 수에는 추가하지 않음
			    this.destroyEnemy(enemy);		// 적을 제거
			  });
			
			  // 다음 웨이브 / 다음 스테이지
			  const isLastWaveOfStage = (this.currentWaveIndex >= 2);
			
			  if (!isLastWaveOfStage) {			// 마지막 웨이브가 아니면
			    this.advanceToNextWave();		// 다음 웨이브
			  } else {							// 마지막 웨이브면
			    this.advanceToNextStage();		// 다음 스테이지
			  }
		  }
		
		  /*
		  // 적 제거 확인 함수
		  waitForAllEnemiesCleared(onCleared) {
		    const checkEvent = this.time.addEvent({
		      delay: 200,
		      loop: true,
		      callback: () => {
		        if (this.enemies.getLength() === 0) {
		          checkEvent.remove(false);
		          onCleared();
		        }
		      }
		    });
		  }
		  */
		
		  advanceToNextWave() {
		    this.time.delayedCall(GameConfig.WAVE_CLEAR_WAIT, () => {		// 웨이브 클리어 후 일정 시간 대기
		      this.currentWaveIndex++;				// 다음 웨이브로 이동
		      this.waveKillCount = 0;				// 웨이브 킬 수 초기화
		      this.isWaveTransitioning = false;		// 웨이브 전환 상태 해제
		
			  // 새 웨이브 설정 가져오기
		      const waveConfig = 
		      	GameConfig.STAGE_WAVES[
						this.currentStageIndex
					][
						this.currentWaveIndex
					];
		      this.activeEnemyTypes = waveConfig.enemyTypes;			// 등장 적 변경
		      this.currentSpawnInterval = waveConfig.spawnInterval;		// 적 생성 속도 변경
		      this.updateHUD();											// HUD 갱신
		
			  // 웨이브 문구 표시
		      this.showWaveAnnouncement(() => {
		        this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
		          this.beginWaveSpawning();
		        });
		      });
		    });
		  }
		
		  // 다음 스테이지
		  // 스테이지 하나가 완전히 끝났을 때 실행
		  advanceToNextStage() {
		    const centerX = GameConfig.WIDTH / 2;		// 화면 중앙 좌표
		    const centerY = GameConfig.HEIGHT / 2;		// 화면 중앙 좌표
		
		 	// 화면 중앙에 스테이지 클리어 문구 표시
		    const stageClearText = this.add.text(centerX, centerY, 'STAGE CLEAR', {
		      fontSize: '44px',
		      fontStyle: 'bold',
		      color: '#ffe066',
		      stroke: '#000000',
		      strokeThickness: 6
		    }).setOrigin(0.5).setDepth(1000);
		
		    // 문구 표시와 동시에 화면 전체 페이드 아웃
		    this.cameras.main.fadeOut(GameConfig.SCREEN_FADE_DURATION, 0, 0, 0);
		
			// 페이드 아웃 후 다음 로직 실행
		    this.cameras.main.once('camerafadeoutcomplete', () => {
		      stageClearText.destroy();				// 스테이지 클리어 문구 제거
		
		      this.currentStageIndex++;				// 다음 스테이지
		      this.currentWaveIndex = 0;			// 다음 스테이지의 첫 웨이브부터 시작
		      this.waveKillCount = 0;				// 웨이브 킬 수 초기화
		      
		      // 스테이지 클리어 시 체력 전체 회복
		      this.playerHP = GameConfig.PLAYER_MAX_HP;
		      this.updateHUD();
		      
		      this.isWaveTransitioning = false;
		
		      if (this.currentStageIndex === 3) {	// 4스테이지라면
		        // 스테이지4 (보스전) 구성 적용
		        this.activeEnemyTypes = GameConfig.STAGE4_CONFIG.enemyTypes;		// 보스 스테이지 전용 적을 사용
		        this.currentSpawnInterval = GameConfig.STAGE4_CONFIG.spawnInterval;	// 보스 스테이지 적 생성 간격
		      } else {																// 일반 스테이지라면
		        const waveConfig = GameConfig.STAGE_WAVES[this.currentStageIndex][0];// 다음 스테이지 첫 번째 웨이브 설정 가져오기
		        this.activeEnemyTypes = waveConfig.enemyTypes;			// 새로운 적 종류
		        this.currentSpawnInterval = waveConfig.spawnInterval;	// 생성 간격 적용
		      }
		
		      this.updateHUD();
		
		      // 다음 스테이지 번호 문구를 미리 만들어두고, 화면 페이드인과 동시에 등장시킴
		      // 스테이지 번호 표시
		      const stageNumberText = this.add.text(centerX, centerY, 'STAGE ' + (this.currentStageIndex + 1), {
		        fontSize: '56px',
		        fontStyle: 'bold',
		        color: '#ffffff',
		        stroke: '#000000',
		        strokeThickness: 6
		      }).setOrigin(0.5).setAlpha(0).setDepth(1000);	// setAlpha(0) 처음에는 투명
		
		      this.cameras.main.fadeIn(GameConfig.SCREEN_FADE_DURATION, 0, 0, 0);	// 화면 밝힘
		
		      this.tweens.add({				// 애니메이션 생성
		        targets: stageNumberText,					// 텍스트가 투명에서 불투명하게 나타남 
		        alpha: 1,									// 텍스트가 투명에서 불투명하게 나타남 
		        duration: GameConfig.SCREEN_FADE_DURATION,	// 텍스트가 투명에서 불투명하게 나타남 
		        onComplete: () => {
		          this.time.delayedCall(GameConfig.TEXT_HOLD, () => {
		            this.tweens.add({
		              targets: stageNumberText,
		              alpha: 0,
		              duration: GameConfig.TEXT_FADE_OUT,
		              onComplete: () => {
		                stageNumberText.destroy();
		
		                const isBossStage = (this.currentStageIndex === 3);
		
		                if (isBossStage) {
		                  // 보스전은 별도 웨이브 문구 없이 바로 보스 등장
		                  this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
		                    this.startBossFight();
		                  });
		                } else {	// 스테이지 번호 연출이 끝난 뒤 일반 스테이지라면 웨이브 안내 표시
		                  this.showWaveAnnouncement(() => {
		                    this.time.delayedCall(GameConfig.SPAWN_DELAY_AFTER_TEXT, () => {
		                      this.beginWaveSpawning();
		                    });
		                  });
		                }
		              }
		            });
		          });
		        }
		      });
		    });
		  }
		
		  // 스테이지 시작 문구를 보여주는 함수
		  // onComplete는 애니메이션이 끝난 후 실행할 함수
		  showStageAnnouncement(stageNumber, onComplete) {
		    const centerX = GameConfig.WIDTH / 2;
		    const centerY = GameConfig.HEIGHT / 2;
		
		    const announceText = this.add.text(centerX, centerY, 'STAGE ' + stageNumber, {
		      fontSize: '56px',
		      fontStyle: 'bold',
		      color: '#ffffff',
		      stroke: '#000000',
		      strokeThickness: 6
		    }).setOrigin(0.5).setAlpha(0).setDepth(1000);
		
		    this.tweens.add({
		      targets: announceText,
		      alpha: 1,
		      duration: GameConfig.TEXT_FADE_IN,
		      onComplete: () => {
		        this.time.delayedCall(GameConfig.TEXT_HOLD, () => {
		          this.tweens.add({
		            targets: announceText,
		            alpha: 0,
		            duration: GameConfig.TEXT_FADE_OUT,
		            onComplete: () => {
		              announceText.destroy();
		              if (onComplete) {
		                onComplete();
		              }
		            }
		          });
		        });
		      }
		    });
		  }
		
		  showWaveAnnouncement(onComplete) {
		    const centerX = GameConfig.WIDTH / 2;
		    const centerY = GameConfig.HEIGHT / 2;
		    const label = (this.currentStageIndex + 1) + '-' + (this.currentWaveIndex + 1);
		
		    const waveText = this.add.text(centerX, centerY, label, {	// 화면 중앙에 웨이브 번호 표시
		      fontSize: '48px',
		      fontStyle: 'bold',
		      color: '#ffffff',
		      stroke: '#000000',
		      strokeThickness: 6
		    }).setOrigin(0.5).setAlpha(0).setDepth(1000);
		
		    this.tweens.add({
		      targets: waveText,
		      alpha: 1,
		      duration: GameConfig.TEXT_FADE_IN,
		      onComplete: () => {
		        this.time.delayedCall(GameConfig.TEXT_HOLD, () => {
		          this.tweens.add({
		            targets: waveText,
		            alpha: 0,
		            duration: GameConfig.TEXT_FADE_OUT,
		            onComplete: () => {
		              waveText.destroy();
		              if (onComplete) {
		                onComplete();
		              }
		            }
		          });
		        });
		      }
		    });
		  }
		
		  // 적 생성
		  spawnEnemy(type) {
		    const halfSize = type.size / 2;						// 적 크기의 절반을 계산
		    const minX = halfSize + 20;							// 적이 화면 가장자리에 너무 붙지 않도록 설정
		    const maxX = GameConfig.WIDTH - halfSize - 20;		// 적이 화면 가장자리에 너무 붙지 않도록 설정
		    const spawnX = Phaser.Math.Between(minX, maxX);   	// 랜덤 x좌표
		    const spawnY = -halfSize - GameConfig.ENEMY_SPAWN_OFFSET_Y;  // 화면 위 훨씬 먼 곳에서 시작 (여기서부터 이미 공격 시작)
		
		    const enemy = this.physics.add.sprite(spawnX, spawnY, 'ships', type.enemyFrame);
		    enemy.setDisplaySize(type.size, type.size);
	
		    this.enemies.add(enemy);                            // 그룹 추가를 먼저 (속도 초기화 방지)
	
		    enemy.body.setVelocityY(type.speed);				// 적을 아래쪽으로 이동시킴
	
		    // 적 개별 상태값
		    enemy.hp = type.hp;							// 현재 hp
		    enemy.maxHp = type.hp;						// 최대 hp
		    enemy.attackPower = type.attackPower;		// 공격력
		    enemy.isVisible = false;   // 화면에 보이기 전 = 피격 불가
		    enemy.effectColor = type.color;			// fillColor 대체용 — 피격/사망 이펙트에 사용할 색상 저장
		
		    // 적마다 개별 공격 타이머 (레이저 타입이면 레이저 사이클, 아니면 일반 발사체)
		    if (type.laserDuration) {
		      enemy.fireEvent = this.time.addEvent({				// 적마다 독립적인 공격 타이머 생성
		        delay: type.fireRate,
		        callback: () => this.startLaserCycle(enemy, type),	// 레이저 적이면 레이저 사이클 시작
		        loop: true
		      });
		    } else {
		      enemy.fireEvent = this.time.addEvent({
		        delay: type.fireRate,
		        callback: () => this.fireEnemyBullet(enemy, type),	// 일반 적이면 fireEnemyBullet 실행
		        loop: true
		      });
		    }
		  }
		
		  // 적 발사체 발사
		  fireEnemyBullet(enemy, type) {
		    if (!enemy.active) {
		      return; // 이미 제거된 적이면 발사하지 않음 (에러 방지)
		    }
			
    	    const bullet = this.add.sprite(		// 적 위치에서 발사체 생성
			  enemy.x,
			  enemy.y,
			  'Projectiles',
			  type.bulletFrame
			);
			bullet.setDisplaySize(type.bulletSize * 4, type.bulletSize * 4); // 기존 원 반지름(bulletSize) 기준 지름으로 환산
	
			this.physics.add.existing(bullet);		// 물리 적용
			this.enemyBullets.add(bullet);			// 적 발사체 그룹에 추가
			
			bullet.attackPower = type.attackPower;	// 발사체 자체에 공격력을 저장
		
		    if (type.bulletTurnRate) {		// 유도탄 속성이 존재하는지 확인
		      // 유도탄: 발사 시점에 플레이어를 향한 방향으로 초기 속도 설정
		      const angle =					// 발사체 -> 플레이어 방향의 각도를 계산
		      	Phaser.Math.Angle.Between(
					bullet.x,
					bullet.y,
					this.player.x,
					this.player.y
				);
		      bullet.body.setVelocity(		// 계산한 방향으로 발사체를 움직임
		        Math.cos(angle) * type.bulletSpeed,
		        Math.sin(angle) * type.bulletSpeed
		      );
		      bullet.rotation = angle + Math.PI / 2; // 이미지가 위쪽을 향하고 있어 90도 보정
		
		      bullet.isHoming = true;		// 유도탄임을 표시
		      bullet.homingSpeed = type.bulletSpeed;	// 유도 중 속도 저장
		      bullet.turnRateRad = Phaser.Math.DegToRad(type.bulletTurnRate);	// 회전 속도를 degree->radian으로 변환
		    } else {
		      bullet.body.setVelocityY(type.bulletSpeed);           // 아래쪽(플레이어 방향)으로 발사
		      bullet.rotation = Math.PI; // 아래쪽으로 고정 발사이므로 180도 회전 (위를 향한 이미지를 아래로)
		    }
		
		    // 분열 속성이 있는 타입이면, 일정 시간 후 분열하는 타이머 예약
		    if (type.splitDelay) {								// 분열 속성이 있으면
		      this.time.delayedCall(type.splitDelay, () => {	// 일정 시간이 지나면 분열
		        this.splitBullet(bullet, type);
		      });
		    }
		  }
		  
		  // 매 프레임 유도탄 방향을 수정
		  updateHomingBullets(delta) {
		    const deltaSeconds = delta / 1000;	// delta의 밀리초 단위를 초 단위로 변환
		
		    this.enemyBullets.getChildren().forEach((bullet) => {	// 모든 적 발사체를 확인
		      if (!bullet.isHoming) {
		        return; // 유도탄이 아니거나 이미 유도가 끝난 발사체는 건너뜀
		      }
		
      	      // 발사체가 플레이어와 같은 y좌표-100에 도달(또는 지나침)하면 유도 종료 → 직진 전환
		      if (bullet.y >= this.player.y - 50) {
		        bullet.isHoming = false;
		        bullet.setTint(0x9e9e9e);	// 유도 종료 후 회색으로 틴트 처리
		        return;
		      }
		
		      const desiredAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
		      const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
		
		      // 현재 각도에서 목표 각도로, 이번 프레임에 회전 가능한 만큼만 부드럽게 회전
		      const newAngle = Phaser.Math.Angle.RotateTo(
		        currentAngle,
		        desiredAngle,
		        bullet.turnRateRad * deltaSeconds
		      );
		
		      bullet.body.setVelocity(
		        Math.cos(newAngle) * bullet.homingSpeed,
		        Math.sin(newAngle) * bullet.homingSpeed
		      );
		      bullet.rotation = newAngle + Math.PI / 2; // 방향이 바뀔 때마다 이미지도 같이 회전
		    });
		  }
		  
		  startLaserCycle(enemy, type) {
		    if (!enemy.active) {
		      return;
		    }
		
		    if (enemy.laserCycleActive) {
		      return; // 이미 진행 중인 레이저 사이클이 있으면 새로 시작하지 않음 (그래픽/타이머 덮어쓰기 방지)
		    }
		    enemy.laserCycleActive = true;
		
		    const warningWidth = type.size / 4;   // 실제 레이저 두께(size/2)의 절반
		    const offsetX = type.laserOffsetX || 0;	// 레이저 몸체와 동일한 오프셋 재사용
		    const offsetY = type.laserOffsetY || 0;
		    const originX = enemy.x + offsetX;
		    const originY = enemy.y + offsetY;
		
		    // 경고선 생성 (반투명, 얇은 사각형)
		    const warningGraphic = this.add.rectangle(
		      originX, originY, warningWidth, GameConfig.HEIGHT - originY, type.warningColor
		    ).setOrigin(0.5, 0).setAlpha(0.5);
		
		    enemy.warningGraphic = warningGraphic;	// 나중에 제거하거나 위치 업데이트를 위해 적 객체에 저장
		    enemy.warningWidth = warningWidth;
		    enemy.laserOffsetX = offsetX;	// 매 프레임 위치 갱신(sync)에서도 쓰기 위해 미리 저장
		    enemy.laserOffsetY = offsetY;
		
		    // 0.1초 간격으로 보임/안보임 반복 → 깜빡이는 효과
		    enemy.laserBlinkEvent = this.time.addEvent({
		      delay: type.warningBlinkInterval,
		      loop: true,
		      callback: () => {
		        warningGraphic.visible = !warningGraphic.visible;	// 현재 보이면 숨기고, 숨겨져 있으면 보인다
		      }
		    });
		
		    // 경고 시간이 끝나면 실제 레이저 발사 시작
		    enemy.warningEndEvent = this.time.delayedCall(type.warningDuration, () => {
		      this.startLaserActive(enemy, type);
		    });
		  }
		
		  // 실제 레이저 발사
		  startLaserActive(enemy, type) {
		    // 경고선 정리
		    if (enemy.laserBlinkEvent) {
		      enemy.laserBlinkEvent.remove(false);
		      enemy.laserBlinkEvent = null;
		    }
		    if (enemy.warningGraphic) {
		      enemy.warningGraphic.destroy();
		      enemy.warningGraphic = null;
		    }
		
		    if (!enemy.active) {
		      return; // 경고 도중 적이 사라졌으면 레이저를 쏘지 않음
		    }
		
		    const width = type.size / 2;
		    const offsetX = type.laserOffsetX || 0;	// 좌우 미세 조정값 (설정 없으면 0)
		    const offsetY = type.laserOffsetY || 0;	// 상하 미세 조정값 (설정 없으면 0)
		    const originX = enemy.x + offsetX;
		    const originY = enemy.y + offsetY;
		    const length = GameConfig.HEIGHT - originY;	// 조정된 시작점부터 화면 맨 아래까지의 길이
		
		    // 위쪽 캡 (적 위치에 고정, 노치가 위를 향하도록 회전)
		    const capTop = this.add.sprite(originX, originY, 'Projectiles', type.laserCapTopFrame);
		    capTop.setDisplaySize(width, width);
		    capTop.rotation = -Math.PI / 2; // 방향이 이상하면 Math.PI / 2로 바꿔보세요
		
		    // 아래쪽 캡 (화면 맨 아래 고정, 노치가 아래를 향하도록 회전)
		    const capBottom = this.add.sprite(originX, GameConfig.HEIGHT, 'Projectiles', type.laserCapBottomFrame);
		    capBottom.setDisplaySize(width, width);
		    capBottom.rotation = Math.PI / 2; // 방향이 이상하면 -Math.PI / 2로 바꿔보세요
		
		    // 중간 몸체: 독립 텍스처를 쓰는 TileSprite로 만들어서 이음매 없이 반복 타일링됨
		    const laserMiddle = this.add.tileSprite(
		      originX, originY, width, length, 'laserMiddleTex'
		    ).setOrigin(0.5, 0);
		
		    enemy.laserCapTop = capTop;
		    enemy.laserCapBottom = capBottom;
		    enemy.laserMiddle = laserMiddle;
		    enemy.laserWidth = width;
		    enemy.laserOffsetX = offsetX;	// 매 프레임 위치 갱신에도 같은 오프셋을 쓰기 위해 저장
		    enemy.laserOffsetY = offsetY;
		    enemy.laserActive = true;		// 현재 레이저 공격 중임을 표시
		
		    // 레이저 유지 중 일정 간격마다 플레이어와 겹치는지 확인해 데미지
		    enemy.laserTickEvent = this.time.addEvent({
		      delay: type.laserTickInterval,
		      loop: true,
		      callback: () => this.checkLaserHitPlayer(enemy, type)
		    });
		
		    // 레이저 지속 시간이 끝나면 종료 처리
		    enemy.laserEndEvent = this.time.delayedCall(type.laserDuration, () => {
		      this.endLaser(enemy);
		    });
		  }
		
		  // 레이저 히트
		  // 레이저와 플레이어가 겹치는 좌표 계산 
		  checkLaserHitPlayer(enemy, type) {
		    if (!enemy.active || !enemy.laserActive) {
		      return;
		    }
		
		    const halfWidth = enemy.laserWidth / 2 + 20; 	// 20은 플레이어 크기 절반 보정
		    const withinX =									// 플레이어와 레이저 중심의 x차이가 레이저 폭 안인지 확인
		    	Math.abs(this.player.x - enemy.x)
		    	<= halfWidth;
		    const withinY = this.player.y >= enemy.y;    	// 플레이어가 레이저 아래쪽에 있는지 확인
		
		    if (withinX && withinY) {						// 위 두 조건이 모두 맞으면 데미지
		      this.damagePlayer(type.attackPower);
		    }
		  }
		
		  // 레이저 종료
		  // 레이저 타이머, 그래픽 제거
  		  endLaser(enemy) {
		    if (enemy.laserTickEvent) {
		      enemy.laserTickEvent.remove(false);
		      enemy.laserTickEvent = null;
		    }
		    if (enemy.laserMiddle) {
		      enemy.laserMiddle.destroy();
		      enemy.laserMiddle = null;
		    }
		    if (enemy.laserCapTop) {
		      enemy.laserCapTop.destroy();
		      enemy.laserCapTop = null;
		    }
		    if (enemy.laserCapBottom) {
		      enemy.laserCapBottom.destroy();
		      enemy.laserCapBottom = null;
		    }
		    enemy.laserActive = false;
		    enemy.laserCycleActive = false; // 사이클 완전히 종료 → 다음 레이저 패턴 선택 가능
		  }
		
		  // 적의 움직임 따라 레이저도 움직임
		  updateLasers() {
		    this.enemies.getChildren().forEach((enemy) => {
		      this.syncLaserGraphicsToOwner(enemy);
		    });
		
		    // 보스는 별도 그룹(bossGroup)에 있어서 위 순회에 안 잡히므로 따로 갱신
		    if (this.boss && this.boss.active) {
		      this.syncLaserGraphicsToOwner(this.boss);
		    }
		  }
		
  		  syncLaserGraphicsToOwner(owner) {
		    // 경고선이 소유자를 따라 이동하도록 매 프레임 위치/길이 갱신
		    if (owner.warningGraphic) {
		      const originX = owner.x + (owner.laserOffsetX || 0);
		      const originY = owner.y + (owner.laserOffsetY || 0);
		
		      owner.warningGraphic.x = originX;
		      owner.warningGraphic.y = originY;
		      owner.warningGraphic.setSize(owner.warningWidth, GameConfig.HEIGHT - originY);
		    }
		
		    // 레이저(캡 2개 + 타일링되는 중간 몸체)도 소유자를 따라 위치/길이 갱신
		    if (owner.laserMiddle) {
		      const originX = owner.x + (owner.laserOffsetX || 0);
		      const originY = owner.y + (owner.laserOffsetY || 0);
		      const length = GameConfig.HEIGHT - originY;
		
		      owner.laserCapTop.setPosition(originX, originY);
		
		      owner.laserMiddle.setPosition(originX, originY);
		      owner.laserMiddle.setSize(owner.laserWidth, length);
		
		      owner.laserCapBottom.setPosition(originX, originY + length); // 항상 화면 맨 아래에 위치
		    }
		  }
		  
		  splitBullet(bullet, type) {
		    // 분열 시점에 이미 사라진 발사체(화면 밖 정리 등)라면 무시
		    if (!bullet.active) {
		      return;
		    }
		
		    const splitX = bullet.x;	// 현재 위치 저장
		    const splitY = bullet.y;	// 현재 위치 저장
		
		    bullet.destroy();   // 원래 발사체 제거
		
		    // X자 대각선 4방향: 좌상, 우상, 좌하, 우하
		    const directions = [
		      { x: -1, y: -1 },
		      { x: 1, y: -1 },
		      { x: -1, y: 1 },
		      { x: 1, y: 1 }
		    ];
		
    	    directions.forEach((dir) => {
		      const splitBullet = this.add.sprite(splitX, splitY, 'Projectiles', type.splitBulletFrame);
		      splitBullet.setDisplaySize(type.splitBulletSize * 3, type.splitBulletSize * 3);
		      this.physics.add.existing(splitBullet);
		      this.enemyBullets.add(splitBullet);   // 그룹 추가를 먼저
		
		      const velocity = new Phaser.Math.Vector2(dir.x, dir.y).normalize();
		      splitBullet.body.setVelocity(
		        velocity.x * type.splitBulletSpeed,
		        velocity.y * type.splitBulletSpeed
		      );
		
		      splitBullet.attackPower = type.splitAttackPower;
		    });
		  }
		
		  // 매 프레임 모든 적 업데이트
  		  updateEnemies() {
		    this.enemies.getChildren().forEach((enemy) => {
		      // 화면 안으로 완전히 들어왔는지 판정 (진입 방향에 따라 기준이 다름)
		      if (!enemy.isVisible) {
		        if (enemy.spawnSide === 'left') {
		          if (enemy.x - enemy.displayWidth / 2 >= 0) {
		            enemy.isVisible = true;
		          }
		        } else if (enemy.spawnSide === 'right') {
		          if (enemy.x + enemy.displayWidth / 2 <= GameConfig.WIDTH) {
		            enemy.isVisible = true;
		          }
		        } else {
		          // 기존 상단 진입 (displayHeight 기준 — 이미지로 바뀐 뒤에도 정확한 시각적 크기를 쓰도록 수정)
		          if (enemy.y - enemy.displayHeight / 2 >= 0) {
		            enemy.isVisible = true;
		          }
		        }
		      }
		
		      // 화면 밖(아래/좌/우)으로 완전히 벗어나면 제거
		      if (enemy.y > GameConfig.HEIGHT + 50 || enemy.x < -100 || enemy.x > GameConfig.WIDTH + 100) {
		        this.destroyEnemy(enemy);
		      }
		    });
		  }
		
		  destroyEnemy(enemy) {
			  if (enemy.fireEvent) {					// 적의 공격 타이머 제거
			    enemy.fireEvent.remove(false);
			  }
			
			  if (enemy.laserBlinkEvent) {				// 레이저 관련 타이머 제거
			    enemy.laserBlinkEvent.remove(false);
			  }
			
			  if (enemy.warningEndEvent) {				// 레이저 관련 타이머 제거
			    enemy.warningEndEvent.remove(false);
			  }
			
			  if (enemy.laserTickEvent) {				// 레이저 관련 타이머 제거
			    enemy.laserTickEvent.remove(false);
			  }
			
			  if (enemy.laserEndEvent) {				// 레이저 관련 타이머 제거
			    enemy.laserEndEvent.remove(false);
			  }
			
			  if (enemy.warningGraphic) {				// 경고선 제거
			    enemy.warningGraphic.destroy();
			  }
			
  			  if (enemy.laserMiddle) {					// 레이저 몸체 제거
			    enemy.laserMiddle.destroy();
			  }
			  if (enemy.laserCapTop) {					// 레이저 위쪽 캡 제거
			    enemy.laserCapTop.destroy();
			  }
			  if (enemy.laserCapBottom) {				// 레이저 아래쪽 캡 제거
			    enemy.laserCapBottom.destroy();
			  }
			
			  enemy.destroy();							// 최종적으로 적 객체 제거
		  }
		
		  // 적 탄환 전체 제거
		  clearEnemyBullets() {
		    // enemyBullets 그룹에 들어있는 모든 탄환을
		    // 씬과 그룹에서 동시에 제거
		    this.enemyBullets.clear(true, true);
		  }
		
		  // 매 프레임 화면 밖의 적 발사체 제거
		  cleanupEnemyBullets() {
		    this.enemyBullets.getChildren().forEach((bullet) => {
		      const outOfBounds =							// 발사체가 화면 밖인지 확인
		        bullet.y > GameConfig.HEIGHT + 20 ||		// 아래로 나감
		        bullet.y < -20 ||							// 위로 나감
		        bullet.x < -20 ||							// 왼쪽으로 나감
		        bullet.x > GameConfig.WIDTH + 20;			// 오른쪽으로 나감
		
		      if (outOfBounds) {
		        bullet.destroy();
		      }
		    });
		  }
		  
		  // 충돌 처리
		  handlePlayerBulletHitEnemy(obj1, obj2) {
		    // hp 속성 유무로 적을 판별 (발사체에는 hp가 없음)
		    const enemy = (obj1.hp !== undefined) ? obj1 : obj2;	// hp가 있는 객체를 적으로 판단
		    const bullet = (enemy === obj1) ? obj2 : obj1;			// 나머지를 총알로 판단
		
		    // 화면에 아직 보이지 않는 적은 피격 무시
		    if (!enemy.isVisible) {
		      return;
		    }
		
		    // 피격 이펙트 (적의 색상을 그대로 사용)
		    this.spawnBurstEffect(
		      bullet.x, bullet.y,
		      enemy.effectColor,
		      GameConfig.HIT_EFFECT_RADIUS,
		      GameConfig.HIT_EFFECT_DURATION
		    );
		
		    bullet.destroy();		// 플레이어 총알 제거
		
		    enemy.hp -= this.playerAttackPower;	// 적 hp 감소
		
		    if (enemy.hp <= 0) {	// 죽었는지 확인
		      this.sound.play('sfxEnemyDeath', { volume: 0.5 });
		    
		      // 사망 이펙트 (더 크게)
		      this.spawnBurstEffect(
		        enemy.x, enemy.y,
		        enemy.effectColor,
		        GameConfig.ENEMY_DEATH_EFFECT_RADIUS,
		        GameConfig.ENEMY_DEATH_EFFECT_DURATION
		      );
		      this.registerEnemyKill();   	// 화면 밖 도망(destroyEnemy 단독 호출)과 구분되는, 실제 처치 카운트
		      this.destroyEnemy(enemy);		// 적 제거
		    }
		  }
		
		  // 충돌 처리
		  handleEnemyBulletHitPlayer(obj1, obj2) {
		    // 인자 순서가 항상 보장되지 않으므로, attackPower 속성 유무로 발사체를 판별
		    const bullet = (obj1.attackPower !== undefined) ? obj1 : obj2;	// attackPower가 있는 객체를 적 발사체로 판별
		
		    bullet.destroy();						// 발사체 제거
		    this.damagePlayer(bullet.attackPower);	// 발사체 공격력만큼 플레이어에게 데미지
		  }
		  
		  // 랜덤 표식 공격 시스템
		  scheduleNextMarker() {
		    const delay = Phaser.Math.Between(GameConfig.MARKER_MIN_INTERVAL, GameConfig.MARKER_MAX_INTERVAL);
		
		    this.time.delayedCall(delay, () => {
		      if (!this.isGameOver) {
		        this.spawnMarker();
		        this.scheduleNextMarker();   // 재귀 호출을 이쪽으로 이동 (spawnMarker는 순수 생성 함수로 분리)
		      }
		    });
		  }
		
		  spawnMarker() {
		    // 플레이어의 현재 위치에서 생성
		    const startX = this.player.x;
		    const startY = this.player.y;
		
		    // 반투명 원 + 십자 모양을 하나로 묶어서 표식 생성
		    const circle = this.add.circle(0, 0, GameConfig.MARKER_RADIUS, GameConfig.MARKER_COLOR, GameConfig.MARKER_ALPHA);
		    const crossH = this.add.rectangle(0, 0, GameConfig.MARKER_RADIUS * 1.2, 3, GameConfig.MARKER_COLOR);
		    const crossV = this.add.rectangle(0, 0, 3, GameConfig.MARKER_RADIUS * 1.2, GameConfig.MARKER_COLOR);
		
		    const marker = this.add.container(startX, startY, [circle, crossH, crossV]);
		    marker.state = 'following';
		
		    this.markers.push(marker);
		
		    // 2초 후 위치 고정 (팔로우 종료)
		    this.time.delayedCall(GameConfig.MARKER_FOLLOW_DURATION, () => {
		      this.fixMarker(marker);
		    });
		  }
		
		  // 표식 업데이트 
		  updateMarkers() {
		    this.markers.forEach((marker) => {		// 모든 표식 확인
		      if (marker.state !== 'following') {	// 따라가는 상태가 아니라면 무시
		        return;
		      }
		
		      // 고정되기 전까지는 항상 플레이어와 완전히 동일한 좌표를 유지
		      marker.x = this.player.x;
		      marker.y = this.player.y;
		    });
		  }
		
		  fixMarker(marker) {
		    if (!marker.active) {
		      return; // 이미 제거된 표식이면 무시
		    }
		
		    marker.state = 'fixed';
		
		    // 깜빡임 횟수만큼 각각 독립적인 타이머로 예약 (반복 타이머 + 종료 타이머의 경합 문제 방지)
		    const toggleCount = Math.round(GameConfig.MARKER_BLINK_DURATION / GameConfig.MARKER_BLINK_INTERVAL);
		
		    for (let i = 1; i <= toggleCount; i++) {
		      this.time.delayedCall(GameConfig.MARKER_BLINK_INTERVAL * i, () => {
		        if (marker.active) {
		          marker.visible = !marker.visible;
		        }
		      });
		    }
		
		    // 마지막 깜빡임 이후 폭발 (약간의 여유 시간을 둬서 마지막 깜빡임이 확실히 반영되도록 함)
		    this.time.delayedCall(GameConfig.MARKER_BLINK_DURATION + 20, () => {
		      this.explodeMarker(marker);
		    });
		  }
		
		  // 표식 폭발
		  explodeMarker(marker) {
		    if (!marker.active) {
		      return;
		    }
		
		    const explosionX = marker.x;		// 폭발 위치 저장
		    const explosionY = marker.y;		// 폭발 위치 저장
		
		    marker.destroy();					// 표식 제거
		    this.markers = this.markers.filter((m) => m !== marker);	// 배열에서도 제거
		
		    // 폭발 시각 이펙트
		    this.spawnBurstEffect(explosionX, explosionY, 0xff2222, GameConfig.MARKER_EXPLOSION_RADIUS, 250, 0.6);
		
		    // 폭발 순간 플레이어가 반경 안에 있는지 판정
		    const dx = this.player.x - explosionX;			// 플레이어와 폭발 위치 x차이
		    const dy = this.player.y - explosionY;			// 플레이어와 폭발 위치 y차이
		    const distance = Math.sqrt(dx * dx + dy * dy);	// 두 점 사이의 실제 거리
		
		    if (distance <= GameConfig.MARKER_EXPLOSION_RADIUS) {	// 폭발 반경 내에 플레이어가 있다면
		      this.damagePlayer(GameConfig.MARKER_DAMAGE);			// 데미지를 줌
		    }
		  }
		
		  // ===== 공용 이펙트 함수 =====
		
		  spawnBurstEffect(x, y, color, radius, duration, alpha = 0.85) {
		    const effect = this.add.circle(x, y, radius, color, alpha);		// 원형 이펙트 생성
		
		    this.tweens.add({							// 애니메이션 시작
		      targets: effect,							// 이 이펙트를 애니메이션 시작
		      scale: 2.2,								// 크기가 2.2배로 커짐
		      alpha: 0,									// 점점 투명해짐
		      duration: duration,						// 지속시간
		      onComplete: () => effect.destroy()		// 지속시간이 끝나면 이펙트 객체 삭제
		    });
		  }
		}
