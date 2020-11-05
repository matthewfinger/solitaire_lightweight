//following consts to be used for rendering the gamearea
const width = 600;
const height = 480;
const cWidth = Math.trunc((width / 9) - 10);
const cHeight = Math.trunc(cWidth * 1.52821);
const colWidth = Math.trunc(width / 9);

//const for the empty card img to be shown at the base of piles
const emptCardImg = new Image;
emptCardImg.src = 'images/empty-card.png';

//const for the img to be shown when the deck is all the way drawn.
const emptDeckImg = new Image;
emptDeckImg.src = 'images/empty-deck.png';

var mousex = 0;
var mousey = 0;

var globalGame;
//pwidth and pHeight return a percentage of the width and height based on a percentage p
function pWidth(p) {
  return Math.trunc(width * p / 100);
}

function pHeight(p) {
  return Math.trunc(height * p / 100);
}


//value in {1,2,3...11,12,13}
class Card {
  constructor(suit, value){
    this.suit = suit;
    this.value = value;
    this.faceup = false;
    this.img = new Image;
    this.img.src = "images/back.png";
  }
  color() {
    return this.suit.color;
  }
  updateImgSrc() {
    if (this.faceup) {
      this.img.src = `images/${this.value + this.suit.imgSrc}.png`;
    } else {
      this.img.src = "images/back.png";
    }
  }
  flip() {
    this.faceup = !this.faceup;
    this.updateImgSrc();
  }
}

//these cards shall go at the base of each suit stack in the finished game
class BaseCard extends Card {
  constructor(suit) {
    super(suit, 0);
    this.flip();
  }
}


class Sound {
  constructor(src) {
    this.sound = document.createElement('audio');
    this.sound.src = src;
    this.sound.style.display = 'none';
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls','none');
    document.body.appendChild(this.sound);
  }

  play() {
    this.sound.play();
  }

  stop() {
    this.sound.pause();
  }
}

sounds = {
  'high-tick' : new Sound('sounds/high-tick.mp3'),
  'low-tick' : new Sound('sounds/low-tick.mp3')
};


class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.cardStack = new CardStack([]);
    this.isOver;
    this.fromStack = null;
  }
  setx(x) {
    this.x = Math.trunc(x);
  }
  sety(y) {
    this.y = Math.trunc(y);
  }
  dropCards() {
    let out = this.cardStack.cards;
    this.cardStack.cards = [];
    this.fromStack = null;
    try {
      sounds['low-tick'].play();
    } finally {
    return out;
    }
  }
  grabCards(cards, fs) {
    if(this.cardStack.cards.length === 0) {
      this.cardStack.push(cards);
      this.fromStack = fs;
    }
    try {
      sounds['high-tick'].play();
    } finally {
      return;
    }
  }
  hasCards() {
    return !(this.cardStack.cards.length === 0);
  }
}

//base class, abstract, to be etended by deck and cardstack
//note the cards array is designed to work as a stack!
class CardPile {
  constructor(cards) {
    this.cards = cards;
    this.cardOffset = 20; //cardOffset will determine how the cards will spread out vertically after being placed
    this.y = 10;  //to determine y-card offset from top of page
  }

  flip () {
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i].flip();
    }
  }

  has (card) {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i]==card) {
        return true;
      }
    }

    return false;
  }

  //height returns the graphical height of the stack
  height() {
    let n = this.cards.length - 1;
    return cHeight + (this.cardOffset * n);
  }

  heightRefresh() {
    if (this.height() > (height - 40)) {
      let n = this.cards.length - 1;
      this.cardOffset = Math.trunc(((height - 40) - cHeight) / n);
    }
  }

  push(cardarray) {
    Array.prototype.push.apply(this.cards, cardarray);
  }

  pop(cardcount) {
    return this.cards.splice(this.cards.length-cardcount, cardcount);
  }

  setY(y) {
    this.y = Math.trunc(y);
  }

  //this fun is only to be used by deck
  shuffle () {
    let array = this.cards
    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  }
}

class HandStack extends CardPile {
  constructor(handCount) {
    super([]);
    this.handCount = handCount;
  }
  height() {
    let n = Math.min(this.handCount, this.cards.length);
    return (n-1) * this.cardOffset + cHeight;
  }
}

class SuitStack extends CardPile {
  constructor(suit) {
    let newcard = new BaseCard(suit);
    super([newcard]);
    this.suit = suit;
    this.cardOffset = 0;
  }
}

class CardStack extends CardPile {
  constructor(cards) {
    super(cards);
  }

}

