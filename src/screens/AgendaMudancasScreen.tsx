
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Keyboard, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { atualizarStatusMudanca, buscarMudancas, criarMudanca, listarMudancas, salvarRegrasMudanca } from '../services/api';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CustomSelect } from '../components/CustomSelect';
import { useFocusEffect } from '@react-navigation/native';
import { normalizarPapel } from '../config/modules';

export function AgendaMudancasScreen() {
  const { condominioAtivo, token } = useAuth();
  
  
  const isZelador = condominioAtivo?.papel === 'Zelador';
  const papelAtual = normalizarPapel(condominioAtivo?.papel || '');
  const podeConfigurarRegras = papelAtual === 'Síndico' || papelAtual === 'Administradora';

  const [regras, setRegras] = useState<any>(null);
  const [modalRegrasVisible, setModalRegrasVisible] = useState(false);
  const [regraForm, setRegraForm] = useState({ responsavel: '', antecedencia: '', acesso: '', manhaInicio: '', manhaFim: '', tardeInicio: '', tardeFim: '' });
  
  const [approvedDays, setApprovedDays] = useState<string[]>([]);
  const [pendingDays, setPendingDays] = useState<string[]>([]);
  const [blockedDays] = useState<number[]>([]);
  const [turnosOcupados, setTurnosOcupados] = useState<Record<string, string[]>>({});
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  
  const [modalVisible, setModalVisible] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [turnoSelecionado, setTurnoSelecionado] = useState('manha');
  const [tipoSelecionado, setTipoSelecionado] = useState('Entrada de mudança');
  const [tipoAberto, setTipoAberto] = useState(false);

  
  const [empresa, setEmpresa] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  
  const [dataAtual, setDataAtual] = useState(new Date());

  const tiposOpcoes = ['Entrada de mudança', 'Saída de mudança'];
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const horaCurta = (valor?: string | null) => valor ? valor.slice(0, 5) : '--:--';

  const abrirConfiguracaoRegras = () => {
    setRegraForm({
      responsavel: regras?.responsavel || '',
      antecedencia: regras?.antecedencia?.split(' ')[0] || '',
      acesso: regras?.acesso || '',
      manhaInicio: regras?.manhaInicio ? horaCurta(regras.manhaInicio) : '',
      manhaFim: regras?.manhaFim ? horaCurta(regras.manhaFim) : '',
      tardeInicio: regras?.tardeInicio ? horaCurta(regras.tardeInicio) : '',
      tardeFim: regras?.tardeFim ? horaCurta(regras.tardeFim) : ''
    });
    setModalRegrasVisible(true);
  };

  const handleSalvarRegras = async () => {
    if (!condominioAtivo?.id || Object.values(regraForm).some(valor => !valor.trim())) {
      Alert.alert('Atenção', 'Preencha todos os campos da regra.');
      return;
    }
    const normalizarHorario = (valor: string) => {
      const correspondencia = valor.trim().toLowerCase().match(/^(\d{1,2})(?:(?::|h)(\d{0,2}))?$/);
      if (!correspondencia) return null;
      const hora = Number(correspondencia[1]);
      const minuto = Number(correspondencia[2] || 0);
      if (hora > 23 || minuto > 59) return null;
      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    };
    const turnoManha = { inicio: normalizarHorario(regraForm.manhaInicio), fim: normalizarHorario(regraForm.manhaFim) };
    const turnoTarde = { inicio: normalizarHorario(regraForm.tardeInicio), fim: normalizarHorario(regraForm.tardeFim) };
    const antecedenciaHoras = Number(regraForm.antecedencia);
    if (!turnoManha.inicio || !turnoManha.fim || !turnoTarde.inicio || !turnoTarde.fim) {
      Alert.alert('Horário inválido', 'Preencha os quatro horários no formato HH:MM.');
      return;
    }
    if (turnoManha.inicio >= turnoManha.fim || turnoTarde.inicio >= turnoTarde.fim) {
      Alert.alert('Horário inválido', 'O horário final de cada turno deve ser posterior ao horário inicial.');
      return;
    }
    if (!Number.isFinite(antecedenciaHoras) || antecedenciaHoras < 0) {
      Alert.alert('Antecedência inválida', 'Informe a antecedência em horas usando somente números.');
      return;
    }
    try {
      setEnviando(true);
      await salvarRegrasMudanca(condominioAtivo.id, {
        responsavel: regraForm.responsavel.trim(),
        horario_geral: `${turnoManha.inicio} às ${turnoTarde.fim}`,
        antecedencia_horas: antecedenciaHoras,
        acesso: regraForm.acesso.trim(),
        manha_inicio: turnoManha.inicio,
        manha_fim: turnoManha.fim,
        tarde_inicio: turnoTarde.inicio,
        tarde_fim: turnoTarde.fim
      });
      setModalRegrasVisible(false);
      await carregarDadosMudanca();
      Alert.alert('Sucesso', 'As regras de mudança foram atualizadas.');
    } catch (error: any) {
      console.error('Erro ao salvar regras de mudança:', error);
      const detalhe = error?.message || error?.details || '';
      Alert.alert(
        'Erro ao salvar',
        detalhe.includes('regras_mudanca') && detalhe.includes('schema cache')
          ? 'A tabela de regras ainda não existe no Supabase. Execute a migração indicada.'
          : `Não foi possível salvar as regras.${__DEV__ && detalhe ? `\n${detalhe}` : ''}`
      );
    } finally {
      setEnviando(false);
    }
  };

  async function carregarDadosMudanca() {
    if (!condominioAtivo?.id) return;

    setCarregando(true);
    try {
      const dadosApi = await buscarMudancas(condominioAtivo.id);
      setRegras(dadosApi.regras);

      const mudancasReais = await listarMudancas(condominioAtivo.id);

      const aprovadas: string[] = [];
      const pendentes: string[] = [];
      const listaHistorico: any[] = [];
      const ocupados: Record<string, string[]> = {};

      (mudancasReais || []).forEach(m => {
        const statusLower = m.status?.toLowerCase();
        const dataApenasYMD = m.data_mudanca ? m.data_mudanca.substring(0, 10) : '';

        if (dataApenasYMD) {
          if (statusLower === 'aprovada' || statusLower === 'aprovado') {
            aprovadas.push(dataApenasYMD);
          } else if (statusLower === 'pendente') {
            pendentes.push(dataApenasYMD);
          }

          if (['pendente', 'aprovada', 'aprovado'].includes(statusLower)) {
            ocupados[dataApenasYMD] = [...(ocupados[dataApenasYMD] || []), m.periodo];
          }
        }

        
        if (dataApenasYMD) {
          const [ano, mes, dia] = dataApenasYMD.split('-');
          const itemHistorico = {
            id: m.id, 
            unidade: m.unidade || 'N/A', 
            data: `${dia}/${mes}/${ano}`,
            tipo: m.tipo,
            complemento: m.empresa || '',
            periodo: m.periodo,
            status: m.status
          };

          if (isZelador) {
            listaHistorico.push(itemHistorico);
          } else if (m.usuario_id === token) {
            listaHistorico.push(itemHistorico);
          }
        }
      });

      setApprovedDays(aprovadas);
      setPendingDays(pendentes);
      setHistorico(listaHistorico);
      setTurnosOcupados(ocupados);

    } catch (error) {
      console.error('Erro ao carregar agenda de mudanças:', error);
      Alert.alert('Erro ao carregar', 'Não foi possível buscar a agenda de mudanças agora.');
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarDadosMudanca();
      // Os valores abaixo são as entradas que determinam a recarga desta tela.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [condominioAtivo?.id, condominioAtivo?.papel, token])
  );

  
  const handleDecisaoZelador = async (id: string, novaDecisao: string) => {
    try {
      setCarregando(true);
      await atualizarStatusMudanca(id, novaDecisao);
      Alert.alert('Sucesso', `A solicitação foi marcada como ${novaDecisao}!`);
      await carregarDadosMudanca();
    } catch (error) {
      console.error('Erro ao atualizar a solicitação de mudança:', error);
      Alert.alert('Erro', 'Não foi possível salvar a decisão.');
    } finally {
      setCarregando(false);
    }
  };

  const anoStr = dataAtual.getFullYear();
  const mesIdx = dataAtual.getMonth();
  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const tituloMes = `${nomesMeses[mesIdx]} de ${anoStr}`;

  const diasNoMes = new Date(anoStr, mesIdx + 1, 0).getDate();
  const primeiroDiaDaSemana = new Date(anoStr, mesIdx, 1).getDay();

  const emptyDays = Array.from({ length: primeiroDiaDaSemana }, (_, i) => i);
  const monthDays = Array.from({ length: diasNoMes }, (_, i) => i + 1);

  const irMesAnterior = () => setDataAtual(new Date(anoStr, mesIdx - 1, 1));
  const irProximoMes = () => setDataAtual(new Date(anoStr, mesIdx + 1, 1));

  const handleDayPress = (dia: number) => {
    
    if (isZelador) {
      Alert.alert('Modo Gestão', 'Utilize a lista abaixo para aprovar ou recusar as solicitações.');
      return;
    }

    if (!regras) {
      Alert.alert('Configuração pendente', 'As regras de mudança deste condomínio ainda não foram cadastradas.');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEscolhida = new Date(anoStr, mesIdx, dia);
    
    if (dataEscolhida < hoje) {
      Alert.alert('Data inválida', 'Não é possível agendar mudanças para datas que já passaram.');
      return;
    }

    const diaFormatado = String(dia).padStart(2, '0');
    const mesFormatado = String(mesIdx + 1).padStart(2, '0');
    const dataDia = `${anoStr}-${mesFormatado}-${diaFormatado}`;

    const ocupados = turnosOcupados[dataDia] || [];
    const manhaOcupada = ocupados.includes('Manhã');
    const tardeOcupada = ocupados.includes('Tarde');
    if (blockedDays.includes(dia) || (manhaOcupada && tardeOcupada)) {
      Alert.alert('Dia indisponível', 'Os turnos da manhã e da tarde já estão ocupados nesta data.');
      return;
    }
    
    setDataSelecionada(`${diaFormatado}/${mesFormatado}/${anoStr}`);
    setTipoAberto(false);
    setEmpresa('');
    setTurnoSelecionado(manhaOcupada ? 'tarde' : 'manha');
    setModalVisible(true);
  };

  const enviarMudanca = async () => {
    setErroEnvio('');
    if (!token) {
      setErroEnvio('Sua sessão expirou. Refaça o login.');
      Alert.alert('Erro', 'Sua sessão expirou. Refaça o login.');
      return;
    }

    if (!condominioAtivo?.id) {
      setErroEnvio('Condomínio ativo não identificado.');
      Alert.alert('Erro', 'Condomínio ativo não identificado.');
      return;
    }

    try {
      setEnviando(true);
      Keyboard.dismiss();

      const [dia, mes, ano] = dataSelecionada.split('/');
      const dataFormatadaBanco = `${ano}-${mes}-${dia}`;
      const periodoFormatado = turnoSelecionado === 'manha' ? 'Manhã' : 'Tarde';
      const inicioTurno = turnoSelecionado === 'manha' ? regras?.manhaInicio : regras?.tardeInicio;
      if (!inicioTurno) {
        setErroEnvio('O horário deste turno ainda não foi configurado.');
        Alert.alert('Configuração pendente', 'O horário deste turno ainda não foi configurado.');
        return;
      }
      const [hora, minuto] = inicioTurno.split(':').map(Number);
      const dataHoraMudanca = new Date(Number(ano), Number(mes) - 1, Number(dia), hora, minuto);
      const antecedenciaMs = Number(regras?.antecedencia?.split(' ')[0] || 0) * 60 * 60 * 1000;
      if (dataHoraMudanca.getTime() < Date.now() + antecedenciaMs) {
        setErroEnvio(`Escolha uma data que respeite a antecedência mínima de ${regras?.antecedencia}.`);
        Alert.alert('Antecedência insuficiente', `Esta solicitação exige antecedência mínima de ${regras?.antecedencia}.`);
        return;
      }

      await criarMudanca({
            condominio_id: condominioAtivo.id,
            usuario_id: token,
            unidade: condominioAtivo.unidade || null, 
            data_mudanca: dataFormatadaBanco, 
            periodo: periodoFormatado,
            tipo: tipoSelecionado,
            empresa: empresa.trim(),           
            status: 'pendente' 
          });

      Alert.alert('Solicitação enviada', 'Sua solicitação de mudança foi enviada para aprovação do zelador.');
      setErroEnvio('');
      setModalVisible(false);
      
      await carregarDadosMudanca();

    } catch (error: any) {
      console.error("Erro ao registrar mudança no banco:", error.message);
      const mensagemErro = error.message === 'TURNO_MUDANCA_INDISPONIVEL'
        ? 'O turno escolhido já possui uma solicitação pendente ou aprovada.'
        : `Não foi possível agendar a mudança.${__DEV__ && error.message ? ` ${error.message}` : ''}`;
      setErroEnvio(mensagemErro);
      Alert.alert(
        'Erro',
        mensagemErro
      );
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.greenMain} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.pageSub}>
          {isZelador ? 'Gestão de agenda de mudanças do condomínio' : 'Toque em uma data disponível no calendário para solicitar o agendamento'}
        </Text>

        <View style={styles.panel}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={irMesAnterior} accessibilityLabel="Mês anterior" style={styles.navHitbox}>
              <Text style={styles.calArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthText}>{tituloMes}</Text>
            <TouchableOpacity onPress={irProximoMes} accessibilityLabel="Próximo mês" style={styles.navHitbox}>
              <Text style={styles.calArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calGrid}>
            {diasSemana.map((d, i) => (
              <View key={`week-${i}`} style={styles.calDayHeader}><Text style={styles.calDayHeaderText}>{d}</Text></View>
            ))}
            
            {emptyDays.map(i => <View key={`empty-${i}`} style={[styles.calDay, styles.calDayEmpty]} />)}
            
            {monthDays.map(dia => {
              const diaFormatado = String(dia).padStart(2, '0');
              const mesFormatado = String(mesIdx + 1).padStart(2, '0');
              const dataDia = `${anoStr}-${mesFormatado}-${diaFormatado}`;

              const isApproved = approvedDays.includes(dataDia);
              const isPending = pendingDays.includes(dataDia);
              const isBlocked = blockedDays.includes(dia);
              const ocupados = turnosOcupados[dataDia] || [];
              const isFull = ocupados.includes('Manhã') && ocupados.includes('Tarde');
              const isFree = !isFull && !isBlocked;
              
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const dataEscolhida = new Date(anoStr, mesIdx, dia);
              const isPast = dataEscolhida < hoje;

              return (
                <TouchableOpacity
                  key={`day-${dia}`}
                  style={[
                    styles.calDay, 
                    isApproved && !isPast && styles.dayApproved, 
                    isPending && !isPast && styles.dayPending, 
                    (isBlocked || isPast || isFull) && styles.dayBlocked,
                    isFree && !isPast && styles.dayFree
                  ]}
                  activeOpacity={(isFree && !isPast && !isZelador) ? 0.6 : 1}
                  onPress={() => handleDayPress(dia)}
                >
                  <Text style={[
                    styles.calDayText, 
                    isApproved && !isPast && styles.dayApprovedText, 
                    isPending && !isPast && styles.dayPendingText, 
                    (isBlocked || isPast || isFull) && styles.dayBlockedText
                  ]}>
                    {dia}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.calLegend}>
            <LegendItem color="#c8e6c9" text="Mudança aprovada" />
            <LegendItem color="#ffe0b2" text="Aguardando aprovação" />
            <LegendItem color="#f0f0f0" text="Indisponível / Passado" />
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <View style={styles.rulesHeaderRow}>
              <View style={styles.sectionTab}><Text style={styles.sectionTabText}>Regras e Orientações</Text></View>
              {podeConfigurarRegras && (
                <TouchableOpacity style={styles.editRulesButton} onPress={abrirConfiguracaoRegras}>
                  <Feather name="edit-2" size={12} color={COLORS.greenMain} />
                  <Text style={styles.editRulesText}>{regras ? 'Editar' : 'Configurar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.panelBodyInfo}>
            <View style={styles.infoGridRow}>
              <Info icon="user" label="Responsável" value={regras?.responsavel || 'Não configurado'} />
              <Info icon="clock" label="Turnos" value={regras ? `Manhã ${horaCurta(regras.manhaInicio)}–${horaCurta(regras.manhaFim)} / Tarde ${horaCurta(regras.tardeInicio)}–${horaCurta(regras.tardeFim)}` : 'Não configurados'} />
            </View>
            <View style={[styles.infoGridRow, { marginTop: 14 }]}>
              <Info icon="calendar" label="Antecedência" value={regras?.antecedencia || 'Não configurada'} />
              <Info icon="truck" label="Acesso" value={regras?.acesso || 'Não configurado'} />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>{isZelador ? 'Solicitações do Condomínio' : 'Minhas solicitações'}</Text>
          </View>
          <View style={styles.panelBodyList}>
            {historico.length > 0 ? (
              historico.map((item, index) => {
                const statusLower = item.status?.toLowerCase();
                const isAprovado = statusLower === 'aprovado' || statusLower === 'aprovada';
                const isPendente = statusLower === 'pendente';
                const isRecusado = statusLower === 'recusado';

                return (
                  <View key={`${item.data}-${index}`} style={[styles.saldoRow, index === historico.length - 1 && { borderBottomWidth: 0 }, isZelador && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Text style={styles.saldoRowText}>
                        {isZelador ? `Ap. ${item.unidade} - ` : ''}{item.data} - {item.periodo} - {item.tipo} {item.complemento ? `- ${item.complemento}` : ''}
                      </Text>
                      <View style={isAprovado ? styles.badgeAprovado : isRecusado ? styles.badgeRecusado : styles.badgePendente}>
                        <Text style={isAprovado ? styles.badgeAprovadoText : isRecusado ? styles.badgeRecusadoText : styles.badgePendenteText}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    
                    {isZelador && isPendente && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.btnApprove} onPress={() => handleDecisaoZelador(item.id, 'Aprovado')}>
                          <Feather name="check" size={13} color="#2e7d32" />
                          <Text style={styles.btnApproveText}>Aprovar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnRefuse} onPress={() => handleDecisaoZelador(item.id, 'Recusado')}>
                          <Feather name="x" size={13} color="#c62828" />
                          <Text style={styles.btnRefuseText}>Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Nenhuma solicitação de mudança agendada.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} disabled={enviando}>
              <Text style={styles.modalCloseBtnText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Solicitação de mudança</Text>

            <View style={[styles.formGroup, { zIndex: 1 }]}>
              <Text style={styles.formLabel}>Dia da mudança</Text>
              <View style={styles.fakeInput}>
                <Text style={styles.fakeInputText}>{dataSelecionada}</Text>
                <Feather name="calendar" size={16} color={COLORS.greenMain} />
              </View>
            </View>

            <View style={{ zIndex: tipoAberto ? 20 : 1 }}>
              <CustomSelect
                label="Tipo"
                value={tipoSelecionado}
                options={tiposOpcoes}
                isOpen={tipoAberto}
                onToggle={() => setTipoAberto(!tipoAberto)}
                onSelect={setTipoSelecionado}
              />
            </View>

            <View style={[styles.formGroup, { zIndex: 1 }]}>
              <Text style={styles.formLabel}>Horário</Text>
              <TurnoOption label={`Manhã - ${horaCurta(regras?.manhaInicio)} às ${horaCurta(regras?.manhaFim)}`} value="manha" selected={turnoSelecionado} onSelect={setTurnoSelecionado} disabled={turnosOcupados[dataSelecionada.split('/').reverse().join('-')]?.includes('Manhã')} />
              <TurnoOption label={`Tarde - ${horaCurta(regras?.tardeInicio)} às ${horaCurta(regras?.tardeFim)}`} value="tarde" selected={turnoSelecionado} onSelect={setTurnoSelecionado} disabled={turnosOcupados[dataSelecionada.split('/').reverse().join('-')]?.includes('Tarde')} />
            </View>

            <Input 
              label="Empresa responsável" 
              placeholder="Transportadora (opcional)" 
              value={empresa}
              onChangeText={setEmpresa}
              editable={!enviando}
            />
            
            <Button 
              title={enviando ? "Processando..." : "Enviar solicitação"} 
              icon="send" 
              onPress={enviarMudanca} 
              disabled={enviando}
            />
            {!!erroEnvio && <Text style={styles.formError}>{erroEnvio}</Text>}
          </View>
        </View>
      </Modal>

      <Modal visible={modalRegrasVisible} transparent animationType="fade" onRequestClose={() => setModalRegrasVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalRegrasVisible(false)} disabled={enviando}>
                <Text style={styles.modalCloseBtnText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Configurar regras de mudança</Text>
              <Input label="Responsável" placeholder="Ex: Zelador" value={regraForm.responsavel} onChangeText={valor => setRegraForm(atual => ({ ...atual, responsavel: valor }))} />
              <Input label="Antecedência mínima (horas)" placeholder="Ex: 48" keyboardType="numeric" value={regraForm.antecedencia} onChangeText={valor => setRegraForm(atual => ({ ...atual, antecedencia: valor }))} />
              <Input label="Acesso" placeholder="Ex: Elevador de serviço" value={regraForm.acesso} onChangeText={valor => setRegraForm(atual => ({ ...atual, acesso: valor }))} />
              <HorarioIntervalo
                label="Horário da manhã"
                inicio={regraForm.manhaInicio}
                fim={regraForm.manhaFim}
                onInicio={valor => setRegraForm(atual => ({ ...atual, manhaInicio: valor }))}
                onFim={valor => setRegraForm(atual => ({ ...atual, manhaFim: valor }))}
              />
              <HorarioIntervalo
                label="Horário da tarde"
                inicio={regraForm.tardeInicio}
                fim={regraForm.tardeFim}
                onInicio={valor => setRegraForm(atual => ({ ...atual, tardeInicio: valor }))}
                onFim={valor => setRegraForm(atual => ({ ...atual, tardeFim: valor }))}
              />
              <Button title={enviando ? 'Salvando...' : 'Salvar regras'} onPress={handleSalvarRegras} disabled={enviando} />
            </View>
          </ScrollView>
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

function HorarioIntervalo({ label, inicio, fim, onInicio, onFim }: {
  label: string;
  inicio: string;
  fim: string;
  onInicio: (valor: string) => void;
  onFim: (valor: string) => void;
}) {
  const aplicarMascara = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 4);
    if (numeros.length <= 2) return numeros;
    if (numeros.length === 3 && Number(numeros.slice(0, 2)) > 23) {
      return `0${numeros[0]}:${numeros.slice(1)}`;
    }
    return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
  };

  return (
    <View style={styles.scheduleGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.scheduleRow}>
        <TextInput style={styles.scheduleInput} keyboardType="number-pad" maxLength={5} placeholder="08:00" value={inicio} onChangeText={valor => onInicio(aplicarMascara(valor))} />
        <Text style={styles.scheduleUntil}>até</Text>
        <TextInput style={styles.scheduleInput} keyboardType="number-pad" maxLength={5} placeholder="12:00" value={fim} onChangeText={valor => onFim(aplicarMascara(valor))} />
      </View>
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
      <Text style={styles.checkText}>{label}{disabled ? ' — indisponível' : ''}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayBg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 14 },
  pageSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: COLORS.textMuted, marginBottom: 14, lineHeight: 16 },
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, overflow: 'hidden', marginBottom: 14 },
  panelHead: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  panelTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: COLORS.textDark },
  panelBodyList: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6 },
  panelBodyInfo: { paddingHorizontal: 16, paddingBottom: 16 },
  calHeader: { backgroundColor: COLORS.greenMain, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calMonthText: { color: COLORS.white, fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  navHitbox: { paddingHorizontal: 12, paddingVertical: 4 },
  calArrow: { color: COLORS.white, fontSize: 24, lineHeight: 24, fontWeight: '700' },
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
  rulesHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editRulesButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.greenMain, borderRadius: 7, marginBottom: 8 },
  editRulesText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 10.5, color: COLORS.greenMain },
  scheduleGroup: { marginBottom: 16 },
  scheduleRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  scheduleInput: { flex: 1, minWidth: 0, maxWidth: '43%', borderWidth: 1.6, borderColor: '#d7e0da', borderRadius: 11, backgroundColor: '#fcfdfc', paddingVertical: 11, paddingHorizontal: 6, textAlign: 'center', fontFamily: 'Montserrat_500Medium', fontSize: 14, color: COLORS.textDark },
  scheduleUntil: { flexShrink: 0, width: '12%', textAlign: 'center', fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.textMuted },
  infoGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoGridCol: { width: '48%' },
  infoKey: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  infoKeyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textMuted },
  infoVal: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: COLORS.textDark },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  saldoRowText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark, flex: 1, marginRight: 10 },
  badgeAprovado: { backgroundColor: '#e8f5e9', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeAprovadoText: { color: '#2e7d32', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  badgePendente: { backgroundColor: '#fff3e0', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgePendenteText: { color: '#e65100', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  
  
  badgeRecusado: { backgroundColor: '#ffebee', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
  badgeRecusadoText: { color: '#c62828', fontFamily: 'Montserrat_700Bold', fontSize: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  btnApprove: { flex: 1, backgroundColor: '#e8f5e9', paddingVertical: 7, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#c8e6c9' },
  btnApproveText: { color: '#2e7d32', fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  btnRefuse: { flex: 1, backgroundColor: '#ffebee', paddingVertical: 7, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#ffcdd2' },
  btnRefuseText: { color: '#c62828', fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400 },
  modalCard: { width: '92%', maxWidth: 520, alignSelf: 'center', backgroundColor: COLORS.white, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 22, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 14, right: 16, zIndex: 50 },
  modalCloseBtnText: { color: COLORS.greenMain, fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: COLORS.textDark, marginBottom: 18, paddingRight: 24 },
  formGroup: { marginBottom: 14, gap: 5 },
  formLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: COLORS.textMid },
  fakeInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.grayBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: COLORS.white },
  fakeInputText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: COLORS.textDark },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  checkbox: { width: 16, height: 16, borderWidth: 1.5, borderColor: COLORS.grayBorder, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  checkboxActive: { backgroundColor: COLORS.greenMain, borderColor: COLORS.greenMain },
  checkText: { fontFamily: 'Montserrat_400Regular', fontSize: 12.5, color: COLORS.textDark },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 10 },
  formError: { fontFamily: 'Montserrat_500Medium', fontSize: 11.5, lineHeight: 16, color: COLORS.red, marginTop: 10, textAlign: 'center' },
});
