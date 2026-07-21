# Auxiliadora Digital

Aplicativo mobile para gestão e comunicação condominial. O projeto centraliza serviços como boletos, comunicados, notificações internas, agenda, reservas de espaços, mudanças, reparos e contato com o corpo diretivo.

Desenvolvido com Expo SDK 54, React Native, TypeScript e Supabase.

## Funcionalidades

- Autenticação por CPF e senha
- Seleção de condomínio, unidade e perfil de acesso
- Persistência segura da sessão no dispositivo
- Consulta de boletos e simulação de segunda via conforme a regra de cobrança de cada condomínio
- Dashboard financeiro
- Publicação e leitura de circulares nas categorias Aviso, Manutenção e Informação
- Agenda de eventos do condomínio com notificações aos destinatários
- Notificações internas persistentes, contador de não lidas e atualização em tempo real
- Reserva de espaços por turno, com aprovação automática, manual ou condicionada à inadimplência
- Cadastro de espaços pela administradora e bloqueio de datas pelo síndico ou administradora
- Solicitação e aprovação de mudanças por turno
- Regras de mudança configuráveis por condomínio
- Abertura e acompanhamento de reparos
- Comunicação entre moradores e corpo diretivo sem exposição dos e-mails dos membros
- Controle de funcionalidades conforme o perfil do usuário

## Tecnologias

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- React Native 0.81
- React 19
- TypeScript
- React Navigation 7
- Supabase
- Expo SecureStore
- Jest e Testing Library

## Pré-requisitos

- Node.js 20.19 ou superior, compatível com o Expo SDK 54
- npm
- Um projeto Supabase com a estrutura de dados esperada pelo aplicativo
- Expo Go no dispositivo ou um emulador Android/iOS configurado

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Use somente a chave pública (`anon key`) no aplicativo. Nunca exponha a chave `service_role`.

3. Inicie o ambiente de desenvolvimento:

```bash
npm start
```

Leia o QR Code com o Expo Go ou pressione a opção correspondente para abrir o app em um emulador.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run android` | Abre o projeto no Android |
| `npm run ios` | Abre o projeto no iOS |
| `npm run web` | Abre a versão web |
| `npm test` | Executa os testes com Jest |
| `npx tsc --noEmit` | Valida os tipos TypeScript sem gerar arquivos |

## Estrutura do projeto

```text
.
├── assets/                 # Ícones, splash screen e favicon
├── src/
│   ├── components/         # Componentes reutilizáveis
│   ├── config/             # Configuração dos módulos e permissões
│   ├── constants/          # Tema e constantes visuais
│   ├── context/            # Estado global de autenticação
│   ├── navigation/         # Rotas e navegação
│   ├── screens/            # Telas do aplicativo
│   ├── services/           # Integração com Supabase e regras de dados
│   └── utils/              # Formatadores e utilitários
├── App.tsx                 # Componente raiz
├── app.json                # Configuração do Expo
└── DOCUMENTACAO.md         # Documentação funcional detalhada
```

## Banco de dados

O aplicativo utiliza as seguintes tabelas no Supabase:

- `usuarios`
- `usuarios_condominios`
- `condominios`
- `boletos`
- `fluxo_caixa`
- `circulares`
- `eventos`
- `espacos`
- `reservas`
- `bloqueios_espacos`
- `mudancas`
- `regras_mudanca`
- `reparos`
- `mensagens_diretoria`
- `notificacoes`

O banco utilizado no ambiente atual contém, entre outros recursos:

- notificações integradas aos principais fluxos;
- regras de cobrança configuráveis por condomínio;
- modos de aprovação das reservas;
- proteção contra reservas concorrentes;
- bloqueios de datas específicas dos espaços;
- regras e horários de mudança por condomínio.

Antes de configurar outro ambiente Supabase, as alterações SQL devem ser formalizadas e versionadas como migrações, executadas na ordem e validadas com os dados existentes.

As políticas de Row Level Security (RLS) devem garantir o isolamento dos dados por usuário, condomínio, unidade e perfil. As restrições aplicadas pela interface não substituem a segurança no banco.

## Documentação

Consulte [DOCUMENTACAO.md](./DOCUMENTACAO.md) para conhecer as regras de negócio, perfis de acesso, integrações, limitações atuais e evoluções recomendadas.

## Status

Projeto privado em desenvolvimento. Os fluxos principais usam dados reais do Supabase; não são dados fixos no código. Alguns recursos exibidos no catálogo ainda são demonstrativos ou estão planejados para versões futuras.

Limitações atuais importantes:

- as notificações são internas e ainda não funcionam como push nativo com o aplicativo fechado;
- as regras de cobrança estão preparadas por condomínio, mas a sincronização real com o ERP ainda não foi implementada;
- a segunda via ainda não emite cobrança bancária real;
- os indicadores financeiros não são atualizados automaticamente durante uma sessão aberta;
- anexos de reparos, Supabase Auth/JWT, políticas RLS completas e testes automatizados ainda são evoluções pendentes.