class Deck extends CardPile {
  constructor(suits, cardvalues) {
    let newcards = [];
    for (let i=0;i<suits.length;i++){
      for (let j=0;j<cardvalues;j++){
        newcards.push(new Card(suits[i], j+1));
      }
    }
    super(newcards);
    this.suits = suits;
    this.cardOffset = 0;
  }
}



//imgSrc refers to a url for an image to eb used for the icon (ex. club.png)
class Suit {
  constructor(name, color, imgSrc) {
    this.name = name;
    this.color = color;
    this.imgSrc = imgSrc;
  }
}


const Suits = [
  new Suit('hearts','red','H'),
  new Suit('diamonds','red','D'),
  new Suit('clubs','black','C'),
  new Suit('spades','black','S')
];


class InterfaceSettings {
  constructor(root) {
    this.fields = {};
    this.sections = {};
    this.mainSection = document.createElement('div');
    root.appendChild(this.mainSection);
  }
  getValue(setting){
    let out;
    let s = this.fields[setting];
    if (s.type == 'checkbox') {
      out = this.fields[setting].checked;
    } else {
      out = this.fields[setting].value;
    }
    return out;
    }
  createSection(name) {
    this.sections[name] = document.createElement('div');
    let nameElem = document.createElement('p');
    nameElem.innerHTML = name;
    this.sections[name].appendChild(nameElem);
    this.mainSection.appendChild(this.sections[name]);
  }
  createField(name, type, section, options={}){
    this.fields[name] = document.createElement('input');
    this.fields[name].setAttribute('type',type);
    this.fields[name].setAttribute('name',name);
    if (options != {}) {
      let k = Object.keys(options);
      for (let i = 0; i < k.length; i++) {
        eval(`this.fields[name].${k[i]} = ${options[k[i]]}`);
      }
    }
  }

}



class Game {
  constructor(root){
    this.root = root;
    this.mainDeck = new Deck(Suits, 13);;
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute('id', 'gamecanvas');
    this.root.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    this.canvas.style.background = "#ddd";
    this.br = this.canvas.getBoundingClientRect();
    this.InterfaceSettings = new InterfaceSettings(this.root);
    this.InterfaceSettings.createSection('click');
    this.InterfaceSettings.createField('drag', 'checkbox', 'click', {
      'id':'"drag"',
      'checked': false
    });
    console.log(this.InterfaceSettings.getValue('drag'));
    this.player = new Player();
    this.cardStacks = []; //card stacks is the collection of cards in the piles in game (not deck, or side final piles)
    this.handStack = new HandStack(3); // empty to begin with: this is where cards will go once drawn from hand
    this.handStack.y = 20 + cHeight;
    this.suitStacks = []; //these are where the completed, ordered suits go once finished
    this.stackCols = []; //this is where stacks shall be refrenced to be rendered
    this.stackCols.push([this.mainDeck, this.handStack]);
    this.score = 0;
    this.done = false;
    globalGame = this;
    //setting up new game!
    //first, shuffle the Deck
    this.mainDeck.shuffle();
    //7 main piles
    for(let i = 1; i <= 7; i++) {
      let m = new CardStack(this.mainDeck.pop(i));
      m.cards[i-1].flip();
      this.cardStacks.push(m);
      this.stackCols.push([m]);
    }
    //4 piles for the suits
    this.stackCols.push([]); //make sure to make a col for the suit stacks
    for (let i = 0; i < Suits.length; i++) {
      //create a suit stack for each suit
      let n = new SuitStack(Suits[i]);
      n.setY((cHeight + 30) * i + 30);
      this.suitStacks.push(n);
      this.stackCols[this.stackCols.length - 1].push(n);
    }

    //function that updates the games player (which is invisible, but always located at the pointer)
    document.onmousemove = event => {
      globalGame.gameX(event.clientX);
      globalGame.gameY(event.clientY);
      globalGame.player.isOver = globalGame.playerAt(globalGame.player);
    };

    //function that decided what to do when player clicks
    document.onmousedown = event => {
      if (!globalGame.InterfaceSettings.getValue('drag')){
        let p = globalGame.player;
        let h;
        h = p.isOver;
        let g = globalGame;
        let s;
        //is the mouse even over anything?
        if (typeof h.value == 'number') {
          s = globalGame.searchStackByCard(p.isOver);
          if (!s) {
            return;
          }
          //does the player have cards?
          if (p.hasCards()) {
            if (p.fromStack.cards[p.fromStack.cards.length - 1] === h) {
              p.fromStack.push(p.dropCards());
              g.evaluate();
              return;
            }
            if (s[0] == 0) {
              return;
            }
            let c = p.cardStack.cards[0];
            let vd = c.value - h.value; //diff in card values : int
            //determine whether the player can drop cards or not
            if (s[0] > 0 && s[0] < 8) { //if the player is over one of the 7 main piles
              if (vd == -1 && c.suit.color != h.suit.color) {
                let crds = p.dropCards();
                s[2].push(crds);
              }
            } else { //when the player is over one of the suit stacks
              if (p.cardStack.cards.length == 1) { // c is the only card in p
                if (vd === 1 && c.suit.name === h.suit.name) { //if the card is one greater and of the same suit
                  s[2].push(p.dropCards());
                }
              }
            }
          } else { //player does not have cards
            if (s[0] == 0) { // when the player is over the first column
              if (s[1] == 0) { //when player is on mainDeck, draw three cards
                g.draw();
              } else if (s[2].cards[s[2].cards.length - 1] == p.isOver) { //the player is over the TOP card of the hand
                g.player.grabCards(s[2].pop(1), s[2]);
              }
            } else if (s[0] < 8) { //when the player is over one of the 7 main stacks
              if (h.faceup) { //the card hovered over is face up
                  let popcount = h.value - s[2].cards[s[2].cards.length - 1].value + 1;
                  g.player.grabCards(s[2].pop(popcount), s[2]);
              }
            } else { //when player is over one of the suit stacks
              if (s[2].cards.length > 1) { //making sure there's a card to grab!
                g.player.grabCards(s[2].pop(1), s[2]);
              }
            }
          }
        } else if (g.isOverStackBase(p)) { //if the player is over an empty base, rather than an actual card
          s = g.isOverStackBase(p);
          if (s.cards.length != 0){
            return;
          } else if (s == g.mainDeck && !p.hasCards()) { //if the user clicks on the empty pile && does not have a card, move hand to deck with draw method
            g.draw();
            g.evaluate();
            return;
          } else if (p.fromStack === g.isOverStackBase(p)) {
            p.fromStack.push(p.dropCards());
          } else if (p.cardStack.cards[0].value === 13) {
            s.push(p.dropCards());
          }
        }
        g.evaluate();
      }
    }

    this.refresh();
  }

