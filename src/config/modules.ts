

export interface ModuloApp {
  g: string;
  key: string;
  nome: string;
  desc: string;
  ic: string;
  route?: string;
  stub?: boolean;
  roles: string[];
}

export const PAPEIS_ADMINISTRATIVOS = ['Síndico', 'Gestor', 'Gestor de RH', 'Conselheiro'];

export const MODULOS: ModuloApp[] = [

  { g: 'Financeiro', key: 'boletos', nome: 'Boletos e Pagamentos', desc: '2ª via, código de barras e pagamentos', ic: 'file-text', route: 'BoletosTab', roles: ['Síndico', 'Proprietário', 'Morador', 'Gestor'] },
  { g: 'Financeiro', key: 'saldo', nome: 'Saldo', desc: 'Saldo financeiro do condomínio', ic: 'credit-card', route: 'DashboardTab', roles: ['Síndico', 'Gestor'] },
  { g: 'Financeiro', key: 'extratos', nome: 'Extratos Financeiros', desc: 'Extratos e fluxo de caixa', ic: 'file', stub: true, roles: ['Síndico', 'Proprietário', 'Gestor'] },
  { g: 'Financeiro', key: 'cotas', nome: 'Cotas Pendentes', desc: 'Cotas em aberto por unidade', ic: 'clock', stub: true, roles: ['Síndico', 'Gestor', 'Morador'] },
  { g: 'Financeiro', key: 'notas', nome: 'Notas Fiscais', desc: 'Notas de aluguéis', ic: 'clipboard', stub: true, roles: ['Gerente', 'Proprietário'] },
  { g: 'Financeiro', key: 'rendimentos', nome: 'Informe de Rendimentos', desc: 'Comprovante para IR', ic: 'trending-up', stub: true, roles: ['Síndico', 'Proprietário'] },
  { g: 'Financeiro', key: 'gastos', nome: 'Gestão de Gastos', desc: 'Adiantamentos e reembolsos', ic: 'dollar-sign', stub: true, roles: ['Síndico', 'Gestor'] },
  { g: 'Financeiro', key: 'dashboard', nome: 'Dashboard Gerencial', desc: 'Visão financeira do condomínio', ic: 'pie-chart', route: 'DashboardTab', roles: ['Síndico', 'Gestor'] },

  { g: 'Imóveis', key: 'meus-imoveis', nome: 'Meus Imóveis', desc: 'Situação financeira dos imóveis', ic: 'home', stub: true, roles: ['Proprietário'] },
  { g: 'Imóveis', key: 'pesquisa-alug', nome: 'Pesquisa de Aluguéis', desc: 'Valores de mercado', ic: 'search', stub: true, roles: ['Gerente', 'Proprietário'] },
  { g: 'Imóveis', key: 'gerente', nome: 'Meu Gerente de Contas', desc: 'Contato do gerente responsável', ic: 'star', stub: true, roles: ['Proprietário', 'Gerente', 'Gestor'] },

  { g: 'Comunicação', key: 'circulares', nome: 'Circulares', desc: 'Comunicados do condomínio', ic: 'volume-2', route: 'Circulares', roles: ['Síndico', 'Conselheiro', 'Gestor', 'Morador', 'Proprietário'] },
  { g: 'Comunicação', key: 'contato-cd', nome: 'Fale com o Síndico', desc: 'Tickets de comunicação', ic: 'message-square', route: 'ContatoCD', roles: ['Morador', 'Síndico'] },
  
  
  { g: 'Comunicação', key: 'agenda-cond', nome: 'Agenda do Condomínio', desc: 'Calendário de eventos', ic: 'calendar', route: 'AgendaCondominio', roles: ['Morador', 'Síndico', 'Zelador', 'Porteiro'] },
  
  { g: 'Comunicação', key: 'notificacoes', nome: 'Notificações', desc: 'Central de notificações push', ic: 'bell', stub: true, roles: ['Síndico', 'Proprietário', 'Morador', 'Gestor', 'Gerente', 'Conselheiro', 'Porteiro', 'Zelador'] },
  { g: 'Comunicação', key: 'fale-conosco', nome: 'Fale Conosco', desc: 'Suporte por e-mail', ic: 'headphones', stub: true, roles: ['Síndico', 'Proprietário', 'Morador', 'Gestor', 'Gerente', 'Conselheiro', 'Porteiro', 'Zelador'] },

  { g: 'Operação e Acesso', key: 'reservas', nome: 'Reserva de Espaços', desc: 'Reservar áreas comuns', ic: 'calendar', route: 'Reservas', roles: ['Morador', 'Síndico'] },
  { g: 'Operação e Acesso', key: 'agenda-mud', nome: 'Agenda de Mudanças', desc: 'Autorização de entrada/saída', ic: 'truck', route: 'AgendaMudancas', roles: ['Morador', 'Síndico', 'Zelador'] },
  { g: 'Operação e Acesso', key: 'portaria', nome: 'Painel da Portaria', desc: 'Entradas, saídas, visitas, entregas', ic: 'package', stub: true, roles: ['Porteiro', 'Síndico', 'Zelador'] }, 
  { g: 'Operação e Acesso', key: 'consumo', nome: 'Controle de Consumo', desc: 'Leitura de água e gás', ic: 'droplet', stub: true, roles: ['Zelador', 'Síndico'] },
  { g: 'Operação e Acesso', key: 'reparos', nome: 'Manutenção e Reparos', desc: 'Solicitar e acompanhar reparos', ic: 'tool', route: 'Reparos', roles: ['Síndico', 'Zelador'] },

  { g: 'Documentos e RH', key: 'documentos', nome: 'Documentos Digitalizados', desc: 'Upload e download de documentos', ic: 'folder', stub: true, roles: ['Síndico', 'Proprietário', 'Morador', 'Gestor', 'Gerente', 'Conselheiro', 'Porteiro', 'Zelador'] },
  { g: 'Documentos e RH', key: 'dp', nome: 'Departamento Pessoal', desc: 'Admissão, frequência, férias', ic: 'users', stub: true, roles: ['Gestor', 'Síndico', 'Gestor de RH'] },
  { g: 'Documentos e RH', key: 'obrigacoes', nome: 'Obrigações Legais', desc: 'Conformidade civil e trabalhista', ic: 'briefcase', stub: true, roles: ['Síndico', 'Gestor'] }
];

export function normalizarPapel(papelAtual = 'Morador'): string {
  const mapaLegado: Record<string, string> = {
    'SÃ­ndico': 'Síndico',
    'ProprietÃ¡rio': 'Proprietário',
    'CondomÃ­nio': 'Condomínio',
  };

  return mapaLegado[papelAtual] || papelAtual;
}

export function perfilAdministrativo(papelAtual = 'Morador'): boolean {
  return PAPEIS_ADMINISTRATIVOS.includes(normalizarPapel(papelAtual));
}

export function obterModulosPermitidos(papelAtual: string): ModuloApp[] {
  const papel = normalizarPapel(papelAtual);

  return MODULOS.filter(mod => {
    if (mod.roles.includes(papel)) return true;

    if (
      papel === 'Síndico'
      && (mod.roles.includes('Gestor') || mod.roles.includes('Gestor de RH') || mod.roles.includes('Conselheiro'))
    ) {
      return true;
    }

    return false;
  });
}
