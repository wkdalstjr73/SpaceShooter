// ===== 디버그 설정 (테스트용, 정식 빌드 전엔 false로 되돌릴 것) =====
const DEBUG_STAGE = 4;	// 각 스테이지 번호로 수정 시 해당 스테이지로 바로 진입

// 설정값 저장
const GameConfig = {
  WIDTH: 540,
  HEIGHT: 960,
  BACKGROUND_COLOR: '#000000',

  PLAYER_SPEED: 300,          // 플레이어 초당 이동 속도 (px/sec)
  TOUCH_MOVE_SCALE: 1.0,      // 터치 이동 배율: 1.0 = 손가락 이동량 그대로
  //TOUCH_DEAD_ZONE: 4,         // 터치 목표 지점과 이 거리(px) 이내면 정지 (떨림 방지)
  PLAYER_FIRE_RATE: 250,     // 플레이어 발사 간격 (ms) - 0.25초마다 발사
  PLAYER_BULLET_SPEED: 500,   // 플레이어 발사체 속도 (px/sec)
  PLAYER_BULLET_SIZE: 8,      // 발사체 크기 (지름/한변)
  PLAYER_MAX_HP: 5,          // 플레이어 체력
  PLAYER_ATTACK_POWER: 2,      // 플레이어 공격력
  
  /*
  JOYSTICK_RADIUS: 50,          // 조이스틱 베이스(바깥 원)의 반지름
  JOYSTICK_DEAD_ZONE: 25,        // 이 거리 이내로만 움직이면 무시 (미세 떨림 방지)
  JOYSTICK_BASE_COLOR: 0xffffff,
  JOYSTICK_BASE_ALPHA: 0.25,
  JOYSTICK_KNOB_COLOR: 0x708090,
  JOYSTICK_KNOB_ALPHA: 0.6,
  */
  
  DOUBLE_TAP_WINDOW: 300,       // 이 시간(ms) 이내에 다시 터치하면 더블 탭으로 인식 → 일시정지/재개
  
  ENEMY_SPAWN_OFFSET_Y: 220,    // 적이 화면 위 몇 px 떨어진 곳에서 생성될지 (클수록 화면 밖 공격 구간이 길어짐)

  ENEMY_TYPES: {
    TYPE1: {
      key: 'type1',			 // 직선탄
      size: 36,
      color: 0xe74c3c,       // 빨간색
      enemyFrame: 9,         // ships 시트에서 사용할 프레임
      bulletFrame: 6,        // Projectiles 시트에서 사용할 발사체 프레임
      hp: 6,
      attackPower: 1,
      speed: 80,              // 아래로 이동하는 속도 (px/sec)
      fireRate: 1000,         // 공격 간격 (ms)
      bulletSpeed: 300,       // 발사체 속도 (px/sec)
      bulletSize: 8,
      bulletColor: 0xff8844   // 주황색
    },
    TYPE2: {
      key: 'type2',
      size: 36,
      color: 0x2ecc71,        // 녹색
      enemyFrame: 8,
      bulletFrame: 7,
      splitBulletFrame: 24,
      hp: 6,
      attackPower: 1,
      speed: 80,
      fireRate: 1000,
      bulletSpeed: 250,        // 분열 전까지 날아가는 속도
      bulletSize: 8,
      bulletColor: 0x7bffb0,   // 연두색

      // 분열 관련 설정
      splitDelay: 1500,        // 발사 후 이 시간(ms)이 지나면 분열
      splitBulletSpeed: 280,   // 분열탄 속도
      splitBulletSize: 7,
      splitBulletColor: 0x00e676,
      splitAttackPower: 1      // 분열탄 각각의 공격력
    },
    TYPE3: {
      key: 'type3',
      //shape: 'triangle',        // 역삼각형 모양으로 그리기 위한 구분값
      size: 40,
      color: 0xf1c40f,         // 노란색
      enemyFrame: 18,
      bulletFrame: 4,
      hp: 8,
      attackPower: 1,
      speed: 60,
      fireRate: 2000,
      bulletSpeed: 180,

      bulletSize: 9,
      bulletColor: 0x9c27b0,           // 유도 중 색상 - 빨간색
      bulletColorAfterHoming: 0x9e9e9e, // 직진 전환 후 색상 - 회색
      bulletTurnRate: 150               // 초당 회전 각도(도) - 클수록 급하게 꺾임 (부드러운 유도용 값)
    },
    TYPE4: {
      key: 'type4',
      //shape: 'circle',
      size: 34,
      color: 0xffffff,          // 하얀색
      enemyFrame: 27,
      hp: 8,
      attackPower: 1,            // 레이저 유지 중 틱당 데미지
      speed: 80,

      fireRate: 4000,            // 레이저 공격 사이클 간격 (경고+레이저 포함, 다음 사이클까지)
      warningDuration: 1000,     // 경고선 표시 시간 (ms)
      warningBlinkInterval: 100, // 경고선 깜빡이는 간격 (ms)
      laserDuration: 2000,       // 레이저 발사 지속 시간 (ms)
      laserTickInterval: 500,    // 레이저 유지 중 데미지 적용 간격 (ms)
      warningColor: 0xff5555,
      laserColor: 0xffffff,
      
      // 레이저 이미지 프레임
      laserCapTopFrame: 48,
      laserMiddleFrame: 49,
      laserCapBottomFrame: 50,
      // 레이저 발사 시작점 미세 조정 (px). 오른쪽/아래로 밀려 보이면 음수로 조절
      laserOffsetX: -2,
      laserOffsetY: 24
    }
  },
 

	PLAYER_SIZE: 40,   // 플레이어 한 변 크기 (기존 create()에 하드코딩되어 있던 40을 여기로 옮김)

  	// 랜덤 표식 공격 설정
	MARKER_MIN_INTERVAL: 8000,     // 표식 생성 최소 간격 (ms)
	MARKER_MAX_INTERVAL: 12000,    // 표식 생성 최대 간격 (ms)
	MARKER_FOLLOW_DURATION: 2000,  // 플레이어를 따라다니는 시간 (ms)
	MARKER_BLINK_DURATION: 1000,   // 고정 후 깜빡이는 시간 (ms)
	MARKER_BLINK_INTERVAL: 100,    // 깜빡이는 간격 (ms)
	MARKER_RADIUS: 30,             // 표식(원+십자) 시각적 크기
	MARKER_COLOR: 0xff4444,
	MARKER_ALPHA: 0.5,
	MARKER_DAMAGE: 2,
	
	// 이펙트 설정
	HIT_EFFECT_RADIUS: 8,
	HIT_EFFECT_DURATION: 150,
	ENEMY_DEATH_EFFECT_RADIUS: 24,
	ENEMY_DEATH_EFFECT_DURATION: 400,
	PLAYER_HIT_EFFECT_RADIUS: 14,
	PLAYER_HIT_EFFECT_DURATION: 200,
	PLAYER_DEATH_EFFECT_RADIUS: 30,
	PLAYER_DEATH_EFFECT_DURATION: 500,
	GAME_OVER_FADE_DURATION: 1200
};

