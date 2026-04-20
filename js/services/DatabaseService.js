class DatabaseService {
  constructor() {
    this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  }

  async savePlayer(name, phone) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

      const { data, error } = await this.client
        .from('game_sessions')
        .insert([{ 
          player_name: name, // User needs to add these columns to table
          player_phone: phone, 
          status: 'started',
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
      console.error('Supabase Update Error:', err);
    }
  }
}
