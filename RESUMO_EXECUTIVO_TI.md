# Auxiliadora Digital — Resumo Executivo de Tecnologia

## Visão

O Auxiliadora Digital centraliza serviços condominiais, comunicação, operações e consultas financeiras em uma experiência mobile. A versão atual é um protótipo funcional integrado ao Supabase para validar os fluxos antes da conexão com APIs corporativas e ERP.

## Valor já demonstrado

- acesso por CPF e seleção de condomínio;
- experiência adaptada ao perfil do usuário;
- boletos e indicadores financeiros;
- circulares, agenda e notificações internas;
- reservas de espaços e bloqueio de datas;
- solicitações de mudança e reparos;
- comunicação entre moradores e corpo diretivo;
- regras configuráveis por condomínio.

## Arquitetura atual

- Expo SDK 54, React Native e TypeScript;
- React Navigation;
- SecureStore para persistência local da sessão;
- Supabase como fonte provisória de dados e eventos em tempo real;
- catálogo de módulos e visibilidade organizados por perfil;
- camada de serviços preparada para evoluir para APIs corporativas.

## Maturidade

O aplicativo está adequado para desenvolvimento interno, demonstração e validação de experiência. Ainda não deve ser classificado como pronto para produção.

Autenticação, recuperação de senha e integração financeira são provisórias. As implementações definitivas serão responsabilidade das APIs corporativas e do ERP.

## Qualidade verificada

- lint sem erros;
- validação TypeScript sem erros;
- build web do Expo concluído;
- 23 testes automatizados executados localmente para CPF, formatação e permissões;
- revisão dos fluxos críticos e dos estados de falha.

As suítes automatizadas ainda não estão versionadas no repositório principal.

## Integrações previstas

1. Autenticação com tokens reais e renovação de sessão.
2. Pessoas, condomínios, unidades e perfis.
3. Financeiro e cobrança conectados ao ERP.
4. Reservas, mudanças, reparos, eventos e comunicação.
5. Notificações push.
6. Logs, métricas e rastreamento de erros.

## Controles necessários para produção

- autorização no servidor por usuário, condomínio, unidade e perfil;
- contratos versionados em OpenAPI;
- idempotência e transações para reservas e operações financeiras;
- ambientes separados de desenvolvimento, homologação e produção;
- dados fictícios ou anonimizados fora da produção;
- pipeline de lint, tipos, testes e build;
- auditoria e monitoramento operacional.

## Riscos conhecidos

- autenticação provisória no cliente;
- dependência temporária do Supabase em algumas telas;
- funcionalidades planejadas ainda sem serviço real;
- contratos ainda não compartilhados com o ERP;
- testes de integração dependentes de homologação.

## Próxima decisão recomendada

Validar com Produto, TI, ERP e equipe de APIs o escopo do MVP integrado. Em seguida, congelar os contratos da primeira versão, disponibilizar homologação e substituir gradualmente o acesso provisório ao Supabase pelas APIs corporativas.

## Mensagem executiva

O projeto já demonstra a proposta de valor e os principais fluxos. O próximo ciclo não exige reconstruir o aplicativo: exige consolidar integração, segurança, governança de dados e operação para transformar o protótipo validado em produto corporativo.