// 표식 폭발 반지름 = (플레이어 한 변 × 1.5) 의 절반 (지름 기준이므로)
GameConfig.MARKER_EXPLOSION_RADIUS = (GameConfig.PLAYER_SIZE * 1.5) / 2;

// ===== 스테이지 & 웨이브 시스템 설정 =====
GameConfig.SPAWN_INTERVAL = {
  SLOW: 2000,
  NORMAL: 1700,
  FAST: 1500
};

GameConfig.TEXT_FADE_IN = 300;             // 안내 문구가 나타나는 시간 (ms)
GameConfig.TEXT_HOLD = 1500;               // 안내 문구가 유지되는 시간 (ms)
GameConfig.TEXT_FADE_OUT = 1000;           // 안내 문구가 사라지는 시간 (ms)

GameConfig.WAVE_CLEAR_WAIT = 4000;         // 웨이브의 모든 적이 사라진 후, 다음 웨이브 문구가 뜨기까지 대기 시간
GameConfig.SPAWN_DELAY_AFTER_TEXT = 1000;  // 안내 문구가 사라진 후, 적 생성이 시작되기까지 대기 시간
GameConfig.SCREEN_FADE_DURATION = 3000;     // 스테이지 전환 시 화면 전체 페이드 시간

// 스테이지1~3, 각 3웨이브 구성 (누적 방식: 이전 웨이브의 적 종류를 유지하며 새 종류 추가)
GameConfig.STAGE_WAVES = [
  // 스테이지 1
  [
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1], killTarget: 5, spawnInterval: GameConfig.SPAWN_INTERVAL.NORMAL },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2], killTarget: 7, spawnInterval: GameConfig.SPAWN_INTERVAL.NORMAL },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2], killTarget: 10, spawnInterval: GameConfig.SPAWN_INTERVAL.FAST }
  ],
  // 스테이지 2
  [
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2], killTarget: 7, spawnInterval: GameConfig.SPAWN_INTERVAL.SLOW },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2, GameConfig.ENEMY_TYPES.TYPE3], killTarget: 9, spawnInterval: GameConfig.SPAWN_INTERVAL.NORMAL },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2, GameConfig.ENEMY_TYPES.TYPE3], killTarget: 12, spawnInterval: GameConfig.SPAWN_INTERVAL.FAST }
  ],
  // 스테이지 3
  [
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2, GameConfig.ENEMY_TYPES.TYPE3], killTarget: 7, spawnInterval: GameConfig.SPAWN_INTERVAL.SLOW },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2, GameConfig.ENEMY_TYPES.TYPE3, GameConfig.ENEMY_TYPES.TYPE4], killTarget: 9, spawnInterval: GameConfig.SPAWN_INTERVAL.NORMAL },
    { enemyTypes: [GameConfig.ENEMY_TYPES.TYPE1, GameConfig.ENEMY_TYPES.TYPE2, GameConfig.ENEMY_TYPES.TYPE3, GameConfig.ENEMY_TYPES.TYPE4], killTarget: 12, spawnInterval: GameConfig.SPAWN_INTERVAL.FAST }
  ]
];

