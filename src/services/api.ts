
import { supabase } from './supabase';
import { normalizarPapel, perfilAdministrativo } from '../config/modules';

export interface VencimentoItem {
  id: string;
  nome: string;
  data: string;
  dias: number;
  larguraBarra: `${number}%` | number;
  cor: string;
}

export interface DashboardDados {
  vencimentos: VencimentoItem[];
  graficoBarras: { previsto: number[]; realizado: number[] };
  graficoLinha: { receita: number[]; despesa: number[] }; 
  labelsMeses: string[];
}
export interface MembroDiretoria {
  papel: string;
  nome: string;
  iniciais: string;
  email: string;
  cor: string;
}

export interface HistoricoMensagem {
  data: string;
  destino: string;
  assunto: string;
  status: string;
}

export const identificarUsuario = async (cpfNumeros: string) => {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('nome, status')
    .eq('cpf', cpfNumeros)
    .maybeSingle();

  if (error) {
    throw new Error('ERRO_BANCO');
  }

  if (!usuario) {
    throw new Error('USUARIO_NAO_ENCONTRADO');
  }

  return usuario;
};

export const realizarLogin = async (cpfLimpo: string, senhaDigitada: string) => {
  const { data: usuario, error: erroUsu } = await supabase
    .from('usuarios')
    .select('id, nome, senha')
    .eq('cpf', cpfLimpo)
    .single();

  if (erroUsu || !usuario) throw new Error('CREDENCIAIS_INVALIDAS');

  if (usuario.senha !== senhaDigitada) {
    throw new Error('CREDENCIAIS_INVALIDAS');
  }

  const { data: vinculos, error: erroVinc } = await supabase
    .from('usuarios_condominios')
    .select(`papel, unidade, condominios (id, nome, endereco)`)
    .eq('usuario_id', usuario.id);

  if (erroVinc) throw new Error('ERRO_BUSCAR_CONDOMINIOS');

  const condominiosFormatados = (vinculos || []).map((v: any) => {
    const condo = Array.isArray(v.condominios) ? v.condominios[0] : v.condominios;
    return {
      id: condo?.id,
      nome: condo?.nome,
      end: condo?.endereco,
      papel: v.papel,
      unidade: v.unidade 
    };
  });

  return {
    nome: usuario.nome,
    condominios: condominiosFormatados,
    token: 'jwt_secure_token_real' 
  };
};







export const buscarBoletos = async (condominioId: string, unidade: string, papel: string) => {
  
  let query = supabase
    .from('boletos')
    .select('*')
    .eq('condominio_id', condominioId);

  
  
  const podeVerTodasUnidades = perfilAdministrativo(normalizarPapel(papel));
  if (!podeVerTodasUnidades) {
    query = query.eq('unidade', unidade);
  }

  
  const { data, error } = await query.order('vencimento', { ascending: false });

  if (error) return [];

  return (data || []).map(b => {
    const dataVencimento = new Date(b.vencimento);
    const hoje = new Date();
    const diffTime = dataVencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const [ano, mes, dia] = b.vencimento.split('-');
    return {
      id_condominio: b.condominio_id,
      unidade: b.unidade,
      vencto: `${dia}/${mes}/${ano}`,              
      valor: parseFloat(b.valor),         
      status: b.status,                    
      dias: b.status === 'pago' ? 0 : diffDays, 
      id: b.id
    };
  });
};

export const buscarReparos = async (condominioId: string) => {
  const { data, error } = await supabase
    .from('reparos')
    .select('*')
    .eq('condominio_id', condominioId)
    .order('id', { ascending: false });

  if (error) return [];

  return (data || []).map(r => ({
    id: r.id,
    id_condominio: r.condominio_id,
    area: r.area,
    
    
    protocolo: r.protocolo || r.id,
    status: r.status,
    titulo: r.titulo,
    data: r.created_at,
    nota: r.nota,
    progresso: parseFloat(r.progresso_pct || '0') / 100
  }));
};

export const buscarEspacosReservas = async (condominioId: string) => {
  const { data, error } = await supabase
    .from('espacos')
    .select('*')
    .eq('condominio_id', condominioId)
    .eq('ativo', true);

  if (error) return [];

  return (data || []).map(e => ({
    id: e.id,
    nome: e.nome,
    responsavel: e.responsavel,
    capacidade: e.capacidade,
    valor: parseFloat(e.valor || '0'),
    antecedencia: e.antecedencia,
    icone: 'home',
    bannerColors: ['#00A859', '#00803f'], 
    approvedDays: [], 
    pendingDays: [],
    blockedDays: []
  }));
};

