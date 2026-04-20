class GameManager {
  constructor(cluePool, databaseService) {
    this.cluePool = cluePool;
    this.db = databaseService;

    this.clueOrder = [];
    this.round = 0;
    this.playerName = '';
    this.accessCode = ''; // Use phone number as access code
    this.sessionId = null;
    this.startedAt = null;
    this.isTransitioning = false;

    this.onClueUpdate = null;
    this.onSuccess = null;
    this.onGameComplete = null;
  }

  async start(name, phone) {
    this.playerName = name;
    this.accessCode = phone;

    // 1. Validate / Get Access Code Record
    let codeRecord = await this.db.validateAccessCode(phone);
    if (!codeRecord) {
      codeRecord = await this.db.registerAccessCode(phone, name);
    }

    // 2. Check for completion lockout
    if (codeRecord && codeRecord.status === 'completed') {
      const { data, error } = await this.db.client
        .from('sessions')
        .select('*')
        .eq('access_code', phone)
        .maybeSingle();
      
      const sess = error ? null : data;
      this.handleLockedSession(sess, name);
      return;
    }

    // 3. Get / Create Session
    let session = await this.db.getSession(phone);
    if (!session) {
      const clueIds = this.cluePool.getShuffled(CONFIG.TOTAL_CLUES).map(c => c.id);
      session = await this.db.createSession(phone, clueIds);
    }

    if (!session) {
      console.error('Failed to create/fetch session');
      return;
    }

    // 4. Load State
    this.playerName = codeRecord ? (codeRecord.user_name || name) : name;
    this.sessionId = session.id;
    this.round = session.current_clue_index || 0;
    this.startedAt = new Date(session.started_at);

    if (session.assigned_clues && session.assigned_clues.length > 0) {
      this.clueOrder = session.assigned_clues.map(id => this.cluePool.pool.find(c => c.id === id)).filter(c => c);
    }

    if (this.clueOrder.length === 0) {
      this.clueOrder = this.cluePool.getShuffled(CONFIG.TOTAL_CLUES);
    }

    this.nextRound();
  }

  handleLockedSession(session, name) {
    let finalTimeStr = '';
    const rewards = session?.rewards_earned || [];
    
    if (session && session.started_at && session.completed_at) {
      const diffMs = new Date(session.completed_at) - new Date(session.started_at);
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      finalTimeStr = `${mins}m ${secs}s`;
    }
    
    if (this.onGameComplete) {
      this.onGameComplete(name, finalTimeStr, rewards);
    }
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

      const newRound = this.round + 1;
      await this.db.updateProgress(this.accessCode, {
        current_clue_index: newRound,
        completed_clues: this.clueOrder.slice(0, newRound).map(c => c.id)
      });

      setTimeout(() => {
        this.round = newRound;
        this.nextRound();
      }, 2500);
    }
  }

  async completeGame() {
    let finalTimeStr = '';
    let rewards = [];
    
    if (this.startedAt) {
      const now = new Date();
      const diffMs = now - this.startedAt;
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      finalTimeStr = `${mins}m ${secs}s`;
    }

    // Generate Final Reward Barcode
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const barcode = `IKEA-${timestamp}-${random}`;
    
    rewards = [{
      id: 'reward_final',
      type: 'final',
      barcode: barcode,
      unlocked_at: new Date().toISOString()
    }];

    await this.db.updateProgress(this.accessCode, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      rewards_earned: rewards
    });

    if (this.onGameComplete) {
      this.onGameComplete(this.playerName, finalTimeStr, rewards);
    }
  }

  getCurrentTarget() {
    return this.clueOrder[this.round]?.target;
  }
}
