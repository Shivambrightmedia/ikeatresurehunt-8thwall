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
      new Clue('clue_1', 'bell', 'I ring to announce your arrival. Find the Bell!', 'HINT: Look for something that chimes.'),
      new Clue('clue_2', 'clock', 'I have hands but no arms, and I help you stay on time. Find the Clock!', 'HINT: Check the wall — time is ticking!'),
      new Clue('clue_3', 'osama', 'I watch over everything from a frame. Find the Portrait!', 'HINT: Look for a familiar face on display.')
    ];
  }

  getShuffled(count) {
    return [...this.pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }
}