  gameX(x) {
    this.player.setx(x - this.br.left);
  }

  gameY(y) {
    this.player.sety(y - this.br.top);
  }

  // card -> [columnIndex:int, stackIndex:int]
  searchStackByCard(card) {
    for (let i = 0; i < this.stackCols.length; i++) {
      for (let j = 0; j < this.stackCols[i].length; j++) {
        for (let k = 0; k < this.stackCols[i][j].cards.length; k++) {
          if (card == this.stackCols[i][j].cards[k]) {
            return [i, j, this.stackCols[i][j]];
          }
        }
      }
    }
    return [];
  }

  draw() {
    let l = Math.min(this.mainDeck.cards.length, 3);
    if (l != 0) {//draw up to three cards from maindeck to hand
      let cardArr = this.mainDeck.pop(l).reverse();
      for (let i = 0; i < cardArr.length; i++) {
        cardArr[i].flip();
      }
      sounds['high-tick'].play();
      this.handStack.push(cardArr);
    } else {
      if (this.handStack.cards.length != 0) { //if no cards in deck, but cards in hand, move hand to deck
        sounds['low-tick'].play();
        this.handStack.flip();
        this.mainDeck.push(this.handStack.pop(this.handStack.cards.length));
        //reverse the order of the cards
        this.mainDeck.cards = this.mainDeck.cards.reverse();
      }
    }
    this.evaluate(true);
  }

  drawCard (card, pX, pY) {
    //The cards should draw with the aspect ratio 1:1.52821, the size is
    //to be denoted below following that aspect ratio!
    this.ctx.drawImage(card.img, pWidth(pX), pHeight(pY), cWidth, cHeight);
  }

  //for the draw stack function, it is possible to pass a player into the stack argument
  //to do so, set col===false
  //also, if set col===true to draw hand stack, in col one, and only the top three cards!
  drawStack (stack, col) {
    let x;
    let y;
    //if col is not a valid column
    if (col === false) {  //remember, in the following block of code, when used correctly, stack actually refers to a player object
      x = stack.x;
      y = stack.y;
      stack = stack.cardStack;
    } else if (col === true) { //when drawing the hand stack
      x = 5;
      y = stack.y;
      let n = Math.min(3, stack.cards.length);
      if (!(stack.cards.length < 3) && this.player.fromStack == stack) {
        n--;
      }
      for (let i = 0; i < n; i++) {
        this.ctx.drawImage(stack.cards[stack.cards.length - n + i].img, x, y, cWidth, cHeight);
        this.ctx.drawImage(emptCardImg, x, y, cWidth, cHeight);
        y += stack.cardOffset;
      }
      return;
    } else { //otherwise, when fun used correctly, stack:Stack and col:num in game.colstacks
      x = ((col - 1) * colWidth) + 5;
      y = stack.y;
      if (stack.cards.length === 0) {
        if (stack === this.mainDeck) {
          this.ctx.drawImage(emptDeckImg, x, y, cWidth, cHeight);
        }
        this.ctx.drawImage(emptCardImg, x, y, cWidth, cHeight);
        return;
      }
    }

    for (let i = 0; i < stack.cards.length; i++) {
      this.ctx.drawImage(stack.cards[i].img, x, y, cWidth, cHeight);
      this.ctx.drawImage(emptCardImg, x, y, cWidth, cHeight);
      y += stack.cardOffset;
    }
  }

