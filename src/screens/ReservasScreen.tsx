
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { atualizarStatusReserva, bloquearDataEspaco, buscarEspacosReservas, criarEspaco, criarReserva, desbloquearDataEspaco, listarBloqueiosEspaco, listarReservasDoEspaco } from '../services/api';
import { formatarMoeda } from '../utils/formatters';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { normalizarPapel } from '../config/modules';

interface EspacoProps {
  id: string;
  nome: string;
  responsavel: string;
  capacidade: string;
  valor: number;
  antecedencia: string;
  modoAprovacao?: 'automatica' | 'manual' | 'por_inadimplencia';
  icone: string;
  bannerColors: string[];
}

export function ReservasScreen() {
  const { condominioAtivo, token } = useAuth(); 
  
  
  const isSindico = condominioAtivo?.papel === 'Síndico' || condominioAtivo?.papel === 'Gestor';
  const papelAtual = normalizarPapel(condominioAtivo?.papel || '');
  const podeCriarEspaco = papelAtual === 'Administradora';
  const podeGerenciarBloqueios = podeCriarEspaco || papelAtual === 'Síndico';

  const [espacos, setEspacos] = useState<EspacoProps[]>([]);
  const [espacoSelecionado, setEspacoSelecionado] = useState<EspacoProps | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [modalNovoEspacoVisible, setModalNovoEspacoVisible] = useState(false); 

  
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [turnoSelecionado, setTurnoSelecionado] = useState('manha');
  const [nomeEvento, setNomeEvento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);

  
  const [novoEspacoNome, setNovoEspacoNome] = useState('');
  const [novoEspacoCapacidade, setNovoEspacoCapacidade] = useState('');
  const [novoEspacoValor, setNovoEspacoValor] = useState('');
  const [novoEspacoModoAprovacao, setNovoEspacoModoAprovacao] = useState<'automatica' | 'manual' | 'por_inadimplencia'>('manual');

  
  const [reservasCompletas, setReservasCompletas] = useState<any[]>([]);
  const [reservaSelecionadaDetalhe, setReservaSelecionadaDetalhe] = useState<any | null>(null);

  const [approvedDays, setApprovedDays] = useState<number[]>([]);
  const [pendingDays, setPendingDays] = useState<number[]>([]);
  const [blockedDays, setBlockedDays] = useState<number[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [modoBloqueio, setModoBloqueio] = useState(false);

  const [dataFoco, setDataFoco] = useState(new Date()); 
  const anoAtual = dataFoco.getFullYear();
  const mesAtual = dataFoco.getMonth(); 

  const nomeMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const monthDays = Array.from({ length: totalDiasNoMes }, (_, i) => i + 1);
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const emptyDays = Array.from({ length: primeiroDiaSemana }, (_, i) => i);

  const handlePrevMonth = () => setDataFoco(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setDataFoco(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  useEffect(() => {
    async function carregarEspacos() {
      if (!condominioAtivo?.id) return;
      setCarregando(true);
      try {
        const dados = await buscarEspacosReservas(condominioAtivo.id);
        setEspacos(dados as EspacoProps[]);
        if (dados.length > 0) setEspacoSelecionado(dados[0] as EspacoProps);
      } catch (error) {
        console.error('Erro ao carregar espaços:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregarEspacos();
  }, [condominioAtivo]);

  useEffect(() => {
    async function carregarReservasDoEspaco() {
      if (!espacoSelecionado?.id) {
        setApprovedDays([]); setPendingDays([]); setBlockedDays([]);
        return;
      }
      try {
        const [reservasRealistas, bloqueios] = await Promise.all([
          listarReservasDoEspaco(espacoSelecionado.id),
          listarBloqueiosEspaco(espacoSelecionado.id)
        ]);
        setReservasCompletas(reservasRealistas || []);

        const aprovados: number[] = [];
        const pendentes: number[] = [];
        const turnosPorDia = new Map<number, Set<string>>();
        const filtroAno = String(anoAtual);
        const filtroMes = String(mesAtual + 1).padStart(2, '0');

        (reservasRealistas || []).forEach(reserva => {
          const [ano, mes, diaTexto] = reserva.data_evento.split('-');

          if (
            ano !== filtroAno ||
            mes !== filtroMes ||
            !['pendente', 'aprovada'].includes(reserva.status)
          ) {
            return;
          }

          const dia = Number(diaTexto);

          if (reserva.status === 'aprovada') aprovados.push(dia);
          if (reserva.status === 'pendente') pendentes.push(dia);

          if (!turnosPorDia.has(dia)) {
            turnosPorDia.set(dia, new Set());
          }

          turnosPorDia.get(dia)?.add(reserva.periodo);
        });

        const bloqueados = [...turnosPorDia.entries()]
          .filter(([, turnos]) => turnos.has('Manhã') && turnos.has('Tarde'))
          .map(([dia]) => dia);

        setApprovedDays(aprovados);
        setPendingDays(pendentes);
        setBlockedDays(bloqueados);
        setClosedDays((bloqueios || [])
          .filter(bloqueio => bloqueio.data_bloqueio?.startsWith(`${filtroAno}-${filtroMes}`))
          .map(bloqueio => Number(bloqueio.data_bloqueio.split('-')[2])));
      } catch (err) {
        console.error("Erro ao sincronizar reservas:", err);
      }
    }
    carregarReservasDoEspaco();
  }, [espacoSelecionado, dataFoco]);

  const handleDayPress = async (dia: number) => {
    if (!espacoSelecionado) return;

    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mesAtual + 1).padStart(2, '0');
    const dataNoFormatoBanco = `${anoAtual}-${mesFormatado}-${diaFormatado}`;

    if (podeGerenciarBloqueios && modoBloqueio) {
      if (!token) {
        Alert.alert('Sessão inválida', 'Entre novamente para gerenciar os bloqueios.');
        return;
      }
      const estaBloqueada = closedDays.includes(dia);
      try {
        if (estaBloqueada) {
          await desbloquearDataEspaco(espacoSelecionado.id, dataNoFormatoBanco, token);
          setClosedDays(atuais => atuais.filter(item => item !== dia));
          Alert.alert('Data desbloqueada', 'A data está disponível novamente.');
        } else {
          await bloquearDataEspaco(espacoSelecionado.id, dataNoFormatoBanco, 'Bloqueio administrativo', token);
          setClosedDays(atuais => [...new Set([...atuais, dia])]);
          Alert.alert('Data bloqueada', 'A data foi bloqueada para reservas.');
        }
      } catch (error: any) {
        console.error('Erro ao atualizar bloqueio do espaço:', error);
        const mensagem = error.message || error.details || '';
        Alert.alert(
          'Erro',
          mensagem.includes('DATA_POSSUI_RESERVA')
            ? 'Esta data possui uma reserva pendente ou aprovada e não pode ser bloqueada.'
            : mensagem.includes('SEM_PERMISSAO')
              ? 'Seu perfil não possui permissão para bloquear esta data.'
              : `Não foi possível atualizar o bloqueio desta data.${__DEV__ && mensagem ? `\n${mensagem}` : ''}`
        );
      }
      return;
    }

    if (closedDays.includes(dia)) {
      Alert.alert('Data indisponível', 'Este espaço foi bloqueado para reservas nesta data.');
      return;
    }

    if (blockedDays.includes(dia)) {
      Alert.alert('Indisponível', 'Este espaço está indisponível para reservas nesta data.');
      return;
    }

    const turnosOcupados = reservasCompletas
      .filter(reserva => (
        reserva.data_evento === dataNoFormatoBanco
        && (reserva.status === 'pendente' || reserva.status === 'aprovada')
      ))
      .map(reserva => reserva.periodo);

    if (turnosOcupados.includes('Manhã') && turnosOcupados.includes('Tarde')) {
      Alert.alert('Indisponível', 'Os turnos da manhã e da tarde já estão reservados nesta data.');
      return;
    }
    
    setDataSelecionada(`${diaFormatado}/${mesFormatado}/${anoAtual}`);
    setTurnoSelecionado(turnosOcupados.includes('Manhã') ? 'tarde' : 'manha');
    setModalVisible(true);
  };

  const handleEnviarReserva = async () => {
    if (!espacoSelecionado) {
      Alert.alert('Atenção', 'Selecione um espaço primeiro.');
      return;
    }
    if (turnoSelecionadoOcupado) {
      Alert.alert('Turno indisponível', 'Escolha um turno que ainda esteja disponível.');
      return;
    }
    if (!nomeEvento.trim()) {
      Alert.alert('Atenção', 'Informe o nome do evento.');
      return;
    }

    try {
      setEnviando(true);
      Keyboard.dismiss();
      const [dia, mes, ano] = dataSelecionada.split('/');
      const dataEvento = `${ano}-${mes}-${dia}`;
      const periodo = turnoSelecionado === 'manha' ? 'Manhã' : 'Tarde';
      
      const statusInicial = await criarReserva({
        espaco_id: espacoSelecionado.id,
        usuario_id: token, 
        data_evento: dataEvento,
        periodo,
        nome_evento: nomeEvento.trim(),
        observacoes: observacoes.trim(),
      });

      Alert.alert(
        'Sucesso!',
        statusInicial === 'aprovada'
          ? 'Reserva aprovada automaticamente conforme a regra do espaço.'
          : 'Reserva enviada para análise da administração.'
      );
      setModalVisible(false);
      setNomeEvento(''); setObservacoes('');
      if (statusInicial === 'aprovada') setApprovedDays(prev => [...prev, parseInt(dia, 10)]);
      else setPendingDays(prev => [...prev, parseInt(dia, 10)]);
      setReservasCompletas(prev => [...prev, { data_evento: dataEvento, periodo, status: statusInicial }]);
    } catch (error: any) {
      if (error.message === 'RESERVA_JA_EXISTE') {
        Alert.alert('Turno indisponível', 'Já existe uma reserva para este espaço, data e turno.');
        return;
      }
      if (error.message === 'DATA_BLOQUEADA' || error.message?.includes('DATA_BLOQUEADA')) {
        Alert.alert('Data indisponível', 'Este espaço foi bloqueado para reservas nesta data.');
        return;
      }
      Alert.alert('Erro', 'Não foi possível registrar reserva.');
    } finally {
      setEnviando(false);
    }
  };

  const handleDecisaoReserva = async (status: 'aprovada' | 'recusada') => {
    if (!reservaSelecionadaDetalhe?.id) return;
    try {
      setEnviando(true);
      await atualizarStatusReserva(reservaSelecionadaDetalhe.id, status);
      setModalDetalhesVisible(false);
      setDataFoco(prev => new Date(prev));
      Alert.alert('Reserva atualizada', `A reserva foi ${status}.`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status da reserva.');
    } finally {
      setEnviando(false);
    }
  };

  
  const handleCadastrarNovoEspaco = async () => {
    if (!podeCriarEspaco || !token || !condominioAtivo?.id) {
      Alert.alert('Acesso negado', 'Somente a administradora pode cadastrar espaços comuns.');
      return;
    }
    if (!novoEspacoNome.trim()) {
      Alert.alert('Atenção', 'O nome do espaço é obrigatório.');
      return;
    }

    try {
      setEnviando(true);
      const data = await criarEspaco({
        condominio_id: condominioAtivo.id,
        nome: novoEspacoNome.trim(),
        responsavel: condominioAtivo?.papel || null,
        capacidade: novoEspacoCapacidade.trim() || null,
        valor: parseFloat(novoEspacoValor) || 0,
        antecedencia: null,
        modo_aprovacao: novoEspacoModoAprovacao,
        ativo: true
      }, token);

      const espacoCriado = data as EspacoProps;
      setEspacos(prev => [...prev, espacoCriado]);
      setEspacoSelecionado(espacoCriado);
      setModalNovoEspacoVisible(false);
      
      
      setNovoEspacoNome(''); setNovoEspacoCapacidade(''); setNovoEspacoValor(''); setNovoEspacoModoAprovacao('manual');
      Alert.alert('Sucesso', 'O espaço foi criado e já está disponível para os moradores!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível criar o espaço no banco de dados.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={COLORS.greenMain} /></View>;
  }

  const dataSelecionadaBanco = dataSelecionada
    ? dataSelecionada.split('/').reverse().join('-')
    : '';
  const turnoManhaOcupado = reservasCompletas.some(reserva => (
    reserva.data_evento === dataSelecionadaBanco
    && reserva.periodo === 'Manhã'
    && (reserva.status === 'pendente' || reserva.status === 'aprovada')
  ));
  const turnoTardeOcupado = reservasCompletas.some(reserva => (
    reserva.data_evento === dataSelecionadaBanco
    && reserva.periodo === 'Tarde'
    && (reserva.status === 'pendente' || reserva.status === 'aprovada')
  ));
  const turnoSelecionadoOcupado =
    (turnoSelecionado === 'manha' && turnoManhaOcupado) ||
    (turnoSelecionado === 'tarde' && turnoTardeOcupado);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageSub}>Escolha o espaço e toque em uma data para reservar</Text>

        <View style={styles.espacosWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.espacosRow}>
            {espacos.map((espaco, idx) => (
              <TouchableOpacity
                key={`${espaco.nome}-${idx}`}
                style={[styles.espacoBtn, espacoSelecionado?.id === espaco.id && styles.espacoBtnActive]}
                onPress={() => setEspacoSelecionado(espaco)}
                activeOpacity={0.8}
              >
                <Text style={[styles.espacoBtnText, espacoSelecionado?.id === espaco.id && styles.espacoBtnTextActive]}>
                  {espaco.nome}
                </Text>
              </TouchableOpacity>
            ))}

            
            {podeCriarEspaco && (
              <TouchableOpacity 
                style={[styles.espacoBtn, { borderStyle: 'dashed', borderColor: COLORS.greenMain, backgroundColor: 'transparent' }]} 
                onPress={() => setModalNovoEspacoVisible(true)}
              >
                <Text style={[styles.espacoBtnText, { color: COLORS.greenMain }]}>+ Novo Espaço</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {espacos.length === 0 ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Feather name="box" size={40} color={COLORS.grayBorder} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>
              {podeCriarEspaco
                ? "Nenhum espaço cadastrado. Toque em '+ Novo Espaço' para adicionar o primeiro." 
                : "Este condomínio ainda não possui espaços disponíveis para reserva."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <LinearGradient colors={(espacoSelecionado?.bannerColors || ['#00A859', '#00803f']) as [string, string, ...string[]]} style={styles.bannerArea}>
                <Feather name={(espacoSelecionado?.icone || 'home') as any} size={56} color="rgba(255,255,255,0.6)" />
              </LinearGradient>

              <View style={styles.panelBodyInfo}>
                <View style={styles.sectionTab}><Text style={styles.sectionTabText}>Informações do espaço</Text></View>
                <View style={styles.infoGridRow}>
                  <Info icon="user" label="Responsável" value={espacoSelecionado?.responsavel || 'Síndico'} />
                  <Info icon="users" label="Capacidade" value={espacoSelecionado?.capacidade || 'Não informada'} />
                </View>
                <View style={[styles.infoGridRow, { marginTop: 14 }]}>
                  <Info icon="dollar-sign" label="Valor" value={formatarMoeda(espacoSelecionado?.valor || 0)} />
                  <Info icon="calendar" label="Antecedência" value={espacoSelecionado?.antecedencia || 'Nenhuma'} />
                </View>
              </View>
            </View>

            <View style={styles.panel}>
              {podeGerenciarBloqueios && (
                <View style={styles.blockModeBar}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.blockModeTitle}>Bloqueio de datas</Text>
                    <Text style={styles.blockModeText}>
                      {modoBloqueio ? 'Toque em uma data para bloquear ou desbloquear.' : 'Ative para gerenciar datas indisponíveis.'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.blockModeButton, modoBloqueio && styles.blockModeButtonActive]}
                    onPress={() => setModoBloqueio(ativo => !ativo)}
                  >
                    <Feather name={modoBloqueio ? 'x' : 'lock'} size={13} color={modoBloqueio ? COLORS.white : COLORS.greenMain} />
                    <Text style={[styles.blockModeButtonText, modoBloqueio && { color: COLORS.white }]}>
                      {modoBloqueio ? 'Concluir' : 'Gerenciar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={handlePrevMonth}><Text style={styles.calArrow}>‹</Text></TouchableOpacity>
                <Text style={styles.calMonthText}>{nomeMeses[mesAtual]} de {anoAtual}</Text>
                <TouchableOpacity onPress={handleNextMonth}><Text style={styles.calArrow}>›</Text></TouchableOpacity>
              </View>

              <View style={styles.calGrid}>
                {diasSemana.map((d, i) => (
                  <View key={`week-${i}`} style={styles.calDayHeader}><Text style={styles.calDayHeaderText}>{d}</Text></View>
                ))}
                {emptyDays.map(i => <View key={`empty-${i}`} style={[styles.calDay, styles.calDayEmpty]} />)}
                {monthDays.map(dia => {
                  const isApproved = approvedDays.includes(dia);
                  const isPending = pendingDays.includes(dia);
                  const isBlocked = blockedDays.includes(dia) || closedDays.includes(dia);
                  const isFree = !isApproved && !isPending && !isBlocked;

                  return (
                    <TouchableOpacity
                      key={`day-${dia}`}
                      style={[
                        styles.calDay, 
                        isApproved && styles.dayApproved, 
                        isPending && styles.dayPending, 
                        isBlocked && styles.dayBlocked, 
                        isFree && styles.dayFree
                      ]}
                      activeOpacity={0.6}
                      onPress={() => handleDayPress(dia)}
                    >
                      <Text style={[styles.calDayText, isApproved && styles.dayApprovedText, isPending && styles.dayPendingText, isBlocked && styles.dayBlockedText]}>
                        {dia}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Legend approved="Reserva aprovada" pending="Reserva pendente" blocked="Espaço fechado / indisponível" />
            </View>
          </>
        )}

        {isSindico && (
          <View style={styles.panel}>
            <View style={styles.panelHead}><Text style={styles.panelTitle}>Solicitações pendentes</Text></View>
            {reservasCompletas.filter(reserva => reserva.status === 'pendente').length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma solicitação pendente.</Text>
            ) : reservasCompletas.filter(reserva => reserva.status === 'pendente').map(reserva => (
              <TouchableOpacity key={reserva.id} style={styles.historyRow} onPress={() => { setReservaSelecionadaDetalhe(reserva); setModalDetalhesVisible(true); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailValue}>{reserva.usuario?.nome || 'Morador'} · {reserva.nome_evento || 'Evento'}</Text>
                  <Text style={styles.detailLabel}>{reserva.data_evento?.split('-').reverse().join('/')} · {reserva.periodo}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      
      <Modal visible={modalNovoEspacoVisible && podeCriarEspaco} transparent animationType="fade" onRequestClose={() => setModalNovoEspacoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalNovoEspacoVisible(false)} disabled={enviando}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Cadastrar Novo Espaço</Text>
            
            <Input label="Nome do espaço" placeholder="Ex: Salão de Festas, Jacuzzi" value={novoEspacoNome} onChangeText={setNovoEspacoNome} editable={!enviando} />
            <Input label="Capacidade" placeholder="Ex: 40 pessoas" value={novoEspacoCapacidade} onChangeText={setNovoEspacoCapacidade} editable={!enviando} />
            <Input label="Valor da Reserva (R$)" placeholder="Ex: 150.00 (Deixe 0 se for grátis)" value={novoEspacoValor} onChangeText={setNovoEspacoValor} keyboardType="numeric" editable={!enviando} />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Regra de aprovação</Text>
              {[
                { value: 'automatica', label: 'Aprovação automática' },
                { value: 'manual', label: 'Aprovação manual' },
                { value: 'por_inadimplencia', label: 'Automática para unidade adimplente' }
              ].map(opcao => (
                <TouchableOpacity
                  key={opcao.value}
                  style={styles.checkRow}
                  onPress={() => setNovoEspacoModoAprovacao(opcao.value as typeof novoEspacoModoAprovacao)}
                >
                  <View style={[styles.checkbox, novoEspacoModoAprovacao === opcao.value && styles.checkboxActive]}>
                    {novoEspacoModoAprovacao === opcao.value && <Feather name="check" size={12} color={COLORS.white} />}
                  </View>
                  <Text style={styles.checkText}>{opcao.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ marginTop: 10 }}>
              <Button title={enviando ? "Salvando..." : "Salvar Espaço"} icon="plus" onPress={handleCadastrarNovoEspaco} disabled={enviando} />
            </View>
          </View>
        </View>
      </Modal>

      
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} disabled={enviando}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Reserva de espaço</Text>
            <Text style={styles.espacoSelecionadoText}>
              <Text style={{ fontFamily: 'Montserrat_700Bold' }}>Espaço:</Text> {espacoSelecionado?.nome}
            </Text>

            <Input label="Nome do evento" placeholder="Ex: Aniversário" value={nomeEvento} onChangeText={setNomeEvento} editable={!enviando} />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dia do evento</Text>
              <View style={styles.fakeInput}>
                <Text style={styles.fakeInputText}>{dataSelecionada}</Text>
                <Feather name="calendar" size={16} color={COLORS.greenMain} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Horário</Text>
              <TurnoOption label="Manhã - 08:00 às 15:00" value="manha" selected={turnoSelecionado} onSelect={setTurnoSelecionado} disabled={turnoManhaOcupado} />
              <TurnoOption label="Tarde - 16:00 às 22:00" value="tarde" selected={turnoSelecionado} onSelect={setTurnoSelecionado} disabled={turnoTardeOcupado} />
            </View>

            <Input label="Observações" placeholder="Detalhes importantes" multiline numberOfLines={3} value={observacoes} onChangeText={setObservacoes} editable={!enviando} style={{ minHeight: 70 }} textAlignVertical="top" />
            
            <Button title={enviando ? "Processando..." : "Enviar solicitação"} icon="send" onPress={handleEnviarReserva} disabled={enviando || turnoSelecionadoOcupado} />
          </View>
        </View>
      </Modal>

      
      <Modal visible={modalDetalhesVisible} transparent animationType="fade" onRequestClose={() => setModalDetalhesVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalDetalhesVisible(false)}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Detalhes da Reserva</Text>
            <Text style={styles.espacoSelecionadoText}>
              <Text style={{ fontFamily: 'Montserrat_700Bold' }}>Espaço:</Text> {espacoSelecionado?.nome}
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Morador:</Text>
              <Text style={styles.detailValue}>{reservaSelecionadaDetalhe?.usuario?.nome || 'Não informado'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Evento:</Text>
              <Text style={styles.detailValue}>{reservaSelecionadaDetalhe?.nome_evento || 'Não informado'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>{reservaSelecionadaDetalhe?.data_evento ? reservaSelecionadaDetalhe.data_evento.split('-').reverse().join('/') : ''}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Horário:</Text>
              <Text style={styles.detailValue}>{reservaSelecionadaDetalhe?.periodo || 'Não informado'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status da reserva:</Text>
              <View style={[styles.detailStatusBadge, reservaSelecionadaDetalhe?.status === 'aprovada' && { backgroundColor: '#e8f5e9' }, reservaSelecionadaDetalhe?.status === 'pendente' && { backgroundColor: '#fff3e0' }]}>
                <Text style={[styles.detailStatusText, reservaSelecionadaDetalhe?.status === 'aprovada' && { color: '#2e7d32' }, reservaSelecionadaDetalhe?.status === 'pendente' && { color: '#e65100' }]}>
                  {reservaSelecionadaDetalhe?.status === 'aprovada' ? 'Aprovada' : 'Pendente de análise'}
                </Text>
              </View>
            </View>

            {reservaSelecionadaDetalhe?.observacoes && (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Observações:</Text>
                <Text style={styles.detailValueText}>{reservaSelecionadaDetalhe.observacoes}</Text>
              </View>
            )}

            {isSindico && reservaSelecionadaDetalhe?.status === 'pendente' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
                <View style={{ flex: 1 }}>
                  <Button title={enviando ? 'Salvando...' : 'Aprovar'} icon="check" onPress={() => handleDecisaoReserva('aprovada')} disabled={enviando} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Recusar" icon="x" onPress={() => handleDecisaoReserva('recusada')} disabled={enviando} />
                </View>
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              <Button title="Fechar detalhes" onPress={() => setModalDetalhesVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

function Info({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoGridCol}>
      <View style={styles.infoKey}><Feather name={icon} size={13} color={COLORS.greenMain} /><Text style={styles.infoKeyText}>{label}</Text></View>
      <Text style={styles.infoVal}>{value}</Text>
    </View>
  );
}

function Legend({ approved, pending, blocked }: { approved: string; pending: string; blocked: string }) {
  return (
    <View style={styles.calLegend}>
      <LegendItem color="#c8e6c9" text={approved} />
      <LegendItem color="#ffe0b2" text={pending} />
      <LegendItem color="#f0f0f0" text={blocked} />
    </View>
  );
}

function LegendItem({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.calLegendItem}>
      <View style={[styles.calLegendBox, { backgroundColor: color }]} />
      <Text style={styles.calLegendText}>{text}</Text>
    </View>
  );
}

function TurnoOption({ label, value, selected, onSelect, disabled = false }: { label: string; value: string; selected: string; onSelect: (value: string) => void; disabled?: boolean }) {
  const active = selected === value;
  return (
    <TouchableOpacity style={[styles.checkRow, disabled && { opacity: 0.45 }]} onPress={() => onSelect(value)} activeOpacity={0.8} disabled={disabled}>
      <View style={[styles.checkbox, active && styles.checkboxActive]}>
        {active && <Feather name="check" size={12} color={COLORS.white} />}
      </View>
      <Text style={styles.checkText}>{disabled ? `${label} (indisponível)` : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 14, paddingBottom: 40 },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  espacosWrapper: { marginBottom: 18, marginHorizontal: -14 },
  espacosRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  espacoBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.grayBorder, backgroundColor: COLORS.white },
  espacoBtnActive: { backgroundColor: COLORS.greenMain, borderColor: COLORS.greenMain },
  espacoBtnText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: COLORS.textMid },
  espacoBtnTextActive: { color: COLORS.white },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden', marginBottom: 14 },
  panelHead: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  bannerArea: { height: 150, alignItems: 'center', justifyContent: 'center' },
  panelBodyInfo: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 14 },
  calHeader: { backgroundColor: COLORS.greenMain, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockModeBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder, backgroundColor: COLORS.white },
  blockModeTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: COLORS.textDark },
  blockModeText: { fontFamily: 'Montserrat_400Regular', fontSize: 10.5, lineHeight: 15, color: COLORS.textMuted, marginTop: 2 },
  blockModeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: COLORS.greenMain, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  blockModeButtonActive: { backgroundColor: COLORS.greenMain },
  blockModeButtonText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.greenMain },
  calMonthText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  calArrow: { color: COLORS.white, fontSize: 24, lineHeight: 24, fontWeight: '700', paddingHorizontal: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 0.5, borderLeftWidth: 0.5, borderColor: COLORS.grayBorder },
  calDayHeader: { width: '14.28%', alignItems: 'center', paddingVertical: 7, backgroundColor: '#f9f9f9', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.grayBorder },
  calDayHeaderText: { fontFamily: 'Montserrat_700Bold', fontSize: 10, color: COLORS.greenMain },
  calDay: { width: '14.28%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.grayBorder },
  calDayEmpty: { backgroundColor: '#f0f0f0' },
  dayFree: { backgroundColor: COLORS.white },
  dayApproved: { backgroundColor: '#c8e6c9' },
  dayPending: { backgroundColor: '#ffe0b2' },
  dayBlocked: { backgroundColor: '#f0f0f0' },
  calDayText: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: COLORS.textMid },
  dayApprovedText: { color: '#1b5e20', fontFamily: 'Montserrat_700Bold' },
  dayPendingText: { color: '#e65100', fontFamily: 'Montserrat_700Bold' },
  dayBlockedText: { color: '#bbb' },
  calLegend: { paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calLegendBox: { width: 14, height: 14, borderRadius: 3 },
  calLegendText: { fontFamily: 'Montserrat_400Regular', fontSize: 11.5, color: COLORS.textMuted },
  sectionTab: { borderLeftWidth: 3, borderLeftColor: COLORS.greenMain, paddingLeft: 10, marginVertical: 4, marginBottom: 12 },
  sectionTabText: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  infoGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoGridCol: { width: '48%' },
  infoKey: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  infoKeyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textMuted },
  infoVal: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: COLORS.textDark },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 14, paddingHorizontal: 18, paddingVertical: 22, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 14, right: 16, zIndex: 50 },
  modalCloseBtnText: { color: COLORS.greenMain, fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: COLORS.textDark, marginBottom: 18, paddingRight: 24 },
  espacoSelecionadoText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textDark, marginBottom: 16 },
  formGroup: { marginBottom: 14, gap: 5 },
  formLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.textMid },
  fakeInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: COLORS.white },
  fakeInputText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: COLORS.textDark },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  checkbox: { width: 16, height: 16, borderWidth: 1.5, borderColor: COLORS.grayBorder, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkboxActive: { backgroundColor: COLORS.greenMain, borderColor: COLORS.greenMain },
  checkText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  detailRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayBg },
  detailLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 11, color: COLORS.textMuted, marginBottom: 3 },
  detailValue: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: COLORS.textDark },
  detailValueText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: COLORS.textDark, lineHeight: 18, marginTop: 4 },
  detailStatusBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginTop: 3 },
  detailStatusText: { fontFamily: 'Montserrat_700Bold', fontSize: 11 }
});
