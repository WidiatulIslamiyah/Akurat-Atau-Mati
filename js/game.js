window.onload = function() {
  var innerWidth = window.innerWidth;
  var innerHeight = window.innerHeight;
  var gameRatio = innerWidth / innerHeight;
  var game = new Phaser.Game(Math.floor(480 * gameRatio), 480, Phaser.CANVAS);
  var pemain;
  var pemainGravity = 800;
  var kekuatanlompatanpemain;
  var score = 0;
  var scoreText;
  var topScore;
  var kekuatan;
  var powerTween;
  var placedPoles;
  var kumpulanbox;
  var boxpendek = 100;
  var boxpanjang = 300;
  var pemainlompat;
  var terjatuh;
  var SOUND_VOLUME = 0.1;
  var introText;
  var play = function(game) {}
  play.prototype = {
    preload: function() {
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      game.scale.setScreenSize(true);
      game.load.image("jongkok", "bahan/jongkok.png");
      game.load.image("box", "bahan/box.png");
      game.load.image("kekuatann", "bahan/kekuatann.png");
      game.load.image("background","bahan/background.png");
      game.load.audio("lompatt","bahan/lompatt.mp3");
      game.load.audio("power","bahan/power.wav");
      game.load.audio("backsound","bahan/backsound.mp3")
    },
    create: function() {
      game.add.sprite(0, 0, 'background');
      pemainlompat = false;
      terjatuh = false;
      score = 0;
      placedPoles = 0;
      kumpulanbox = game.add.group();

      introText = game.add.text(200, 160, '', {
      font: "60px arial",
      fill: "#ffffff",
      align: "center"
      });
      introText.visible = false;
        // suara
      game.lompat = game.add.audio('lompatt', SOUND_VOLUME);
      game.power = game.add.audio('power', SOUND_VOLUME);
      pemain = game.add.sprite(80, 0, "jongkok");
      topScore = localStorage.getItem("topFlappyScore") == null ? 0 : localStorage.getItem("topFlappyScore");
      scoreText = game.add.text(10, 10, "-", {
        font: "bold 16px Arial"
      });
      updateScore();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      pemain.anchor.set(0.5);
      pemain.lastPole = 1;
      game.physics.arcade.enable(pemain);
      pemain.body.gravity.y = pemainGravity;
      game.input.onDown.add(siaplompat, this);
      addPole(80);
    },
    update: function() {
      game.physics.arcade.collide(pemain, kumpulanbox, checkLanding);
      if (pemain.y > game.height) {
        mati();
      }
    }
  }
  game.state.add("Play", play);
  game.state.start("Play");

  function updateScore() {
    scoreText.text = "Score: " + score + "\nBest: " + topScore;
  }

  function siaplompat() {
    if (pemain.body.velocity.y == 0) {
      kekuatan = game.add.sprite(pemain.x - 40, pemain.y - 70, "kekuatann");
      kekuatan.width = 0;
      powerTween = game.add.tween(kekuatan).to({
        width: 100
      }, 1000, "Linear", true);
      game.input.onDown.remove(siaplompat, this);
      game.input.onUp.add(jump, this);
      game.power.play();
    }
  }

  function jump() {
    kekuatanlompatanpemain = -kekuatan.width * 3 - 100
    kekuatan.destroy();
    game.tweens.removeAll();
    pemain.body.velocity.y = kekuatanlompatanpemain * 2;
    pemainlompat = true;
    powerTween.stop();
    game.input.onUp.remove(jump, this);
    game.lompat.play();
  }

  function boxbaru() {
    var maxPoleX = 0;
    kumpulanbox.forEach(function(item) {
    maxPoleX = Math.max(item.x, maxPoleX)
    });
    var nextPolePosition = maxPoleX + game.rnd.between(boxpendek, boxpanjang);
    addPole(nextPolePosition);

  }

  function addPole(poleX) {
    if (poleX < game.width * 2) {
      placedPoles++;
      var box = new Pole(game, poleX, game.rnd.between(250, 380));
      game.add.existing(box);
      box.anchor.set(0.5, 0);
      kumpulanbox.add(box);
      var nextPolePosition = poleX + game.rnd.between(boxpendek, boxpanjang);
      addPole(nextPolePosition);
    }
  }

  function mati() {
    localStorage.setItem("topFlappyScore", Math.max(score, topScore));
    introText.text = 'Game Over!\nKlik untuk mengulangi';
    introText.visible = true;
    game.input.onUp.add(mulai, this); 
  }
  function mulai() {
    game.state.start("Play");
  }
  function checkLanding(n, p) {
    if (p.y >= n.y + n.height / 2) {

      var border = n.x - p.x
      if (Math.abs(border) > 20) {
        n.body.velocity.x = border * 2;
        n.body.velocity.y = -200;
      }
      var poleDiff = p.poleNumber - n.lastPole;
      if (poleDiff > 0) {
        score += Math.pow(2, poleDiff);
        updateScore();
        n.lastPole = p.poleNumber;
      }
      if (pemainlompat) {
        pemainlompat = false;
        game.input.onDown.add(siaplompat, this);
      }
    } else {
      terjatuh = true;
      kumpulanbox.forEach(function(item) {
        item.body.velocity.x = 0;
      });
    }
  }
  Pole = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, "box");
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.immovable = true;
    this.poleNumber = placedPoles;
  };
  Pole.prototype = Object.create(Phaser.Sprite.prototype);
  Pole.prototype.constructor = Pole;
  Pole.prototype.update = function() {
    if (pemainlompat && !terjatuh) {
      this.body.velocity.x = kekuatanlompatanpemain;
    } else {
      this.body.velocity.x = 0;
    }
    if (this.x < -this.width) {
      this.destroy();
      boxbaru();
    }
  }
}