# Sistema de Reservas da Academia

Aplicação web desenvolvida para digitalizar a gestão de reservas da academia do condomínio. O objetivo é substituir controles manuais, mensagens dispersas e planilhas por uma interface única onde moradores podem consultar horários, reservar a utilização do espaço e acompanhar avisos importantes em tempo real.

O sistema foi pensado para dois perfis principais:

- Moradores, que acessam a aplicação para entrar com seu usuário, visualizar a disponibilidade e reservar um horário.
- Administradores, que além das reservas também podem bloquear e desbloquear horários para manutenção e publicar avisos para todos os usuários.

## O Que A Aplicação Resolve

Antes da solução digital, a gestão de uma academia de condomínio costuma depender de comunicação manual, o que gera conflitos, dúvidas sobre disponibilidade e dificuldade para registrar bloqueios ou comunicados. Este projeto resolve esse problema central ao centralizar em uma única interface:

- Consulta de disponibilidade de horários por dia.
- Reserva de horários com atualização imediata.
- Controle de limite de ocupação por faixa horária.
- Bloqueio de horários por manutenção ou necessidade operacional.
- Publicação de avisos visíveis para os moradores.
- Autenticação integrada com o banco de dados, permitindo saber quem está logado e o que cada usuário pode fazer.

## Principais Funcionalidades

### Autenticação

- Login com usuário e senha.
- Sessão persistente via Supabase.
- Verificação automática da sessão ao abrir a aplicação.
- Revalidação da sessão quando a aba volta a ficar visível, reduzindo problemas de expiração silenciosa de token.

### Reservas

- Exibição dos horários da academia em blocos de 1 hora.
- Navegação entre os próximos 7 dias.
- Reserva otimista, com atualização visual imediata enquanto a operação é processada.
- Cancelamento de reserva pelo próprio morador.
- Bloqueio de novas reservas quando o usuário já possui uma reserva no mesmo dia.
- Indicação visual de estados como disponível, lotado, encerrado, ainda não liberado, sua reserva e bloqueado.

### Administração

- Bloqueio de horário com motivo, como manutenção.
- Desbloqueio do horário quando a restrição deixa de existir.
- Publicação de avisos gerais.
- Remoção de avisos feitos pelo próprio autor ou por administradores.

### Avisos em Tempo Real

- Lista de avisos atualizada em tempo real com Supabase Realtime.
- Exibição do nome e do apartamento de quem publicou o aviso.
- Possibilidade de remover avisos diretamente da interface, respeitando as regras de permissão.

## Regras De Negócio Observadas

O comportamento da aplicação mostra algumas regras importantes:

- Cada horário comporta até 4 reservas.
- Um usuário não pode ter duas reservas no mesmo dia.
- O horário abre para reserva 48 horas antes do início do slot.
- O horário encerra 10 minutos antes do início do slot.
- Horários bloqueados por administração ficam indisponíveis para moradores.

## Tecnologias Utilizadas

- React 19
- Vite
- Supabase
- JavaScript moderno com módulos ES
- ESLint para padronização e qualidade do código

## Integração Com O Backend

A aplicação usa o Supabase como backend principal, incluindo autenticação, banco de dados e realtime. Pelo código do projeto, a interface conversa com as seguintes estruturas:

- Tabela `usuarios`, para obter o perfil do usuário autenticado.
- Tabela `reservas`, para listar, criar e cancelar reservas.
- Tabela `bloqueios`, para controlar horários indisponíveis.
- Tabela `avisos`, para publicar e listar comunicados.
- Funções RPC `reservar_horario`, `bloquear_horario` e `desbloquear_horario`, responsáveis pelas operações principais de negócio.

## Estrutura Do Projeto

```text
src/
	App.jsx                 # Controla a sessão, splash e troca entre login e home
	App.css                 # Estilos gerais da aplicação
	index.css               # Estilos base do documento
	main.jsx                # Ponto de entrada do React
	supabaseClient.js       # Configuração do cliente Supabase
	components/
		LoginScreen.jsx       # Tela de autenticação
		LoginScreen.css       # Estilos da tela de login
		HomeScreen.jsx        # Tela principal com reservas, avisos e ações de admin
		SplashScreen.jsx      # Tela de carregamento
	models/
		timeSlots.js          # Lista dos horários disponíveis
	services/
		authService.js        # Login, logout e carregamento do usuário
		reservationsService.js# Operações e listeners de reservas e bloqueios
		announcementsService.js# Operações e listeners de avisos
```

## Fluxo Da Aplicação

1. A aplicação inicia em `main.jsx` e monta o componente principal `App`.
2. `App.jsx` consulta a sessão do Supabase e exibe uma splash enquanto carrega.
3. Se houver sessão ativa, o usuário vai para a tela principal; caso contrário, vê a tela de login.
4. Em `HomeScreen.jsx`, a aplicação carrega o perfil do usuário, escuta as reservas, bloqueios e avisos do dia selecionado e atualiza a interface em tempo real.
5. As ações de reserva, cancelamento, bloqueio e publicação de aviso são repassadas aos serviços em `src/services`.

## Como Rodar O Projeto

### Pré-requisitos

- Node.js instalado.
- Um projeto Supabase configurado.
- Variáveis de ambiente com a URL e a chave anônima do Supabase.

### Instalação

```bash
npm install
```

### Variáveis De Ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```bash
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### Scripts Disponíveis

- `npm run dev` inicia o ambiente de desenvolvimento com Vite.
- `npm run build` gera a versão de produção.
- `npm run preview` serve a build localmente.
- `npm run lint` executa a análise estática com ESLint.

### Execução Em Desenvolvimento

```bash
npm run dev
```

## Observações Técnicas

- A autenticação usa `signInWithPassword` do Supabase, com mapeamento do nome de usuário para um e-mail no domínio `@seucondominio.app`.
- O logout força um reload da página para melhorar o comportamento de autofill em alguns navegadores.
- A lista de reservas e avisos usa listeners do Supabase Realtime para refletir mudanças sem precisar recarregar a tela.
- A interface foi desenhada para uso em tela estreita, com layout centralizado e foco em mobile.

## Possíveis Próximos Passos

- Separar perfis de administração em telas ou rotas dedicadas.
- Criar fluxo de recuperação de senha.
- Adicionar histórico de reservas por morador.
- Incluir métricas de ocupação e relatórios administrativos.
- Melhorar a documentação do banco de dados com o schema completo das tabelas e RPCs.

## Licença

Este projeto não possui licença definida no momento.
