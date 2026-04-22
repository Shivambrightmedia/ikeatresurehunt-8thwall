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
      new Clue('clue_2', 'monkey', 'I love bananas and swinging from trees. Find the Monkey!', 'HINT: Look for something playful and furry!'),
      new Clue('clue_3', 'orangedog', 'I\'m orange and love to play fetch. Find the Orange Dog!', 'HINT: Look for something bright and friendly!'),
      new Clue('clue_4', 'tigerpilow', 'I have stripes and I\'m soft to cuddle. Find the Tiger Pillow!', 'HINT: Look for something striped and comfortable!')
    ];
  }

  getShuffled(count) {
    return [...this.pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }
}
