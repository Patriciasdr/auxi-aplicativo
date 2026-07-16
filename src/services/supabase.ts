
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 ATENÇÃO: Faltam as variáveis de ambiente do Supabase no .env!");
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function testarConexaoSupabase() {
  try {
    const { error } = await supabase.from('usuarios').select('id').limit(1);
    
    if (error) { 
      console.error("Erro ao conectar:", error.message);
    } else {
      console.log("Supabase Ready/Connected!");
    }
  } catch (err) {
    console.error("Falha crítica na conexão:", err);
  }
}