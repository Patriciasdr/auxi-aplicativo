
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';

export interface Condominio {
  id: string;
  nome: string;
  end?: string;
  papel: string;
  unidade: string; 
  contaCorrente?: number;
  investimentos?: number;
  inadimplencia?: number;
  baseJurosDias?: number | null;
  diasJuridico?: number | null;
  multaPercentual?: number | null;
  jurosMensalPercentual?: number | null;
}

interface AuthContextData {
  estaAutenticado: boolean;
  carregandoContexto: boolean;
  token: string | null;
  nomeUsuario: string;
  cpf: string;
  notificacoes: number; 
  condominios: Condominio[];
  condominioAtivo: Condominio | null;
  login: (cpf: string, senha: string) => Promise<{ user: any, condominiosVistos: Condominio[] }>;
  logout: () => Promise<void>;
  selecionarCondominioAtivo: (condominio: Condominio) => void;
  marcarNotificacoesComoLidas: () => Promise<void>;
  atualizarContadorNotificacoes: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [carregandoContexto, setCarregandoContexto] = useState(true);
  
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [cpf, setCpf] = useState('');
  const [notificacoes, setNotificacoes] = useState(0); 
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioAtivo, setCondominioAtivo] = useState<Condominio | null>(null);

  useEffect(() => {
    if (!token || !condominioAtivo?.id) return;

    const condominioId = condominioAtivo.id;
    let ativo = true;

    async function carregarNaoLidas() {
      try {
        const { count, error } = await supabase
          .from('notificacoes')
          .select('id', { count: 'exact', head: true })
          .eq('condominio_id', condominioId)
          .eq('usuario_id', token)
          .eq('lida', false);

        if (error) throw error;
        if (ativo) setNotificacoes(count || 0);
      } catch (error) {
        console.error('Erro ao carregar notificações de circulares:', error);
      }
    }

    carregarNaoLidas();

    const canal = supabase
      .channel(`notificacoes-${condominioId}-${token}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `usuario_id=eq.${token}` },
        () => setNotificacoes(valorAtual => valorAtual + 1)
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [token, condominioAtivo?.id, condominioAtivo?.papel]);

  useEffect(() => {
    async function verificarTokenSalvo() {
      try {
        const podeUsar = await SecureStore.isAvailableAsync();
        if (podeUsar) {
          const tokenSalvo = await SecureStore.getItemAsync('auxi_user_token');
          const dadosSalvos = await SecureStore.getItemAsync('auxi_user_data');
          
          if (tokenSalvo && dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            setToken(tokenSalvo);
            setNomeUsuario(dados.nome);
            setCpf(dados.cpf || '');
            setNotificacoes(dados.notificacoes || 0); 
            setCondominios(dados.condominios);
            setCondominioAtivo(dados.condominioAtivo);
            setEstaAutenticado(true);
          }
        }
      } catch (error) {
        console.log('Erro ao ler dados do SecureStore:', error);
      } finally {
        setCarregandoContexto(false);
      }
    }
    verificarTokenSalvo();
  }, []);

  
  const login = async (cpfDigitado: string, senha: string) => {
    try {
      
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cpfDigitado)
        .single();

      if (userError || !usuario) throw new Error('CREDENCIAIS_INVALIDAS');
      if (usuario.status === 'bloqueado') throw new Error('CONTA_BLOQUEADA');
      if (usuario.senha !== senha) throw new Error('CREDENCIAIS_INVALIDAS');

      
      
      const { data: vinculos, error: vinculosError } = await supabase
        .from('usuarios_condominios')
        .select(`
          papel,
          unidade,
          condominios (id, nome, endereco, conta_corrente, investimentos, inadimplencia, cobranca_base_juros_dias, cobranca_dias_juridico, cobranca_multa_percentual, cobranca_juros_mensal_percentual)
        `)
        .eq('usuario_id', usuario.id);

      if (vinculosError || !vinculos) {
        throw new Error('Erro ao carregar as permissões de condomínio.');
      }

      
      const listaCondos: Condominio[] = vinculos.map((v: any) => {
        const condoData = Array.isArray(v.condominios) ? v.condominios[0] : v.condominios;
        
        return {
          id: condoData?.id || '',
          nome: condoData?.nome || 'Condomínio',
          end: condoData?.endereco || '',
          papel: v.papel,
          unidade: v.unidade || '', 
          contaCorrente: parseFloat(condoData?.conta_corrente || 0),
          investimentos: parseFloat(condoData?.investimentos || 0),
          inadimplencia: parseFloat(condoData?.inadimplencia || 0),
          baseJurosDias: condoData?.cobranca_base_juros_dias ?? null,
          diasJuridico: condoData?.cobranca_dias_juridico ?? null,
          multaPercentual: condoData?.cobranca_multa_percentual ?? null,
          jurosMensalPercentual: condoData?.cobranca_juros_mensal_percentual ?? null,
        };
      });

      const ativo = listaCondos.length === 1 ? listaCondos[0] : null;
      const notifs = 0; 
      const fakeToken = usuario.id; 

      const podeUsar = await SecureStore.isAvailableAsync();
      if (podeUsar) {
        await SecureStore.setItemAsync('auxi_user_token', fakeToken);
        await SecureStore.setItemAsync('auxi_user_data', JSON.stringify({
          nome: usuario.nome,
          cpf: cpfDigitado,
          notificacoes: notifs, 
          condominios: listaCondos,
          condominioAtivo: ativo
        }));
      }
      
      setToken(fakeToken);
      setNomeUsuario(usuario.nome);
      setCpf(cpfDigitado);
      setNotificacoes(notifs); 
      setCondominios(listaCondos);
      setCondominioAtivo(ativo);
      setEstaAutenticado(true);

      return { user: usuario, condominiosVistos: listaCondos };

    } catch (error) {
      throw error;
    }
  };

  const selecionarCondominioAtivo = async (condominio: Condominio) => {
    setCondominioAtivo(condominio);
    try {
      const podeUsar = await SecureStore.isAvailableAsync();
      if (podeUsar) {
        await SecureStore.setItemAsync('auxi_user_data', JSON.stringify({
          nome: nomeUsuario,
          cpf: cpf,
          notificacoes, 
          condominios,
          condominioAtivo: condominio
        }));
      }
    } catch (error) {
      console.error('Erro ao salvar o condomínio ativo:', error);
    }
  };

  const logout = async () => {
    try {
      const podeUsar = await SecureStore.isAvailableAsync();
      if (podeUsar) {
        await SecureStore.deleteItemAsync('auxi_user_token');
        await SecureStore.deleteItemAsync('auxi_user_data');
      }
    } catch (error) {
      console.error('Erro ao limpar os dados de autenticação:', error);
    }
    
    setToken(null);
    setNomeUsuario('');
    setCpf('');
    setNotificacoes(0); 
    setCondominios([]);
    setCondominioAtivo(null);
    setEstaAutenticado(false);
  };

  const marcarNotificacoesComoLidas = async () => {
    if (token && condominioAtivo?.id) {
      try {
        const { error } = await supabase
          .from('notificacoes')
          .update({ lida: true })
          .eq('usuario_id', token)
          .eq('condominio_id', condominioAtivo.id)
          .eq('lida', false);
        if (error) throw error;
      } catch (error) {
        console.error('Erro ao marcar notificações como lidas:', error);
      }
    }
    setNotificacoes(0);
  };

  const atualizarContadorNotificacoes = async () => {
    if (!token || !condominioAtivo?.id) return;
    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', token)
        .eq('condominio_id', condominioAtivo.id)
        .eq('lida', false);
      if (error) throw error;
      setNotificacoes(count || 0);
    } catch (error) {
      console.error('Erro ao atualizar o contador de notificações:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      estaAutenticado, carregandoContexto, token, 
      nomeUsuario, cpf, notificacoes, condominios, condominioAtivo, 
      login, logout, selecionarCondominioAtivo, marcarNotificacoesComoLidas, atualizarContadorNotificacoes
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