  //function that evaluates current state of game and determines next step (gameover, win, loose, etc)
  evaluate(flag=false) {
    //refresh pointer position and such
    this.player.isOver = this.playerAt(this.player);

    //if one of the seven main stacks has all face down cards, and the player is not carrying card(s) from that stack, flip the top card
    for (let i = 0; i < this.cardStacks.length; i++) {
      if (this.cardStacks[i].cards.length === 0) {
        continue;
      }
      if (!this.cardStacks[i].cards[this.cardStacks[i].cards.length - 1].faceup) { //if the top card in the stack is face down
        if (this.player.fromStack != this.cardStacks[i]) {
          this.cardStacks[i].cards[this.cardStacks[i].cards.length - 1].flip(); //if the player does not have a card from that stack, flip the top card to be faceup
        }
      }
    }
    return;
  }
  //function that will run in events that satisfy end of game
  gameOver() {
    return;
  }

  //function that evaluates whether or not the player is over a stack base
  isOverStackBase(player) {
    let col = Math.trunc(player.x / colWidth);
    if (player.x < (col * colWidth) + 5 && player.x > ((col + 1) * colWidth) - 5) {
      return;
    }
    let y = player.y;
    for (let i=0; i < this.stackCols[col].length; i++) {
      if(y >= this.stackCols[col][i].y && y <= this.stackCols[col][i].y + cHeight) {
        return this.stackCols[col][i];
      }
    }
  }

  //function that returns the card (if any) that the player is at
  playerAt(player) {
    let x = player.x;
    let y = player.y;
    let stacks = this.stackCols[Math.trunc(x / colWidth)];
    //which (if any) of the columns is the player in?
    if ((x % colWidth) > 5 && (x % colWidth) < (colWidth - 5)) {
      if (x >= width || y >= height) {
        return new Card(new Suit('undefined', 'undefined', 'undefined'), 'none');
      }
      //furthermore, is the player inside of a stack vertically speaking?
      for (let i = 0; i < stacks.length; i++) {
        if ((stacks[i].y <= y) && (stacks[i].y + stacks[i].height()) >= y) {
          let ind = Math.trunc((y - stacks[i].y) / stacks[i].cardOffset);
          let out;
          if (stacks[i] == this.handStack) { //only the TOP three cards are visible in handstack
            ind = Math.min(ind, 2);
            out = stacks[i].cards[stacks[i].cards.length - 3 + ind];
          } else {
            ind = Math.min(ind, (stacks[i].cards.length - 1));
            out = stacks[i].cards[ind];
          }
          if (out) {
            return out;
          }
        }
      }
    }
    return new Card(new Suit(null, null, null), null);
  }

  //method (looped with recursive timeout) that will handle all things that occur repetitiously
  refresh() {
    //all the things that occur iteratively
    this.renderGame();
    //if stop is true, do not refresh again
    if (this.done) {
      return;
    } else {
      return setTimeout(() => {
        globalGame.refresh();
      }, 10);
    }
  }

  //method to draw all gui components based on their current states
  renderGame() {
    //first clear everything
    this.ctx.clearRect(0,0,width,height);

    //then, render all the stacks in colstacks
    for(let i = 0; i < this.stackCols.length; i++) {
      for (let j = 0; j < this.stackCols[i].length; j++) {
        if (i===0 && j===1){ //for the hand stack, we only want the top three cards!
          this.drawStack(this.stackCols[i][j], true);
          continue;
        }
        this.stackCols[i][j].heightRefresh(); //will be used to modify offset, to ensure entire stack is visible
        this.drawStack(this.stackCols[i][j], (i + 1));
      }
    }
    //draw a draw icon on top of Deck while there are cards left in the deck
    if (this.mainDeck.cards.length != 0) {
      this.ctx.drawImage(emptDeckImg, 5, this.mainDeck.y, cWidth, cHeight);
    }

    //lastly render the player stack (if there is one)
    //this.player.cardStack.heightRefresh();
    this.drawStack(this.player, false);
  }

}


var root = document.getElementById('gamearea');

var newGame = new Game(root);
