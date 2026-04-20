class DatabaseService {
  constructor() {
    this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  }

  async getSessionByPhone(phone) {
    try {
      const { data, error } = await this.client
        .from('game_sessions')
        .select('*')
        .eq('player_phone', phone)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Supabase Fetch Error:', err);
      return null;
    }
  }

  async savePlayer(name, phone, assignedClues) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await this.client
        .from('game_sessions')
        .insert([{ 
          player_name: name,
          player_phone: phone, 
          status: 'started',
          assigned_clues: assignedClues, // Array of clue IDs
          current_clue_index: 0,
          expires_at: expiresAt.toISOString(),
          started_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('Supabase Save Error:', err);
      return null;
    }
  }

  async updateProgress(sessionId, updates) {
    try {
      await this.client
        .from('game_sessions')
        .update(updates)
        .eq('id', sessionId);
    } catch (err) {
      console.error('Supabase Update Error:', err);
    }
  }

  async markCompleted(sessionId) {
    try {
      await this.client
        .from('game_sessions')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Supabase Completion Error:', err);
    }
  }
}
