# Auxiliadora Digital

## Documento funcional para Product Owner

**Atualizado em:** 15/07/2026  
**Produto:** aplicativo móvel para operação e comunicação condominial  
**Plataforma:** Expo / React Native com Supabase

## 1. Visão do produto

O Auxiliadora Digital concentra, em uma única conta, informações e serviços do condomínio. Depois de identificado por CPF e senha, o usuário acessa o condomínio e os serviços compatíveis com o seu papel — por exemplo, morador, proprietário, síndico, gestor, conselheiro, zelador ou porteiro.

Nesta versão, os fluxos principais já consultam e gravam dados no Supabase: autenticação, escolha de condomínio, boletos, financeiro, comunicados, agenda, reservas, mudanças, reparos e mensagens para a diretoria.

## 2. Escopo entregue

| Área | Situação | O que o usuário consegue fazer |
| --- | --- | --- |
| Acesso e sessão | Funcionando | Identificar-se por CPF, informar senha, manter a sessão no aparelho, sair e trocar de condomínio. |
| Home e perfil | Funcionando | Ver identificação, papel, condomínio ativo, atalhos e, para perfis administrativos, o resumo financeiro. |
| Boletos | Funcionando | Consultar boletos do condomínio/unidade, filtrar e visualizar ações de 2ª via ou jurídico conforme atraso. |
| Dashboard | Funcionando | Consultar receitas e despesas dos últimos meses, além dos indicadores financeiros disponíveis. |
| Circulares | Funcionando | Ler comunicados; síndico e conselheiro podem publicar novos avisos. |
| Agenda do condomínio | Funcionando | Consultar eventos; síndico administra eventos publicados. |
| Reservas | Funcionando | Consultar espaços, reservar por turno, acompanhar disponibilidade e, para síndico/gestor, aprovar ou recusar solicitações. |
| Agenda de mudanças | Funcionando | Solicitar mudança; zelador aprova ou recusa solicitações. |
| Reparos | Funcionando | Síndico abre solicitações; zelador atualiza o andamento. |
| Fale com o Corpo Diretivo | Funcionando | Morador envia e acompanha mensagens; diretoria responde mensagens destinadas ao seu papel. |

Os módulos indicados como **“disponíveis apenas no app completo”** no menu são itens de catálogo futuro e não fazem parte deste escopo entregue.

## 3. Jornada do usuário

1. O usuário informa o CPF.
2. O aplicativo consulta a conta correspondente no Supabase.
3. Se a conta estiver ativa, o usuário informa a senha.
4. Após a autenticação, o aplicativo carrega os vínculos do usuário com os condomínios.
5. Havendo mais de um vínculo, o usuário escolhe o condomínio e a unidade/papel que deseja utilizar.
6. A Home exibe apenas os serviços liberados para o perfil ativo.
7. A sessão fica salva no dispositivo e é restaurada quando o aplicativo é aberto novamente.

### Mensagens tratadas no acesso

- Conta não encontrada ou bloqueada: o aplicativo informa que o acesso não está disponível.
- Credenciais inválidas: o aplicativo informa que a senha deve ser revisada.
- Falha de comunicação: o aplicativo exibe mensagem de erro de conexão.
- CPF: o campo aplica máscara de digitação (`000.000.000-00`). A validação matemática do CPF está desativada nesta versão para permitir dados de demonstração cadastrados no banco.

## 4. Perfis e visibilidade

O menu é montado conforme o papel salvo no vínculo entre usuário e condomínio. A tabela abaixo descreve a visibilidade atual na interface.

