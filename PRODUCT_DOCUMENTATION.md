# FieldVantage — Documentação do Produto

> Versão do documento: Março 2026 — V1.1  
> Destinado a: clientes, parceiros e investidores

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Modelo de Acesso e Permissões](#2-modelo-de-acesso-e-permissões)
3. [Funcionalidades por Tela](#3-funcionalidades-por-tela)
   - 3.1 [Registro e Onboarding](#31-registro-e-onboarding)
   - 3.2 [Dashboard — Painel Operacional](#32-dashboard--painel-operacional)
   - 3.3 [Ordens de Serviço](#33-ordens-de-serviço) (inclui Fotos e Anexos)
   - 3.4 [Clientes](#34-clientes)
   - 3.5 [Colaboradores](#35-colaboradores)
   - 3.6 [Filiais](#36-filiais)
   - 3.7 [Configurações](#37-configurações)
   - 3.8 [Mensagens](#38-mensagens)
   - 3.9 [Convites — Caixa de Entrada](#39-convites--caixa-de-entrada)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [Segurança e Controle de Acesso](#5-segurança-e-controle-de-acesso)
6. [Infraestrutura e Tecnologia](#6-infraestrutura-e-tecnologia)
7. [Roadmap](#7-roadmap)

---

## 1. Visão Geral do Produto

### O que é o FieldVantage

O FieldVantage é uma plataforma SaaS de gestão de operações de equipes — para qualquer organização que precise controlar quem executa o quê, quando e onde. Embora tenha nascido voltado para empresas de serviços externos (limpeza, manutenção, obras, jardinagem), sua arquitetura de ordens de serviço, equipes e filiais atende igualmente restaurantes, fábricas, hotéis, redes de varejo, condomínios e qualquer operação que dependa de equipes coordenadas. O objetivo central é centralizar tarefas, equipes e clientes em uma experiência simples, rápida e confiável para o dia a dia.

### Para quem foi construído

| Setor | Exemplos de uso |
|---|---|
| Limpeza comercial e residencial | Agendamento de serviços recorrentes, alocação de equipes por turno |
| Manutenção predial | Controle de chamados por unidade, histórico de intervenções |
| Construção e reformas | Gestão de equipes por obra, acompanhamento de status |
| Paisagismo e jardinagem | Rotas semanais, equipes volantes em múltiplos clientes |
| Serviços de propriedade | Inspeções periódicas, relatórios por cliente |
| Restaurantes e food service | Higienizações periódicas, manutenção de equipamentos, inspeções sanitárias |
| Fábricas e indústria | Manutenção preventiva e corretiva de máquinas, inspeções de segurança |
| Hotéis e hospedagem | Limpeza de quartos, manutenção de instalações, controle de governança |
| Escritórios e facilities | Manutenção interna, limpeza programada, chamados físicos |
| Redes de varejo e franquias | Vistorias e auditorias periódicas em cada loja, padronização entre unidades |
| Condomínios | Manutenção, zeladoria, controle de prestadores terceirizados |
| Transportadoras e logística | Inspeção de frota, manutenção de veículos por unidade |
| Prefeituras e serviços públicos | Zeladoria urbana, manutenção de parques e iluminação pública |
| Eventos e produção | Equipes de montagem e desmontagem por local e evento |

> O FieldVantage não é exclusivo para serviços de campo. Qualquer operação com equipes, tarefas e unidades se beneficia da plataforma.

### Proposta de valor

- **Visibilidade total da operação** em tempo real, com calendário, KPIs e alertas de risco
- **Gestão por filiais** para empresas com múltiplas unidades — cada filial enxerga apenas seus dados
- **Onboarding em minutos** via wizard guiado; colaboradores ingressam por link de convite, sem necessidade de cadastro manual pelo gestor
- **Multi-tenant** — cada empresa tem seus dados completamente isolados
- **Acesso diferenciado por papel** — proprietário, administrador e colaborador com regras claras de visibilidade e permissão

---

## 2. Modelo de Acesso e Permissões

### 2.1 Os três papéis

O sistema adota três papéis fixos. A distinção entre "gerente geral" e "gerente de filial", por exemplo, é feita pelo **escopo de filial**, não por um papel separado — seguindo o padrão de mercado de SaaS B2B.

| Papel | Nome exibido | Quem é |
|---|---|---|
| `owner` | Proprietário | Dono da empresa; criado automaticamente no cadastro |
| `admin` | Administrador | Gerente geral ou gerente de filial |
| `member` | Colaborador | Técnico, prestador ou funcionário operacional |

### 2.2 Escopo de filial

Cada membro pode ter um **escopo de acesso** associado:

| Configuração | Escopo | Quem |
|---|---|---|
| Proprietário sem filial vinculada | **Empresa toda (HQ)** — vê tudo | Proprietário |
| Admin sem filial vinculada | **Sem filial atribuída** — vê apenas ordens atribuídas a ele diretamente | Admin "volante" |
| Admin com 1 filial | **Filial X** — vê dados de uma filial específica | Gerente de filial |
| Admin com 2+ filiais | **N filiais** — vê dados de múltiplas filiais | Gerente geral com escopo restrito |
| Colaborador sem filial | **Sem filial** — vê apenas ordens atribuídas a ele | Técnico volante |
| Colaborador com filial | **Filial X** — vê apenas suas ordens naquela filial | Técnico fixo |

### 2.3 Labels exibidos na interface

A plataforma combina papel e escopo em um único rótulo amigável exibido em toda a interface:

| Papel | Escopo | Label exibido |
|---|---|---|
| Proprietário | Qualquer | "Proprietário" |
| Administrador | Empresa toda (HQ) | "Administrador · Empresa toda" |
| Administrador | 1 filial | "Administrador · Filial Centro" |
| Administrador | 2+ filiais | "Administrador · 3 filiais" |
| Administrador | Sem filial | "Administrador · Sem filial" |
| Colaborador | 1 filial | "Colaborador · Filial Sul" |
| Colaborador | 2+ filiais | "Colaborador · 2 filiais" |

### 2.4 Tabela de permissões

| Ação | Proprietário | Admin HQ | Admin de Filial | Colaborador |
|---|---|---|---|---|
| Ver todas as ordens da empresa | Sim | Sim | Não | Não |
| Ver ordens das filiais atribuídas | — | — | Sim | Não |
| Ver ordens atribuídas a si mesmo | Sim | Sim | Sim | Sim |
| Criar ordens | Sim | Sim | Sim (filial própria) | Não |
| Editar / cancelar ordens | Sim | Sim | Sim (filial própria) | Não |
| Atualizar status de ordem | Sim | Sim | Sim | Sim (próprias) |
| Criar e editar filiais | Sim | Sim (HQ) | Não | Não |
| Convidar colaboradores | Sim | Sim | Sim (para filial própria) | Não |
| Promover para Admin HQ | Sim | Não | Não | Não |
| Promover para Admin de filial | Sim | Sim (HQ) | Não | Não |
| Alterar o próprio papel | Não | Não | Não | Não |
| Alterar papel de Proprietário | Não | Não | Não | Não |
| Criar e editar clientes | Sim | Sim | Sim | Sim |
| Ver colaboradores da empresa | Sim | Sim | Sim (filial própria) | Não |
| Enviar mensagens internas | Sim | Sim | Sim | Sim |
| Configurar perfil da empresa | Sim | Sim (HQ) | Não | Não |

### 2.5 Hierarquia de promoção

```
Proprietário
 └── pode promover/demover qualquer pessoa, incluindo criar Admin HQ

Administrador HQ (sem filial)
 └── pode convidar e promover para Admin de filial ou Colaborador
 └── não pode criar outro Admin HQ

Administrador de filial
 └── pode convidar e promover para Colaborador dentro de suas filiais
 └── não pode promover para Admin

Colaborador
 └── sem permissão de edição de papéis
```

**Regras adicionais:**
- Nenhum usuário pode alterar o próprio papel
- O papel de Proprietário não pode ser atribuído por outros Proprietários via interface (é criado no momento do cadastro da empresa)

---

## 3. Funcionalidades por Tela

### 3.1 Registro e Onboarding

#### 3.1.1 Criação de conta (wizard)

O cadastro de uma nova empresa é guiado por um wizard de múltiplos passos, sem necessidade de cartão de crédito ou configuração prévia.

| Passo | Conteúdo |
|---|---|
| 1 — Tipo de usuário | Escolha entre "Sou dono de uma empresa" ou "Trabalho para uma empresa" |
| 2 — Tipo de negócio | Seleção do setor: limpeza, manutenção, construção, paisagismo, imóveis ou outro |
| 3 — Tamanho da equipe | Faixa: apenas eu / 2–5 / 6–10 / 11+ |
| 4 — Dados da conta | Nome, e-mail e senha |
| 5 — Nome da empresa | Nome comercial + criação da conta |

Ao concluir, o sistema cria automaticamente:
- Conta de usuário no serviço de autenticação
- Registro da empresa
- Perfil de colaborador vinculado
- Membership com papel `owner`

O usuário é autenticado e redirecionado para o dashboard sem nenhuma etapa adicional.

#### 3.1.2 Acesso como colaborador

Colaboradores não se auto-cadastram. O fluxo é:
1. Proprietário/admin cria o colaborador e define filial e papel
2. O sistema gera automaticamente um **link de convite com prazo de validade**
3. O colaborador acessa o link, define sua senha e ingressa na empresa
4. Membership é criada com o papel e filiais definidos pelo gestor

#### 3.1.3 Seleção de empresa ativa

Usuários que pertencem a mais de uma empresa veem uma tela de seleção ao fazer login. A empresa ativa é armazenada em cookie de sessão e pode ser trocada a qualquer momento pelo menu no cabeçalho.

---

### 3.2 Dashboard — Painel Operacional

Ponto de entrada da plataforma após o login. Exibe um snapshot em tempo real da operação, com atualização automática a cada 60 segundos.

#### 3.2.1 Cards de KPIs

Quatro métricas principais no topo da tela, cada uma clicável (leva à lista de ordens filtrada):

| Métrica | O que mede | Destino ao clicar |
|---|---|---|
| Ordens de hoje | Total de ordens com data agendada = hoje | Lista com filtro de data |
| Em andamento agora | Ordens com status `in_progress` | Lista filtrada por status |
| Atrasadas | Ordens `in_progress` com horário já passado | Lista de atrasadas |
| Sem responsável | Ordens sem nenhum colaborador atribuído | Lista de não atribuídas |

#### 3.2.2 Barra de progresso do dia

Exibe graficamente as ordens do dia divididas em:
- **Planejadas** (total do dia)
- **Concluídas** (status `done`)
- **Em andamento** (status `in_progress`)
- **Restantes** (planejadas menos concluídas e em andamento)

A barra fica verde quando 100% das ordens do dia estão concluídas.

#### 3.2.3 Faixa de risco — Painéis de atenção

Chips clicáveis que aparecem apenas quando há itens de atenção. Expandem painéis com listas detalhadas:

| Chip | Critério |
|---|---|
| Atrasadas | Em andamento com horário passado |
| Deveriam ter iniciado | Agendadas com horário passado (não iniciadas) |
| Sem responsável | Sem nenhum colaborador atribuído |

Quando não há itens, o sistema exibe "Tudo sob controle por enquanto".

#### 3.2.4 Calendário mensal

- Navegação entre meses
- Dias com ordens marcados com dots coloridos:
  - **Vermelho** — há ordens atrasadas naquele dia
  - **Azul** — há ordens ativas (agendadas ou em andamento)
- Hoje destacado com fundo colorido
- Clicar em um dia exibe mini-agenda com até 5 ordens e link "Ver todas"

#### 3.2.5 Listas de ordens

| Lista | Critério | Limite |
|---|---|---|
| Execuções ao vivo | Status `in_progress`, ordenadas por horário | 5 itens |
| Ordens de hoje | Data = hoje, ordenadas por horário | 5 itens + link "Ver todas" |
| Próximas execuções | Agendadas com data futura | 3 itens |

#### 3.2.6 Ações rápidas

Botões de atalho para as operações mais comuns, visíveis apenas para administradores e proprietários:
- Criar nova ordem
- Adicionar novo cliente
- Convidar colaborador

#### 3.2.7 Visibilidade por papel no dashboard

| Papel | O que aparece no dashboard |
|---|---|
| Proprietário (owner) | Todas as ordens da empresa |
| Admin HQ | Todas as ordens da empresa |
| Admin com filiais | Ordens das filiais atribuídas + ordens atribuídas a si |
| Admin sem filial | Apenas ordens atribuídas diretamente a si |
| Colaborador | Apenas ordens atribuídas diretamente a si |

---

### 3.3 Ordens de Serviço

Módulo central da plataforma. Gerencia todo o ciclo de vida de um serviço, da criação à conclusão.

#### 3.3.1 Lista de ordens

**Filtros disponíveis:**
- Busca textual por título, cliente ou colaborador atribuído
- Data de início e data final (intervalo)
- Status (todas / agendada / em andamento / concluída / cancelada)
- Botão "Limpar filtros"

**Visualizações:**
- **Lista** — tabela com título, cliente, status, data de início e ações
- **Kanban** — colunas por status com cards arrastáveis

**Ordenação padrão:** data mais recente primeiro

**Paginação:** por página, com navegação anterior/próxima e contador total

#### 3.3.2 Criação e edição de ordens

**Campos disponíveis:**

| Campo | Obrigatoriedade | Notas |
|---|---|---|
| Título | Obrigatório | Descrição curta do serviço |
| Cliente | Obrigatório | Select com busca dinâmica |
| Endereço do cliente | Opcional | Habilitado apenas após selecionar cliente; lista endereços cadastrados |
| Filial | Opcional | Aparece apenas se a empresa tiver filiais criadas; preenchido automaticamente para usuários de filial única |
| Status | Obrigatório | Padrão: `Agendada` |
| Data e hora de início | Obrigatório | Campo datetime |
| Previsão de término | Opcional | Não pode ser anterior à data de início |
| Recorrência | Condicional | Habilitado via checkbox "É recorrente" |
| Equipe | Opcional | Multi-select de colaboradores com busca inline |
| Notas | Opcional | Texto livre |

**Validações:**
- Título e cliente são obrigatórios
- Previsão de término, se informada, deve ser posterior à data de início
- Endereço só pode ser selecionado após escolher um cliente

#### 3.3.3 Recorrência de ordens

Ao marcar uma ordem como recorrente, um modal de configuração oferece:

| Tipo | Parâmetros |
|---|---|
| Diária | Intervalo em dias |
| Semanal | Dias da semana selecionáveis |
| Mensal | Dia específico do mês |
| Anual | Data fixa no calendário |

#### 3.3.4 Atribuição de equipe

- Busca inline de colaboradores por nome
- Checkbox "Mostrar inativos" — exibe colaboradores desativados
- Checkbox "Permitir inativos na ordem" — autoriza salvar com colaboradores inativos atribuídos
- Colaboradores inativos são exibidos com estilo visual atenuado e badge "Inativo"
- Colaboradores atribuídos exibem badge "Atribuído" em verde

#### 3.3.5 Status e ciclo de vida

```
Agendada  →  Em andamento  →  Concluída
                          →  Cancelada
```

Cada mudança de status é registrada no histórico da ordem com o nome e e-mail do responsável pela alteração e o horário exato.

#### 3.3.6 Detalhe da ordem

Exibe:
- Status atual com badge visual e **botão de Alterar Status inline** (sem precisar voltar para a lista)
- Data/hora de início e previsão de término
- Dados completos do cliente e endereço com link de direções (Google Maps / Apple Maps / Waze)
- Equipe alocada com nome e e-mail de cada membro
- Notas da ordem (nota da ordem, nota do cliente, nota do endereço)
- **Seção de Fotos e Anexos** — grid de thumbnails com lightbox e gestão de arquivos (ver 3.3.8)
- Histórico de mudanças de status com responsável e horário

**Alterar Status na tela de detalhe:**
- O badge de status é clicável para colaboradores atribuídos à ordem e para administradores/proprietários
- Abre o mesmo modal de atualização disponível na lista: select de novo status, data/hora da alteração e nota opcional
- Ao salvar, a página é atualizada automaticamente e o novo status aparece refletido em tempo real

#### 3.3.7 Regras de visibilidade das ordens

| Situação | Quem pode ver |
|---|---|
| Ordem sem filial (legado) | Apenas HQ (Proprietário) |
| Ordem de filial X | Proprietário, Admin HQ, Admin da filial X |
| Ordem de filial X sem atribuição | Proprietário, Admin HQ, Admin da filial X (colaboradores não veem) |
| Ordem atribuída ao usuário | O próprio colaborador, independente da filial |
| Admin com filiais A+B, ordem de filial C atribuída a ele | O próprio admin (visível por atribuição) |

#### 3.3.8 Fotos e Anexos

Cada ordem de serviço pode ter até **20 arquivos anexados** (fotos ou documentos), permitindo documentar visualmente a execução do serviço — antes, durante e depois.

**Tipos de arquivo aceitos:**
- Imagens: JPEG, PNG, WebP, GIF
- Documentos: PDF
- Tamanho máximo por arquivo: **10 MB**

**Funcionalidades do grid de thumbnails:**
- Grade responsiva: 2 colunas em mobile, 4 colunas em desktop
- Overlay no rodapé de cada thumbnail com a **data de inserção** formatada no idioma do usuário
- Se o anexo tiver nota, ela é exibida truncada (1 linha) abaixo da data no thumbnail
- Botão de exclusão visível ao passar o cursor (ou sempre visível em dispositivos touch)

**Lightbox (visualização em tela cheia):**
- Clique no thumbnail abre a imagem em tela cheia com fundo escurecido
- Navegação entre imagens com setas (esquerda/direita) ou teclas de teclado `←` `→`
- Tecla `Esc` fecha o lightbox
- Exibe abaixo da imagem: **data de inserção** e **campo de nota editável**

**Campo de nota por anexo:**
- Qualquer membro com acesso à ordem pode adicionar ou editar a nota de um anexo
- Ativado clicando no texto da nota (ou no link "Adicionar nota" se ainda vazia)
- Edição inline com textarea e botões Salvar / Cancelar
- Atalho de teclado: `Enter` salva, `Esc` cancela
- A nota é salva via API (PATCH) sem recarregar a página

**Modal de confirmação de exclusão:**
- Ao clicar no ícone de exclusão de um thumbnail, abre um modal no padrão do app (não o `confirm()` nativo do browser)
- Exibe título, descrição do impacto ("arquivo removido permanentemente") e botões **Cancelar** / **Excluir** com spinner
- Layout mobile-friendly: desliza da parte inferior em telas pequenas, centralizado em desktop
- Após confirmar, o arquivo é removido do storage e da base de dados; o thumbnail desaparece da grade sem recarregar a página

---

### 3.4 Clientes

Cadastro completo dos clientes que serão referenciados nas ordens de serviço.

#### 3.4.1 Lista de clientes

- Busca por nome, e-mail, empresa ou telefone
- Avatar colorido gerado automaticamente com as iniciais do nome
- Foto personalizada opcional

#### 3.4.2 Criação e edição de clientes

**Campos disponíveis:**

| Campo | Obrigatoriedade |
|---|---|
| Nome | Obrigatório |
| Sobrenome | Opcional |
| Nome da empresa | Opcional |
| E-mail | Opcional |
| Telefone | Opcional |
| Endereços | Múltiplos (ver abaixo) |
| Notas | Opcional |
| Foto | Opcional (PNG/JPEG/WebP, máx. 5 MB) |

#### 3.4.3 Múltiplos endereços

Cada cliente pode ter um ou mais endereços cadastrados. Ao criar uma ordem, o operador escolhe qual endereço utilizar.

**Campos de endereço:**
- Tipo: residencial ou comercial
- Rótulo personalizado (ex: "Sede", "Filial Norte")
- Rua e número, complemento, cidade, estado, CEP, país
- Marcação de endereço principal (apenas um por cliente)
- Nota livre sobre o endereço

#### 3.4.4 Detalhe do cliente

- Dados de contato
- Lista de todos os endereços cadastrados
- Histórico de ordens de serviço vinculadas ao cliente

---

### 3.5 Colaboradores

Gerenciamento completo da equipe da empresa, incluindo o fluxo de convite, papéis e filiais.

#### 3.5.1 Lista de colaboradores

**Colunas exibidas:**
- Avatar + nome completo
- Cargo e escopo (ex: "Colaborador · Gol Hyannis")
- E-mail
- Status

**Badges de status:**
- **Verde "Ativo"** — colaborador com acesso ao sistema
- **Cinza "Inativo"** — acesso suspenso
- **Âmbar "Pendente"** — convite enviado, aguardando aceite

**Menu de ações por colaborador:**
- Ver detalhes
- Editar
- Ativar / Desativar (oculto para colaboradores com convite pendente)
- Excluir (disponível apenas quando inativo e sem ordens ativas atribuídas)

#### 3.5.2 Cadastro de colaborador

**Campos:**

| Seção | Campos |
|---|---|
| Foto | Upload de imagem (PNG/JPEG/WebP) |
| Dados pessoais | Nome (obrigatório), Sobrenome (obrigatório), Cargo |
| Contato | E-mail (obrigatório — usado para login), Telefone |
| Endereço | Rua, complemento, cidade, estado, CEP, país |
| Observações | Texto livre |
| Acesso | Papel (select), Filiais (checkboxes), Status ativo |

**Regras de visibilidade do campo de papel:**
- Proprietário vê todas as opções (Proprietário, Administrador, Colaborador)
- Admin HQ vê Administrador e Colaborador (não pode criar Proprietário)
- Admin de filial vê apenas Colaborador

**Regras de visibilidade do campo de filiais:**
- Aparece apenas se a empresa tiver filiais criadas
- Admin HQ pode selecionar qualquer combinação de filiais
- Admin de filial pode selecionar apenas as filiais às quais ele próprio está vinculado
- Seleção múltipla via checkboxes

Ao salvar, o sistema **gera automaticamente um link de convite** com prazo de 7 dias e exibe a tela de gerenciamento do convite.

#### 3.5.3 Sistema de convites

**Ciclo de vida do convite:**

```
Criado (pending)
  → Link copiado ou enviado por e-mail
  → Colaborador acessa o link
    → Aceito (accepted) — membership criada com papel e filiais definidos
    → Expirado (expired) — prazo de 7 dias excedido
    → Revogado (revoked) — gestor cancelou manualmente
```

**Painel de convite (na tela de detalhe do colaborador):**

| Estado | Ações disponíveis |
|---|---|
| Pendente | Gerar novo link / Revogar / Enviar por e-mail |
| Expirado | Gerar novo link |
| Revogado | Gerar novo link |
| Aceito | Mensagem informativa ("Colaborador com acesso ativo") — sem ações |

**Ao gerar novo link:**
- O convite anterior é revogado automaticamente
- As filiais e o papel definidos originalmente são preservados no novo convite
- O link é exibido na tela com botão de copiar (feedback visual de 2 segundos)

**Segurança:** o token do convite é armazenado como hash no banco de dados; o link nunca expõe o token em texto plano em respostas de API.

#### 3.5.4 Edição de colaborador

- Todos os campos do cadastro são editáveis
- **Alteração de e-mail:** exibe modal de confirmação alertando que o novo e-mail impacta o login; ao confirmar, o sistema atualiza também a conta de autenticação (`auth.users`)
- **Papel:** desabilitado quando o usuário está editando o próprio perfil
- **Filiais:** checkboxes com a seleção atual pré-marcada

#### 3.5.5 Detalhe do colaborador

**Seções exibidas:**
- Header com nome, papel + escopo, e-mail e badge de status
- Métricas: ordens alocadas / em andamento / concluídas
- Informações de contato (e-mail, telefone)
- **Filiais atribuídas** — chips por filial, ou "Empresa toda" (proprietário) / "Nenhuma filial atribuída" (admin sem filial)
- **Painel de convite** — gerenciamento do link de convite
- **Ordens alocadas** — tabela com título, status e data agendada de cada ordem em que o colaborador está atribuído

---

### 3.6 Filiais

Módulo de gerenciamento de unidades/filiais da empresa. Visível apenas para proprietários e administradores HQ.

#### 3.6.1 O que é uma filial

Uma filial representa uma unidade operacional da empresa (loja, escritório, canteiro de obras, etc.). Ao criar filiais, a empresa habilita:
- Segmentação de ordens de serviço por unidade
- Visibilidade segregada para cada gerente e equipe
- Relatórios e KPIs por filial no dashboard

#### 3.6.2 Listagem e gerenciamento

- Lista de filiais com nome, e-mail e botões de editar/excluir
- Badge "Inativa" para filiais desativadas
- Formulário inline de criação/edição com validação em tempo real

#### 3.6.3 Criação e edição de filiais

**Campos disponíveis:**

| Campo | Obrigatoriedade |
|---|---|
| Nome | Obrigatório |
| E-mail | Opcional |
| Telefone | Opcional |
| Endereço completo | Opcional (rua, cidade, estado, CEP, país) |
| Filial ativa | Checkbox (padrão: ativa) |

#### 3.6.4 Exclusão de filiais

Ao excluir uma filial, o sistema exibe aviso: "Ordens e colaboradores vinculados perderão a associação, mas não serão excluídos." Os dados históricos são preservados.

#### 3.6.5 Vinculação de colaboradores a filiais

Feita na tela de cadastro ou edição de colaboradores:
- Seleção múltipla via checkboxes
- Um colaborador pode pertencer a 1, 2 ou mais filiais simultaneamente
- Ao aceitar um convite, o colaborador já nasce com as filiais definidas pelo gestor

---

### 3.7 Configurações

Painel de configurações acessível pelo menu do usuário.

#### 3.7.1 Perfil da empresa

Visível para proprietários e administradores HQ.

**Campos editáveis:**

| Campo | Notas |
|---|---|
| Nome da empresa | Obrigatório |
| Setor | Cleaning / Handyman / Construction / Landscaping / Property Services / Other |
| E-mail | |
| Telefone | |
| Endereço completo | Rua, complemento, cidade, estado, CEP, país |
| Logo | PNG/JPEG/WebP, máx 5 MB; exibido no cabeçalho e documentos |

Ao salvar o logo, o cabeçalho da aplicação é atualizado em tempo real sem recarregar a página.

#### 3.7.2 Filiais

Link para o módulo de gerenciamento de filiais (seção 3.6). Redireciona colaboradores comuns para a página principal de configurações.

---

### 3.8 Mensagens

Sistema de comunicação interna entre membros da mesma empresa.

#### 3.8.1 Funcionalidades

- **Lista de conversas** — exibe todas as threads abertas com nome do interlocutor e prévia da última mensagem
- **Thread de mensagens** — chat em tempo real com histórico completo
- **Contador de não lidas** — badge vermelho no ícone de mensagens no cabeçalho, atualizado a cada 5 segundos e via Supabase Realtime
- **Marcar como lidas** — ao abrir uma conversa, todas as mensagens são marcadas como lidas automaticamente

#### 3.8.2 Regras de acesso

- Qualquer membro ativo da empresa pode enviar e receber mensagens
- Só é possível trocar mensagens com outros membros da mesma empresa
- Mensagens são privadas entre remetente e destinatário

---

### 3.9 Convites — Caixa de Entrada

Tela para usuários que receberam convites para ingressar em uma empresa.

#### 3.9.1 Fluxo in-app

Quando um convite é criado, o destinatário recebe uma notificação visual no cabeçalho (badge vermelho com contador). Ao clicar, é direcionado para a caixa de entrada de convites.

**Ações disponíveis:**
- **Aceitar convite** — ingressa na empresa com o papel e filiais definidos pelo gestor
- **Recusar convite** — remove o convite da caixa de entrada e o marca como lido

#### 3.9.2 Aceite via link

O colaborador também pode aceitar o convite acessando diretamente o link enviado. O fluxo:
1. Acessa o link (funciona em qualquer browser, incluindo modo incógnito)
2. Visualiza os dados da empresa e do convite
3. Se não tiver conta: define nome de usuário e senha para criar a conta
4. Se já tiver conta com o mesmo e-mail: faz login normalmente
5. Membership é criada automaticamente com as configurações definidas pelo gestor

---

## 4. Modelo de Dados

### 4.1 Visão geral das entidades

```
companies
  ├── branches (filiais)
  ├── company_memberships (vínculos de usuários)
  │     └── membership_branches (filiais do membro, N:N)
  ├── employees (perfil dos colaboradores)
  ├── customers (clientes)
  │     └── customer_addresses (endereços)
  ├── jobs (ordens de serviço)
  │     └── job_assignments (atribuições de equipe)
  ├── invites (convites pendentes/aceitos)
  ├── messages (mensagens internas)
  ├── user_notifications (notificações in-app)
  ├── job_events (log de eventos de ordens)
  └── order_status_events (histórico de status)
```

### 4.2 Tabelas principais

| Tabela | Descrição |
|---|---|
| `companies` | Dados da empresa (nome, setor, endereço, logo) |
| `branches` | Filiais/unidades da empresa |
| `employees` | Perfil dos colaboradores (nome, contato, avatar, endereço) |
| `company_memberships` | Vínculo usuário ↔ empresa com papel e status |
| `membership_branches` | Vínculo N:N membership ↔ filial (multi-filial) |
| `customers` | Clientes cadastrados na empresa |
| `customer_addresses` | Endereços dos clientes (múltiplos por cliente) |
| `jobs` | Ordens de serviço |
| `job_assignments` | Colaboradores atribuídos a cada ordem |
| `invites` | Convites com token, status, filiais e papel |
| `messages` | Mensagens entre membros da empresa |
| `user_notifications` | Notificações in-app por usuário |
| `job_events` | Log imutável de eventos das ordens |
| `order_status_events` | Histórico de mudanças de status com responsável |
| `job_attachments` | Arquivos anexados a ordens (fotos, documentos e notas) |
| `user_profiles` | Preferências do usuário (empresa ativa, app de navegação) |

### 4.3 Isolamento multi-tenant

Todas as tabelas com dados operacionais contêm a coluna `company_id`, que funciona como chave de isolamento. Nenhum dado de uma empresa é acessível por usuários de outra empresa — garantido tanto no nível da API quanto no nível do banco de dados via RLS.

### 4.4 Multi-filial

O suporte a múltiplas filiais por colaborador é implementado através de uma tabela de associação N:N (`membership_branches`). Isso permite que um mesmo colaborador seja vinculado a quantas filiais forem necessárias, sem limitações.

---

## 5. Segurança e Controle de Acesso

### 5.1 Autenticação

- Gerenciada pelo Supabase Auth (JWT)
- Login por e-mail e senha
- Sessão persistida via cookies HttpOnly
- Suporte a múltiplas empresas por usuário, com seleção via cookie de sessão

### 5.2 Row Level Security (RLS)

Todas as tabelas do banco de dados têm RLS habilitado. Nenhuma query SQL — mesmo de forma direta no banco — retorna dados que o usuário autenticado não tem permissão de ver.

As políticas de RLS cobrem:
- **SELECT** — visibilidade dos dados
- **INSERT** — criação de novos registros
- **UPDATE** — edição de registros existentes
- **DELETE** — remoção de registros

### 5.3 Funções SECURITY DEFINER

Para evitar recursão infinita em políticas de RLS que precisam consultar a própria tabela, o sistema utiliza funções SQL com `SECURITY DEFINER`. Estas funções rodam com privilégios elevados, mas estão rigorosamente restritas ao contexto do usuário autenticado (`auth.uid()`).

Funções principais:

| Função | O que faz |
|---|---|
| `user_is_hq(company_id)` | Retorna `true` apenas se o usuário é Proprietário sem filial vinculada |
| `user_can_access_branch(company_id, branch_id)` | Retorna `true` se o usuário tem acesso à filial especificada |
| `get_my_memberships()` | Retorna a lista de memberships ativas do usuário (papel, filiais, status) |
| `is_membership_assigned_to_job(job_id, membership_id)` | Verifica se uma membership está atribuída a uma ordem |
| `viewer_can_see_membership(company_id, branch_id)` | Verifica se o viewer tem permissão de ver uma membership específica |

### 5.4 Dupla camada de proteção

Além do RLS no banco, todas as operações críticas passam por validação na camada de API (Next.js Route Handlers). Exemplos:

- Verificação de papel antes de criar/editar ordens, colaboradores e filiais
- Verificação de escopo de filial antes de criar uma ordem para uma filial específica
- Guards de hierarquia ao promover colaboradores (não pode criar Admin HQ se não for Proprietário)
- Validação de e-mail obrigatório antes de criar ou editar colaboradores
- Verificação de que o usuário não está editando o próprio papel

Esta abordagem garante que, mesmo em casos de bug no frontend, nenhuma operação não autorizada será executada no servidor.

### 5.5 Segurança de convites

- Tokens de convite são armazenados exclusivamente como **hash SHA-256** no banco
- O link contém o token em texto plano apenas na URL (transmitido por HTTPS)
- Após o aceite, o token é invalidado e não pode ser reutilizado
- Convites possuem prazo de validade (7 dias); expirados são marcados automaticamente

---

## 6. Infraestrutura e Tecnologia

### 6.1 Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router, SSR + Client Components) |
| Linguagem | TypeScript (end-to-end) |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth (JWT + cookies HttpOnly) |
| Storage | Supabase Storage (avatares, logos, anexos de ordens) |
| Realtime | Supabase Realtime (mensagens, notificações) |
| Monorepo | pnpm workspaces |
| Deploy | Vercel |
| DNS / CDN | Cloudflare |

### 6.2 Arquitetura do aplicativo

O sistema segue o padrão **App Router** do Next.js 15, com separação clara entre:

- **Server Components** — carregam dados diretamente no servidor, sem chamadas de API adicionais; garantem tempo de carregamento inicial mínimo
- **Client Components** — interatividade, formulários, polling e atualização em tempo real
- **Route Handlers (API Routes)** — todos os endpoints de API, com autenticação, autorização e validação centralizadas

### 6.3 Ambientes separados

| Ambiente | URL | Propósito |
|---|---|---|
| Desenvolvimento | `app.geklix.com` | Equipe interna e testadores |
| Staging | `staging.geklix.com` | Clientes selecionados em validação controlada |
| Produção | (a definir) | Lançamento público |

Cada ambiente possui suas próprias variáveis de ambiente, banco de dados Supabase e projeto Vercel, garantindo isolamento completo.

### 6.4 Internacionalização (i18n)

O sistema suporta múltiplos idiomas via arquivos de tradução JSON. Idiomas disponíveis:
- Português Brasileiro (`pt-BR`) — idioma padrão
- Inglês (`en`)
- Espanhol (`es`)

A detecção de idioma é feita no servidor via cabeçalhos da requisição, com fallback para `pt-BR`.

### 6.5 Responsividade

A interface foi desenvolvida com abordagem **mobile-first**:

- **Desktop** — sidebar lateral colapsável, tabelas com colunas completas
- **Mobile** — barra de navegação inferior, colunas condensadas, FAB (botão de ação flutuante) para criação rápida
- Estado da sidebar persistido em `localStorage` por usuário

---

## 7. Roadmap

Funcionalidades planejadas para as próximas versões:

| Funcionalidade | Descrição |
|---|---|
| **Relatórios e exportações** | PDF de ordens, relatório de produtividade por colaborador, histórico por filial |
| **App móvel nativo** | iOS e Android com suporte offline |
| **Assinatura digital** | Confirmação de serviço executado pelo cliente diretamente no celular |
| **Integração com WhatsApp** | Notificação automática ao cliente sobre status da ordem |
| **Portal do cliente** | Acesso externo para o cliente acompanhar o andamento dos seus serviços |
| **Faturamento e orçamentos** | Geração de propostas e cobranças integradas à ordem |
| **Live tracking de equipes** | Mapa em tempo real com localização de cada colaborador, indicação de status (em trânsito / em execução) e histórico de percurso do dia |

---

*Documentação gerada em Março de 2026 — FieldVantage V1.1. Para informações adicionais, entre em contato com a equipe FieldVantage.*
