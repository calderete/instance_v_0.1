//this game will have only 1 state
var GameState = {

  //initiate game settings
  init: function() {
    //adapt to screen size, fit all the game
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1000

    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.game.world.setBounds(0,0,360,700);

    this.RUNNING_SPEED = 180;
    this.JUMPING_SPEED = 550;
  },

  //load the game assets before the game starts
  preload: function() {
    this.load.image('ground', 'assets/images/ground.png');
    this.load.image('platform', 'assets/images/platform.png');
    this.load.image('goal', 'assets/images/gorilla3.png');
    this.load.image('arrowButton', 'assets/images/arrowButton.png');
    this.load.image('actionButton', 'assets/images/actionButton.png');
    this.load.image('barrel', 'assets/images/barrel.png');
    this.load.image('punch', 'assets/images/meleeOne.png');
    this.load.image('specialAbility', 'assets/images/fire_spritesheet.png');
    this.load.image('powerAbility', 'assets/images/powerOne.png');


    this.load.spritesheet('player', 'assets/images/player_spritesheet.png', 28, 30, 5, 1, 1);
    // this.load.spritesheet('specialAbility', 'assets/images/fire_spritesheet.png', 20, 21, 2, 1, 1);

    this.load.text('level', 'assets/data/level.json');
    this.load.text('playerData', 'assets/data/player_data.json');
  },
  //executed after everything is loaded
  create: function() {

    this.ground = this.add.sprite(0, 638, 'ground');
    this.game.physics.arcade.enable(this.ground);
    this.ground.body.allowGravity = false;
    this.ground.body.immovable = true;

    //parse the file
    this.levelData = JSON.parse(this.game.cache.getText('level'));
    this.playerData = JSON.parse(this.game.cache.getText('playerData'));

    this.platforms = this.add.group();
    this.platforms.enableBody = true;

    this.levelData.platformData.forEach(function(element){
      this.platforms.create(element.x, element.y, 'platform');
    }, this);

    this.platforms.setAll('body.immovable', true);
    this.platforms.setAll('body.allowGravity', false);

    // registering action keys
    var key1 = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    key1.onDown.add(this.punch, this);

    var key2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
    key2.onDown.add(this.specialAbility, this);

    var key3 = game.input.keyboard.addKey(Phaser.Keyboard.THREE);
    key3.onDown.add(this.powerAbility, this);

    //goal
    this.goal = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'goal');
    this.game.physics.arcade.enable(this.goal);
    this.goal.body.allowGravity = false;

    //create player
    this.player = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'player', 3);
    this.player.anchor.setTo(0.5);
    this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
    this.game.physics.arcade.enable(this.player);
    this.player.customParams = {};
    this.player.body.WorldBounds = true;

    this.game.camera.follow(this.player);

    this.createOnscreenControls();

    this.barrels = this.add.group();
    this.barrels.enableBody = true;

    this.createBarrel();
    this.barrelCreator = this.game.time.events.loop(Phaser.Timer.SECOND * this.levelData.barrelFrequency, this.createBarrel, this)
  },
  update: function() {
    this.game.physics.arcade.collide(this.player, this.ground);
    this.game.physics.arcade.collide(this.player, this.platforms);

    this.game.physics.arcade.collide(this.barrels, this.ground);
    this.game.physics.arcade.collide(this.barrels, this.platforms);

    this.game.physics.arcade.overlap(this.player, this.fires, this.killPlayer);
    // this.game.physics.arcade.overlap(this.player, this.barrels, this.killPlayer);
    this.game.physics.arcade.overlap(this.player, this.goal, this.win);

    this.player.body.velocity.x = 0;

    if(this.cursors.left.isDown || this.player.customParams.isMovingLeft) {
      this.player.body.velocity.x = -this.RUNNING_SPEED;
      this.player.scale.setTo(1, 1);
      this.player.customParams.isFacingLeft = true;
      this.player.customParams.isFacingRight = false;
      this.player.play('walking');
    }
    else if(this.cursors.right.isDown || this.player.customParams.isMovingRight) {
      this.player.body.velocity.x = this.RUNNING_SPEED;
      this.player.scale.setTo(-1, 1);
      this.player.customParams.isFacingLeft = false;
      this.player.customParams.isFacingRight = true;
      this.player.play('walking');
    }
    else {
      this.player.animations.stop();
      // this.player.frame = 3;
    }

    if((this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
      this.player.body.velocity.y = -this.JUMPING_SPEED;
      this.player.customParams.mustJump = false;
    }

    this.barrels.forEach(function(barrel){
      if(barrel.body.health < 1) {
        barrel.kill();
      }
    }, this);

    this.barrels.forEach(function(element){
      if(element.x < 10 && element.y > 600) {
        element.kill();
      }
    }, this);
  },
  createOnscreenControls: function(){
    this.leftArrow = this.add.button(20, 535, 'arrowButton');
    this.rightArrow = this.add.button(110, 535, 'arrowButton');
    this.actionButton = this.add.button(280, 535, 'actionButton');

    this.leftArrow.alpha = 0.5;
    this.rightArrow.alpha = 0.5;
    this.actionButton.alpha = 0.5;

    this.leftArrow.fixedToCamera = true;
    this.rightArrow.fixedToCamera = true;
    this.actionButton.fixedToCamera = true;

    this.actionButton.events.onInputDown.add(function(){
      this.player.customParams.mustJump = true;
    }, this);

    this.actionButton.events.onInputUp.add(function(){
      this.player.customParams.mustJump = false;
    }, this);

    //left
    this.leftArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);

    this.leftArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);

    this.leftArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);

    this.leftArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);

    //right
    this.rightArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);

    this.rightArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);

    this.rightArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);

    this.rightArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);
  },

  // melee ability direction and damage mechanics
  punch: function() {
    var meleeDirection;
    if (this.player.customParams.isFacingLeft == true) {
      meleeDirection = GameState.player.position.x - 45;
    }
    else {
      meleeDirection = GameState.player.position.x + 18;
    }
    var punch = this.add.sprite(meleeDirection, GameState.player.position.y - 15, 'punch');
    var abilityDamage = this.playerData.melee.power;
    console.log(abilityDamage)
    game.time.events.add(Phaser.Timer.SECOND * 0.2, killPunch, this);

    this.game.physics.arcade.enable(punch)
    punch.body.imovable = true;
    punch.body.allowGravity = false;
    this.barrels.forEach(function(barrel) {
      this.game.physics.arcade.overlap(barrel, punch, function(barrel) {
        barrel.body.health = barrel.body.health - abilityDamage;
      })
    })

    function killPunch() {
      punch.kill();
    }

  },

  // special ability direction and damage mechanics
  specialAbility: function() {
    var abilityDamage = this.playerData.special.power;
    var abilityDirection;
    if (this.player.customParams.isFacingLeft == true) {
      abilityDirection = GameState.player.position.x - 68;
    }
    else {
      abilityDirection = GameState.player.position.x + 28;
    }
    var specialAbility = this.add.sprite(abilityDirection, GameState.player.position.y - 6, 'specialAbility');
    console.log(this.playerData.special)
    game.time.events.add(Phaser.Timer.SECOND * 0.2, killAbility, this);

    this.game.physics.arcade.enable(specialAbility);
    specialAbility.body.imovable = true;
    specialAbility.body.allowGravity = false;
    this.barrels.forEach(function(barrel) {
      this.game.physics.arcade.overlap(barrel, specialAbility, function(barrel) {
        barrel.body.health = barrel.body.health - abilityDamage;
      })
    })

    function killAbility() {
      specialAbility.kill();
    }
  },

  // power ability direction and mechanics
  powerAbility: function() {
    var abilityDamage = this.playerData.power.power;
    var abilityDirection;
    if (this.player.customParams.isFacingLeft == true) {
      abilityDirection = GameState.player.position.x - 150;
    }
    else {
      abilityDirection = GameState.player.position.x - 150;
    }
    var powerAbility = this.add.sprite(abilityDirection, GameState.player.position.y - 150, 'powerAbility');
    game.time.events.add(Phaser.Timer.SECOND * 1.0, killAbility, this);
    this.game.physics.arcade.enable(powerAbility);
    powerAbility.body.imovable = true;
    powerAbility.body.allowGravity = false;

    this.barrels.forEach(function(barrel) {
      this.game.physics.arcade.overlap(barrel, powerAbility, function(barrel) {
        barrel.body.health = barrel.body.health - abilityDamage;
      })
    })

    function killAbility() {
      powerAbility.kill();
    }
  },

  killPlayer: function(player, fire) {
    console.log('auch!');
    game.state.start('GameState');
  },
  win: function(player, goal) {
    alert('you win!');
    game.state.start('GameState');
  },
  createBarrel: function() {
    //give me the first dead sprite
    var barrel = this.barrels.getFirstExists(false);

    if(!barrel) {
      barrel = this.barrels.create(0, 0, 'barrel');
    }

    barrel.body.collideWorldBounds = true;
    barrel.body.bounce.set(1, 0);
    barrel.body.health = 10;

    barrel.reset(this.levelData.goal.x, this.levelData.goal.y);
    barrel.body.velocity.x = this.levelData.barrelSpeed;
  }

};

//initiate the Phaser framework
var game = new Phaser.Game(360, 592, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');




//fires
//this.fires = this.add.group();
//this.fires.enableBody = true;

  // var fire;
  // this.levelData.fireData.forEach(function(element){
  //   fire = this.fires.create(element.x, element.y, 'fire');
  //   fire.animations.add('fire', [0, 1], 4, true);
  //   fire.play('fire');
  // }, this);
//
// this.fires.setAll('body.allowGravity', false);
