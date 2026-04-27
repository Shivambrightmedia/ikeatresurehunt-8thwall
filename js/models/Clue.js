class Clue {
  constructor(id, target, text, hint) {
    this.id = id;
    this.target = target;
    this.text = text;
    this.hint = hint;
  }
}

class CluePool {
  constructor() {
    this.pool = [
      new Clue('clue_1', 'ikeaclock', 'I don’t speak, but I always tell the right time. Find me!', 'HINT: Check the wall - time is ticking!'),
      new Clue('clue_2', 'iglu', 'I slide on ice, waddle on land, and love chilly places. Who am I?', 'HINT: Look for something that loves the cold!'),
      new Clue('clue_3', 'studytablemat', 'I’m not a zoo, but I bring the safari to your table. Find me!', 'HINT: Look for something on your study table!'),
      new Clue('clue_4', 'tigerpilow', 'I’m soft, striped, and ready to pounce on your sofa. Find me if you can!', 'HINT: Look for something striped and comfortable!')
    ];
  }

  getShuffled(count) {
    return [...this.pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }
}