| Funcionalidade | Quem visualiza | Quem executa ações de gestão |
| --- | --- | --- |
| Home e perfil | Todos os usuários autenticados | — |
| Boletos | Síndico, gestor, proprietário e morador | Síndico e gestor podem consultar todas as unidades; proprietário e morador veem somente a própria unidade. |
| Dashboard gerencial | Síndico e gestor | — |
| Circulares | Síndico, conselheiro, gestor, morador e proprietário | Síndico e conselheiro publicam circulares. |
| Agenda do condomínio | Síndico, morador, zelador e porteiro | Síndico cria, edita e exclui eventos. |
| Reserva de espaços | Síndico, gestor e morador | Morador envia pedidos; síndico e gestor cadastram espaços, visualizam solicitações pendentes e aprovam ou recusam pedidos. |
| Agenda de mudanças | Síndico, morador e zelador | Zelador aprova ou recusa solicitações. |
| Reparos | Síndico e zelador | Síndico abre solicitações; zelador atualiza o status. |
| Fale com o Corpo Diretivo | Síndico e morador | O morador envia; a diretoria responde mensagens destinadas ao seu papel ou a “Todos”. |

> A visibilidade no aplicativo melhora a experiência de uso, mas não substitui a segurança de banco. As políticas RLS do Supabase devem reproduzir as mesmas restrições por usuário, condomínio, unidade e papel.

## 5. Funcionalidades e regras de negócio

### 5.1 Condomínio ativo e isolamento de dados

- Um mesmo usuário pode ter vínculos com mais de um condomínio e, inclusive, com mais de uma unidade.
- O vínculo escolhido define condomínio, papel e unidade ativos durante a sessão.
- Todas as consultas funcionais são filtradas pelo condomínio ativo.
- A seleção é persistida localmente para restaurar o contexto na próxima abertura do aplicativo.

### 5.2 Boletos e cobrança

- Os boletos são carregados da tabela `boletos` e ordenados por vencimento.
- Proprietário e morador recebem somente registros da própria unidade.
- Síndico e gestor recebem registros de todas as unidades e podem usar o filtro de unidade.
- Há filtros por unidade, ano, mês e status (`A vencer`, `Vencido` e `Pago`).
- O status visual de vencimento considera a data atual quando o boleto ainda não está marcado como pago.
- Para boletos vencidos, a tela de 2ª via calcula multa de 2% e juros de 1% ao mês proporcional aos dias em atraso.
- Acima de 60 dias de atraso, o usuário é encaminhado à tela de contato jurídico.

**Limite atual:** a geração de PDF, linha digitável, envio por e-mail e baixa bancária ainda não estão integrados; a 2ª via é uma simulação de valor atualizado.

### 5.3 Dashboard financeiro

- A série mensal vem de `fluxo_caixa` e mostra receita prevista, receita realizada e despesa realizada.
- O dashboard trabalha com os últimos seis registros encontrados para o condomínio.
- Os valores de conta corrente, investimentos e inadimplência são carregados junto com o vínculo do condomínio no login e exibidos nos cards financeiros.

**Limite atual:** os cards financeiros são atualizados no login; uma atualização em tempo real durante uma sessão já aberta é uma evolução recomendada.

### 5.4 Circulares

- Todos os perfis liberados podem consultar comunicados do condomínio ativo.
- Síndico e conselheiro podem publicar comunicados com categoria, título e conteúdo.
- As categorias disponíveis são: Aviso, Manutenção, Assembleia, Regra e Urgente.
- A lista é ordenada pela data de publicação; conteúdos longos podem ser expandidos na própria tela.

### 5.5 Agenda do condomínio

- Eventos pertencem a um condomínio e exibem título, descrição, data, local e horário.
- A agenda apresenta os eventos em ordem de data e informa se o evento é hoje, amanhã, futuro ou já ocorreu.
- O síndico pode publicar, editar e excluir eventos.
- A exclusão exige confirmação do usuário.

### 5.6 Reservas de espaços

- Os espaços são consultados por condomínio e podem ter responsável, capacidade, valor e antecedência informada.
- Cada dia possui dois turnos independentes: `Manhã` (08:00 às 15:00) e `Tarde` (16:00 às 22:00).
- Uma nova reserva exige nome do evento e é criada com status `pendente`, para análise da administração.
- Reservas com status `pendente` ou `aprovada` ocupam somente o respectivo turno. Portanto, uma reserva de manhã ainda permite uma solicitação para a tarde na mesma data, e vice-versa.
- O turno já ocupado aparece como indisponível no formulário e não pode ser selecionado. O botão de envio também permanece desativado para um turno indisponível.
- Quando os dois turnos estão ocupados, o dia fica cinza no calendário e não aceita novas solicitações.
- O síndico e o gestor veem uma lista de solicitações pendentes abaixo do calendário, sem precisar abrir cada dia para encontrá-las.
- O síndico e o gestor podem aprovar ou recusar uma solicitação pendente. Uma reserva recusada libera novamente aquele turno para nova solicitação.
- O síndico e o gestor podem cadastrar espaços comuns diretamente pelo aplicativo.