// 스테이지 4 (보스전) - 웨이브 없이 계속 지속, 스테이지3-웨이브3 구성 + 표식 공격 추가
GameConfig.STAGE4_CONFIG = {
  enemyTypes: [
    GameConfig.ENEMY_TYPES.TYPE1,
    GameConfig.ENEMY_TYPES.TYPE2,
    GameConfig.ENEMY_TYPES.TYPE3,
    GameConfig.ENEMY_TYPES.TYPE4
  ],
  spawnInterval: GameConfig.SPAWN_INTERVAL.FAST
};
// ===== 보스(스테이지4) 설정 =====
GameConfig.BOSS = {
  size: 80,
  color: 0x4a148c,          // 보라색 계열 (임시, 나중에 이미지로 교체 가능)
  hp: 80,
  phase2Threshold: 40,

  entrySpeed: 100,           // 등장 시 내려오는 속도 (px/sec)
  entryTargetY: 180,         // 등장 후 자리 잡는 y좌표

  moveBounds: { minX: 90, maxX: GameConfig.WIDTH - 90, minY: 120, maxY: 320 },
  moveSpeed: 80,
  moveWaitMin: 500,
  moveWaitMax: 800,
  moveArriveThreshold: 6,

  PHASE1: {
    attackInterval: 500,
    patterns: ['straight', 'split']
  },
  PHASE2: {
    attackInterval: 500,
    patterns: ['straight', 'split', 'homing', 'laser']
  },

  COORD_ATTACK_INTERVAL: 3500,
  COORD_MARKER_COUNT_PHASE1: 1,
  COORD_MARKER_COUNT_PHASE2: 2,

  ATTACKS: {
    straight: {
      bulletSpeed: 260,
      bulletSize: 9,
      bulletColor: 0xff6666,
      bulletFrame: 8,        // Projectiles 시트에서 사용할 발사체 프레임
      attackPower: 1
    },
    split: {
      bulletSpeed: 250,
      bulletSize: 9,
      bulletColor: 0xba68c8,
      bulletFrame: 7,
      splitBulletFrame: 24,
      attackPower: 1,
      splitDelay: 1300,
      splitBulletSpeed: 240,
      splitBulletSize: 7,
      splitBulletColor: 0xe1bee7,
      splitAttackPower: 1
    },
    homing: {
      bulletSpeed: 230,
      bulletSize: 10,
      bulletColor: 0x9c27b0,
      bulletFrame: 4,
      bulletColorAfterHoming: 0x9e9e9e,
      bulletTurnRate: 160,
      attackPower: 1
    },
    laser: {
      size: 70,
      attackPower: 1,
      warningDuration: 1000,
      warningBlinkInterval: 100,
      laserDuration: 1800,
      laserTickInterval: 300,
      warningColor: 0xff5555,
      laserColor: 0xffffff,
      laserCapTopFrame: 48,
      laserMiddleFrame: 49,
      laserCapBottomFrame: 50,
      // 레이저 발사 시작점 미세 조정 (px). 오른쪽/아래로 밀려 보이면 음수로 조절
      laserOffsetX: 0,
      laserOffsetY: 40
    }
  }
};
// ===== 무한 스테이지(보스 이후) 설정 =====
GameConfig.INFINITE = {
  baseSpawnInterval: GameConfig.SPAWN_INTERVAL.FAST, // 시작 생성 간격
  minSpawnInterval: 400,          // 아무리 빨라져도 이 값 밑으로는 안 내려감
  intervalDecreasePerSecond: 4,   // 1초 생존할 때마다 생성 간격이 이만큼(ms) 감소
  sideSpawnChance: 0.35,          // 매 생성마다 좌우 진입형으로 나올 확률
  sideSpawnYMax: GameConfig.HEIGHT / 3   // 좌우 진입은 화면 상단 1/3 영역에서만
};

// ===== 하트 회복 아이템 설정 =====
GameConfig.HEART = {
  minInterval: 12000,   // 최소 생성 간격 (ms)
  maxInterval: 20000,   // 최대 생성 간격 (ms)
  speed: 120,            // 낙하 속도
  healAmount: 1,         // 회복량
  fontSize: 35,            // 하트 이모지 크기
  color: 0xff2222        // 하트 색상 (빨간색)
};