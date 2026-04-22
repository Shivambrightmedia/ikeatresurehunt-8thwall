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
new Clue('clue_1', 'ikeaclock', 'I have hands but no arms, and I help you stay on time. Find the IKEA Clock!', 'HINT: Check the wall - time is ticking!'),
      new Clue('clue_2', 'iglu', 'I keep you warm in cold weather and look like a dome. Find the Igloo!', 'HINT: Look for something that looks like a snow house!'),
      new Clue('clue_3', 'studytablemat', 'I protect your desk and help you study. Find the Study Mat!', 'HINT: Look for something on your study table!'),
      new Clue('clue_4', 'tigerpilow', 'I have stripes and I\'m soft to cuddle. Find the Tiger Pillow!', 'HINT: Look for something striped and comfortable!')
    ];
  }

  getShuffled(count) {
    return [...this.pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }
}