**Regra de concorrência:** o aplicativo valida espaço, data e turno antes de inserir uma reserva. Para impedir duplicidade mesmo em acessos simultâneos, o banco deve ter um índice único parcial em `espaco_id`, `data_evento` e `periodo`, válido apenas para os status `pendente` e `aprovada`.

**Compatibilidade de dados:** há registros legados com status `bloqueada`. O fluxo atual de turnos usa como ocupação apenas `pendente` e `aprovada`; antes de usar `bloqueada` como regra operacional, é necessário definir se ela representa bloqueio do dia inteiro ou migrar esses registros para os status oficiais.

### 5.7 Agenda de mudanças

- Morador e síndico podem solicitar entrada ou saída de mudança em uma data futura.
- Cada solicitação registra unidade, data, turno, tipo, empresa responsável e status inicial `pendente`.
- Datas com solicitação pendente ou aprovada são indisponibilizadas no calendário.
- O morador vê apenas as próprias solicitações; o zelador vê as solicitações do condomínio.
- O zelador aprova ou recusa pedidos, atualizando o status no banco.

**Regras exibidas:** responsável, horário, antecedência e tipo de acesso são regras operacionais fixas nesta versão. Elas ainda não possuem cadastro por condomínio no banco.

### 5.8 Reparos e manutenção

- O síndico abre uma solicitação selecionando área, urgência, título e descrição.
- Cada solicitação recebe protocolo no formato `#ANO-NÚMERO` e fica vinculada ao condomínio.
- O protocolo amigável é exibido na lista de reparos; o ID técnico é usado apenas como reserva para registros antigos.
- A solicitação nasce como `Em análise`, com progresso inicial de 15%.
- O zelador acompanha todos os reparos do condomínio e pode mudar o status para:

  - **Em análise:** 40% — equipe ciente e aguardando avaliação técnica.
  - **Pendente:** 60% — aguardando peças ou aprovação de orçamento.
  - **Concluído:** 100% — reparo finalizado.

**Limite atual:** o botão “Adicionar fotos” é apenas visual; o envio de imagens ainda não usa o Supabase Storage.

### 5.9 Mensagens para o Corpo Diretivo

- O morador visualiza os membros da diretoria vinculados ao condomínio, envia mensagem e acompanha seu histórico.
- A mensagem exige destinatário, categoria, título e conteúdo.
- O assunto é gravado com a categoria escolhida; o status inicial é `Aguardando`.
- Síndico, subsíndico, conselheiro e gestor atuam como diretoria quando acessam a tela.
- A caixa de entrada da diretoria mostra somente mensagens direcionadas ao papel atual ou a `Todos`.
- A resposta é gravada na própria mensagem e altera o status para `Respondido`.

## 6. Integração com o Supabase

### Dados utilizados

| Tabela | Uso no aplicativo |
| --- | --- |
| `usuarios` | Identificação por CPF, login e status de acesso. |
| `usuarios_condominios` | Vínculos entre usuário, condomínio, papel e unidade. |
| `condominios` | Nome, endereço e indicadores financeiros do condomínio. |
| `boletos` | Consulta de cobranças por condomínio e unidade. |
| `fluxo_caixa` | Séries financeiras do dashboard. |
| `circulares` | Leitura e publicação de comunicados. |
| `eventos` | Agenda do condomínio. |
| `espacos` | Espaços que podem ser reservados. |
| `reservas` | Solicitações e ocupação de espaços. |
| `mudancas` | Solicitações e decisões sobre mudanças. |
| `reparos` | Abertura e acompanhamento de manutenção. |
| `mensagens_diretoria` | Comunicação entre moradores e diretoria. |

