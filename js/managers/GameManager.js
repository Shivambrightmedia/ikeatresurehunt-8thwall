class GameManager {
  constructor(cluePool, databaseService) {
    this.cluePool = cluePool;
    this.db = databaseService;
    
    this.clueOrder = [];
    this.round = 0;
    this.playerName = '';
    this.playerPhone = '';
    this.sessionId = null;
    this.startedAt = null;
    this.isTransitioning = false;
    
    this.onClueUpdate = null;
    this.onSuccess = null;
    this.onGameComplete = null;
  }

  async start(name, phone) {
    this.playerName = name;
    this.playerPhone = phone;

    // 1. Check for existing session (Resume)
    const existing = await this.db.getSessionByPhone(phone);
    
    if (existing) {
      if (existing.status === 'completed') {
        // Already finished - show reward screen
        this.sessionId = existing.id;
        this.playerName = existing.player_name || name;
        this.startedAt = new Date(existing.started_at);
        
        let finalTimeStr = '';
        if (existing.completed_at) {
          const start = new Date(existing.started_at);
          const end = new Date(existing.completed_at);
          const diffMs = end - start;
          const mins = Math.floor(diffMs / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          finalTimeStr = `${mins}m ${secs}s`;
        }
        
        if (this.onGameComplete) {
          this.onGameComplete(this.playerName, finalTimeStr);
        }
        return;
      }

      // Resume existing game
      this.sessionId = existing.id;
      this.playerName = existing.player_name || name;
      this.round = existing.current_clue_index || 0;
      this.startedAt = new Date(existing.started_at);
      
      // Load assigned clues from DB
      if (existing.assigned_clues && existing.assigned_clues.length > 0) {
        this.clueOrder = existing.assigned_clues.map(id => this.cluePool.pool.find(c => c.id === id)).filter(c => c);
      }
      
      if (this.clueOrder.length === 0) {
        this.clueOrder = this.cluePool.getShuffled(CONFIG.TOTAL_CLUES);
      }
    } else {
      // Start fresh
      this.clueOrder = this.cluePool.getShuffled(CONFIG.TOTAL_CLUES);
      const clueIds = this.clueOrder.map(c => c.id);
      
      const session = await this.db.savePlayer(name, phone, clueIds);
      if (session) {
        this.sessionId = session.id;
        this.startedAt = new Date(session.started_at);
      } else {
        this.startedAt = new Date(); // Fallback
      }
      this.round = 0;
    }
    
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

  async handleTargetFound(targetName) {
    if (this.isTransitioning) return;
    
    const currentClue = this.clueOrder[this.round];
    if (targetName === currentClue.target) {
      this.isTransitioning = true;
      if (this.onSuccess) this.onSuccess();
      
      // Update DB progress
      if (this.sessionId) {
        await this.db.updateProgress(this.sessionId, { 
          current_clue_index: this.round + 1,
          last_activity: new Date().toISOString()
        });
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 2500);
    }
  }

  async completeGame() {
    let finalTimeStr = '';
    if (this.startedAt) {
      const now = new Date();
      const diffMs = now - this.startedAt;
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      finalTimeStr = `${mins}m ${secs}s`;
    }

    if (this.sessionId) {
      await this.db.markCompleted(this.sessionId);
    }

    if (this.onGameComplete) {
      this.onGameComplete(this.playerName, finalTimeStr);
    }
  }

  getCurrentTarget() {
    return this.clueOrder[this.round]?.target;
  }
}
