class DatabaseService {
  constructor() {
    this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  }

  // --- ACCESS CODES ---


  async validateAccessCode(code) {
    try {
      const { data, error } = await this.client
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (err) {
      console.error('Code validation error:', err);
      return null;
    }
  }



  async registerAccessCode(code, userName) {
    try {
      const { data, error } = await this.client
        .from('access_codes')
        .insert([{
          code,
          user_name: userName,
          status: 'active',
          activated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Code registration error:', err);
      return null;
    }
  }

  // --- GAME SESSIONS ---

  async getSession(accessCode) {
    try {
      const { data, error } = await this.client
        .from('game_sessions')
        .select('*')
        .eq('access_code', accessCode)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Session fetch error:', err);
      return null;
    }
  }

  async createSession(accessCode, assignedClues, playerName) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

      const session = {
        access_code: accessCode,
        player_name: playerName, // Add this column to game_sessions table
        current_clue_index: 0,
        assigned_clues: assignedClues,
        completed_clues: [],
        rewards_earned: [],
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        last_activity: now.toISOString()
      };

      const { data, error } = await this.client
        .from('game_sessions')
        .insert([session])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Session creation error:', err);
      return null;
    }
  }

  async updateProgress(accessCode, updates) {
    try {
      await this.client
        .from('game_sessions')
        .update({
          ...updates,
          last_activity: new Date().toISOString()
        })
        .eq('access_code', accessCode);

      // Also update access_codes table if status changes
      if (updates.status) {
        const codeUpdates = { status: updates.status };
        if (updates.status === 'completed') codeUpdates.completed_at = new Date().toISOString();

        await this.client
          .from('access_codes')
          .update(codeUpdates)
          .eq('code', accessCode);
      }
    } catch (err) {
      console.error('Update progress error:', err);
    }
  }
}