### Conexão e verificação

- A URL e a chave pública do Supabase são lidas por variáveis de ambiente; não estão no código-fonte.
- Ao iniciar o app em desenvolvimento, uma consulta simples à tabela `usuarios` valida a conexão.
- Com conexão válida, o console mostra `Supabase Ready/Connected!`.
- O arquivo `.env` é ignorado pelo Git para evitar versionamento de credenciais.

### Integridade das reservas

Para impedir que duas solicitações concorrentes ocupem o mesmo espaço, data e turno, recomenda-se criar no Supabase o índice abaixo. Antes de executá-lo, duplicidades já existentes devem ser tratadas.

```sql
create unique index if not exists reservas_espaco_data_periodo_ativo_unico
on public.reservas (espaco_id, data_evento, periodo)
where status in ('pendente', 'aprovada');
```

## 7. Como preparar o ambiente local

### Pré-requisitos

- Node.js compatível com Expo SDK 54.
- Projeto Supabase acessível e com as tabelas listadas acima.
- Dependências do projeto instaladas.

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` com os dados do projeto Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Não envie esse arquivo ao repositório. A chave utilizada pelo aplicativo deve ser a **anon key pública**; a `service_role key` jamais deve ser usada no aplicativo.

### 3. Iniciar o aplicativo

```bash
npm start
```

Também estão disponíveis:

```bash
npm run android
npm run ios
npm run web
```

Em desenvolvimento, confira o console para o log `Supabase Ready/Connected!`.

### 4. Validação técnica disponível

```bash
npx tsc --noEmit
```

## 8. Persistência de sessão

- Os dados do contexto do usuário e o identificador de sessão são armazenados no `expo-secure-store` quando o recurso está disponível no dispositivo.
- Ao reabrir o app, a sessão e o condomínio ativo são restaurados.
- Ao sair, os dados de sessão são removidos do armazenamento seguro.

## 9. Segurança e pontos de evolução

### Segurança atual

- As variáveis de conexão são separadas do código e o `.env` está ignorado pelo Git.
- O app aplica filtros de condomínio, unidade e papel na interface e nas consultas de negócio.
- A segurança definitiva deve ser garantida no Supabase com Row Level Security (RLS), pois filtros do aplicativo não impedem chamadas diretas à API.

### Evoluções recomendadas

1. Migrar o login para Supabase Auth, com senha protegida e JWT real. Nesta versão, a senha é comparada no cliente e o ID do usuário é usado como identificador de sessão.
2. Implementar e validar RLS para isolar condomínio, unidade, usuário e permissões de escrita por papel.
3. Criar e validar regras de unicidade no banco para evitar conflitos simultâneos de reservas e mudanças.
4. Formalizar ou migrar o status legado `bloqueada` das reservas, definindo seu efeito operacional.
5. Criar cadastro de regras de mudança por condomínio.
6. Integrar emissão bancária da 2ª via, documentos e fotos de reparos ao armazenamento apropriado.
7. Atualizar os indicadores financeiros em tempo real ou ao entrar no dashboard.
8. Criar testes automatizados e pipeline de validação antes da publicação.

## 10. Itens fora do escopo atual

Os itens abaixo aparecem no catálogo do produto, mas ainda não possuem fluxo implementado nesta versão: extratos financeiros, cotas pendentes, notas fiscais, informe de rendimentos, gestão de gastos, imóveis, pesquisa de aluguéis, gerente de contas, notificações push, suporte por e-mail, portaria, controle de consumo, documentos digitalizados, departamento pessoal e obrigações legais.

## 11. Resumo para acompanhamento de produto

O aplicativo já tem uma base funcional integrada ao banco para operar um condomínio: acesso, contexto de usuário e condomínio, comunicação, agenda, manutenção, solicitações operacionais e consulta financeira. As principais evoluções não são telas faltantes do fluxo atual, mas reforços de segurança, automação bancária, armazenamento de anexos e regras de banco para impedir conflitos e acessos indevidos.
