class GameManager {
  constructor(cluePool, databaseService) {
    this.cluePool = cluePool;
    this.db = databaseService;

    this.clueOrder = this.cluePool.getShuffled(CONFIG.TOTAL_CLUES);
    this.round = 0;
    this.playerName = '';
    this.playerPhone = '';
    this.sessionId = null;
    this.isTransitioning = false;

    this.onClueUpdate = null;
    this.onSuccess = null;
    this.onGameComplete = null;
  }

  async start(name, phone) {
    this.playerName = name;
    this.playerPhone = phone;
    const session = await this.db.savePlayer(name, phone);
    if (session) this.sessionId = session.id;

    this.nextRound();
  }

  nextRound() {
    if (this.round >= this.clueOrder.length) {
      this.completeGame();
      return;
    }

    const clue = this.clueOrder[this.round];
    if (this.onClueUpdate) {
      this.onClueUpdate(clue, this.round + 1, this.clueOrder.length);
    }
    this.isTransitioning = false;
  }

  handleTargetFound(targetName) {
    if (this.isTransitioning) return;

    const currentClue = this.clueOrder[this.round];
    if (targetName === currentClue.target) {
      this.isTransitioning = true;
      if (this.onSuccess) this.onSuccess();

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 2500); // Wait for success animation
    }
  }

  async completeGame() {
    if (this.sessionId) {
      await this.db.markCompleted(this.sessionId);
    }
    if (this.onGameComplete) {
      this.onGameComplete(this.playerName);
    }
  }

  getCurrentTarget() {
    return this.clueOrder[this.round]?.target;
  }
}