export const buscarDiretoria = async (condominioId: string) => {
  const { data: vinculos } = await supabase
    .from('usuarios_condominios')
    .select('papel, usuarios(nome, email)')
    .eq('condominio_id', condominioId);

  const { data: mensagens } = await supabase
    .from('mensagens_diretoria')
    .select('*')
    .eq('condominio_id', condominioId);

  const membrosFormatados = (vinculos || [])
    .filter((v: any) => ['Síndico', 'Subsíndico', 'Conselheiro', 'Conselheira', 'Zelador'].includes(v.papel))
    .map((v: any, index: number) => {
      const nomeUsuario = Array.isArray(v.usuarios) ? v.usuarios[0]?.nome : v.usuarios?.nome;
      const nome = nomeUsuario || 'Funcionário';
      return {
        papel: v.papel,
        nome: nome,
        iniciais: nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        email: Array.isArray(v.usuarios) ? v.usuarios[0]?.email : v.usuarios?.email,
        cor: index % 2 === 0 ? '#43a047' : '#1565c0'
      };
    });

  const historicoFormatado = (mensagens || []).map(m => {
    return {
      data: m.created_at,
      destino: m.destinatario_papel,
      assunto: m.assunto,
      status: m.status
    };
  });

  return {
    membros: membrosFormatados,
    historico: historicoFormatado
  };
};

export const enviarMensagemDiretoria = async (dados: {
  condominio_id: string;
  remetente_id: string;
  destinatario_papel: string;
  assunto: string;
  mensagem: string;
  status: string;
}) => {
  const { error } = await supabase
    .from('mensagens_diretoria')
    .insert([dados]);

  if (error) {
    throw error;
  }
};

export const buscarMudancas = async (condominioId: string) => {
  const { data, error } = await supabase
    .from('mudancas')
    .select('*')
    .eq('condominio_id', condominioId);

  if (error) return { regras: {}, approvedDays: [], pendingDays: [], blockedDays: [], historico: [] };

  
  const approvedDays: number[] = [];
  const pendingDays: number[] = [];

  const historicoFormatado = (data || []).map(m => {
    const dataObj = new Date(m.data_mudanca);
    
    const diaNum = dataObj.getUTCDate(); 
    if (m.status?.toLowerCase() === 'aprovado') {
      approvedDays.push(diaNum);
    } else {
      pendingDays.push(diaNum);
    }

    const [ano, mes, dia] = m.data_mudanca.split('-');
    return {
      data: `${dia}/${mes}`,
      tipo: m.tipo,
      complemento: m.empresa || '',
      status: m.status
    };
  });

  return { 
    regras: { responsavel: 'Zelador', horario: '08:00 às 18:00', antecedencia: '2 dias', acesso: 'Elevador de Serviço' }, 
    approvedDays, 
    pendingDays, 
    blockedDays: [], 
    historico: historicoFormatado 
  };
};

export const buscarDashboard = async (condominioId: string): Promise<DashboardDados> => {
  
  const { data: condo } = await supabase
    .from('condominios')
    .select('conta_corrente, investimentos, inadimplencia')
    .eq('id', condominioId)
    .single();

  
  const { data: fluxo } = await supabase
    .from('fluxo_caixa')
    .select('*')
    .eq('condominio_id', condominioId)
    .order('mes_ano', { ascending: true })
    .limit(6);

  
  const fluxoValido = fluxo && fluxo.length > 0 ? fluxo : [];
  
  const receitaPrevista = fluxoValido.map(f => parseFloat(f.receita_prevista));
  const receitaRealizada = fluxoValido.map(f => parseFloat(f.receita_realizada));
  const despesaRealizada = fluxoValido.map(f => parseFloat(f.despesa_realizada));

  
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const labelsReais = fluxoValido.map(f => {
    
    const mesNumero = parseInt(f.mes_ano.split('-')[1], 10); 
    return nomesMeses[mesNumero - 1];
  });

  
  const dadosVazios = [0, 0, 0, 0, 0, 0];
  const labelsVazios = ['-', '-', '-', '-', '-', '-'];

  return {
    vencimentos: [],
    graficoBarras: { 
      previsto: receitaPrevista.length > 0 ? receitaPrevista : dadosVazios, 
      realizado: receitaRealizada.length > 0 ? receitaRealizada : dadosVazios 
    },
    graficoLinha: {
      receita: receitaRealizada.length > 0 ? receitaRealizada : dadosVazios,
      despesa: despesaRealizada.length > 0 ? despesaRealizada : dadosVazios
    },
    labelsMeses: labelsReais.length > 0 ? labelsReais : labelsVazios 
  };
};



