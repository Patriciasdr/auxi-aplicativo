# Auxiliadora Digital

Aplicativo mobile para gestão e comunicação condominial. O projeto centraliza serviços como boletos, comunicados, agenda, reservas de espaços, mudanças, reparos e contato com o corpo diretivo.

Desenvolvido com Expo SDK 54, React Native, TypeScript e Supabase.

## Funcionalidades

- Autenticação por CPF e senha
- Seleção de condomínio, unidade e perfil de acesso
- Persistência segura da sessão no dispositivo
- Consulta de boletos e simulação de segunda via com juros
- Dashboard financeiro
- Publicação e leitura de circulares
- Agenda de eventos do condomínio
- Reserva e administração de espaços comuns
- Solicitação e aprovação de mudanças
- Abertura e acompanhamento de reparos
- Comunicação entre moradores e corpo diretivo
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
- `mudancas`
- `reparos`
- `mensagens_diretoria`

As políticas de Row Level Security (RLS) devem garantir o isolamento dos dados por usuário, condomínio, unidade e perfil. As restrições aplicadas pela interface não substituem a segurança no banco.

## Documentação

Consulte [DOCUMENTACAO.md](./DOCUMENTACAO.md) para conhecer as regras de negócio, perfis de acesso, integrações, limitações atuais e evoluções recomendadas.

## Status

Projeto privado em desenvolvimento. Alguns recursos exibidos no catálogo do aplicativo ainda são demonstrativos ou estão planejados para versões futuras.
