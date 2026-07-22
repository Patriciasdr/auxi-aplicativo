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

- Node.js 20.19 ou superior, compatível com o Expo SDK 54;
- npm, instalado junto com o Node.js;
- Git para clonar o repositório;
- acesso a um projeto Supabase com a estrutura esperada pelo aplicativo;
- Expo Go em um dispositivo ou um emulador Android/iOS configurado.

Confirme as versões instaladas:

```bash
node --version
npm --version
git --version
```

## Execução rápida

### 1. Clone o repositório

```bash
git clone https://github.com/Patriciasdr/auxi-aplicativo.git
cd auxi-aplicativo
```

Se o projeto já estiver no computador, entre na pasta raiz, onde estão `package.json`, `App.tsx` e `app.json`.

### 2. Instale as dependências

```bash
npm ci
```

O `npm ci` utiliza exatamente as versões registradas no `package-lock.json`. Use `npm install` apenas quando houver necessidade de alterar dependências.

### 3. Configure as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Substitua os valores pelas credenciais do ambiente de desenvolvimento ou homologação. Use somente a chave pública (`anon key`) no aplicativo. Nunca coloque a chave `service_role` no `.env` do app.

O arquivo `.env` não é enviado ao Git. Cada desenvolvedor precisa criar o seu arquivo local.

### 4. Inicie o Expo


```bash
npm start
```

O terminal exibirá um QR Code e os atalhos disponíveis.

### 5. Abra o aplicativo

#### Em um celular com Expo Go

1. Instale o Expo Go no celular.
2. Mantenha o computador e o celular na mesma rede.
3. Execute `npm start`.
4. Leia o QR Code exibido no terminal.

Se a rede bloquear a conexão local, tente:

```bash
npx expo start --tunnel
```

#### No Android

Com um emulador iniciado ou dispositivo configurado:

```bash
npm run android
```

Também é possível executar `npm start` e pressionar `a` no terminal.

#### No iOS

O simulador iOS exige macOS com Xcode:

```bash
npm run ios
```

Também é possível executar `npm start` e pressionar `i` no terminal.

#### No navegador

```bash
npm run web
```

## Validação antes de desenvolver

Depois de instalar e configurar o projeto, execute:

```bash
npm run lint
npx tsc --noEmit
```

Para verificar se os pacotes estão alinhados ao Expo SDK instalado:

```bash
npx expo-doctor
```

## Problemas comuns

### O Expo não reconhece uma alteração

Limpe o cache do Metro:

```bash
npx expo start --clear
```

### O celular não abre o projeto pelo QR Code

- confirme que celular e computador estão na mesma rede;
- libere Node.js e Expo no firewall;
- desative temporariamente VPNs que bloqueiem a rede local;
- tente `npx expo start --tunnel`.

### Aparece erro de variável do Supabase

- confirme que o arquivo se chama exatamente `.env`;
- confirme que ele está na raiz do projeto;
- confira os nomes `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`;
- reinicie o Expo depois de alterar o arquivo.

### Aparecem erros depois de atualizar dependências

Restaure a instalação conforme o lockfile:

```bash
npm ci
npx expo start --clear
```

Evite executar `npm audit fix --force`, pois ele pode migrar o Expo para uma versão incompatível com o projeto.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run android` | Abre o projeto no Android |
| `npm run ios` | Abre o projeto no iOS |
| `npm run web` | Abre a versão web |
| `npm run lint` | Verifica padrões e boas práticas com ESLint |
| `npm test` | Executa os testes com Jest |
| `npx tsc --noEmit` | Valida os tipos TypeScript sem gerar arquivos |
| `npx expo start --clear` | Inicia o Expo limpando o cache local |
| `npx expo-doctor` | Verifica a compatibilidade das dependências |

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