export const buscarReservasPorEspaco = async (espacoId: string) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('espaco_id', espacoId);

  if (error) throw error;
  return data || [];
};

export const criarNovaReserva = async (dados: {
  espaco_id: string;
  usuario_id: string;
  data_evento: string;
  periodo: string;
  status: string;
}) => {
  const { error } = await supabase
    .from('reservas')
    .insert([dados]);

  if (error) throw error;
};




export interface CircularItem {
  id: string;
  categoria: string;
  titulo: string;
  corpo: string;
  publicadoEm: string;
}

export const buscarCirculares = async (condominioId: string): Promise<CircularItem[]> => {
  const { data, error } = await supabase
    .from('circulares')
    .select('*')
    .eq('condominio_id', condominioId)
    .order('publicado_em', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(c => ({
    id: c.id,
    categoria: c.categoria,
    titulo: c.titulo,
    corpo: c.corpo,
    publicadoEm: c.publicado_em
  }));
};

export const criarCircular = async (condominioId: string, categoria: string, titulo: string, corpo: string) => {
  const { error } = await supabase.from('circulares').insert([{
    condominio_id: condominioId,
    categoria,
    titulo,
    corpo
  }]);
  if (error) throw error;
};




export const listarEventos = async (condominioId: string) => {
  const { data, error } = await supabase.from('eventos').select('*').eq('condominio_id', condominioId).order('data', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const salvarEvento = async (dados: any, id?: string) => {
  const { error } = id
    ? await supabase.from('eventos').update(dados).eq('id', id)
    : await supabase.from('eventos').insert([dados]);
  if (error) throw error;
};

export const excluirEvento = async (id: string) => {
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  if (error) throw error;
};

export const listarMudancas = async (condominioId: string) => {
  const { data, error } = await supabase.from('mudancas').select('*').eq('condominio_id', condominioId);
  if (error) throw error;
  return data || [];
};

export const criarMudanca = async (dados: any) => {
  const { error } = await supabase.from('mudancas').insert([dados]);
  if (error) throw error;
};

export const atualizarStatusMudanca = async (id: string, status: string) => {
  const { error } = await supabase.from('mudancas').update({ status }).eq('id', id);
  if (error) throw error;
};

export const criarReparo = async (dados: any) => {
  const { error } = await supabase.from('reparos').insert([dados]);
  if (error) throw error;
};

export const atualizarReparo = async (id: string, dados: any) => {
  const { error } = await supabase.from('reparos').update(dados).eq('id', id);
  if (error) throw error;
};

export const listarReservasDoEspaco = async (espacoId: string) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('id, data_evento, status, nome_evento, periodo, observacoes, usuario:usuarios(nome)')
    .eq('espaco_id', espacoId);
  if (error) throw error;
  return data || [];
};

export const criarReserva = async (dados: any) => {
  const { data: reservasExistentes, error: erroConsulta } = await supabase
    .from('reservas')
    .select('id, status')
    .eq('espaco_id', dados.espaco_id)
    .eq('data_evento', dados.data_evento)
    .eq('periodo', dados.periodo)
    .in('status', ['pendente', 'aprovada'])
    .limit(1);

  if (erroConsulta) throw erroConsulta;
  if (reservasExistentes && reservasExistentes.length > 0) {
    throw new Error('RESERVA_JA_EXISTE');
  }

  const { error } = await supabase.from('reservas').insert([dados]);
  if (error) throw error;
};

export const atualizarStatusReserva = async (id: string, status: 'aprovada' | 'recusada') => {
  const { error } = await supabase.from('reservas').update({ status }).eq('id', id);
  if (error) throw error;
};

export const criarEspaco = async (dados: any) => {
  const { data, error } = await supabase.from('espacos').insert([dados]).select().single();
  if (error) throw error;
  return data;
};

export const listarHistoricoMensagens = async (condominioId: string, remetenteId: string) => {
  const { data, error } = await supabase.from('mensagens_diretoria').select('*').eq('condominio_id', condominioId).eq('remetente_id', remetenteId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const listarCaixaEntradaDiretoria = async (condominioId: string, papel: string) => {
  const { data, error } = await supabase.from('mensagens_diretoria').select('*, remetente:usuarios(nome)').eq('condominio_id', condominioId).in('destinatario_papel', [papel, 'Todos']).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const responderMensagemDiretoria = async (id: string, resposta: string) => {
  const { error } = await supabase.from('mensagens_diretoria').update({ resposta, status: 'Respondido' }).eq('id', id);
  if (error) throw error;
};
