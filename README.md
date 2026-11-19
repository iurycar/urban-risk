# Urban Risk Intelligence Platform

Plataforma integrada de monitoramento, análise e priorização de riscos cotidianos em áreas urbanas (**alagamentos**, **ilhas de calor** e **interrupções de serviços essenciais**), composta por API REST em **Java 17 / Spring Boot** e aplicativo mobile em **React Native (Expo)** entregues em um único repositório.

---

## Integrantes do Grupo

| Nome Completo | RM |
| :--- | :--- |
| **Bruno Seidi Ferreira Takaya** | 554986 |
| **Iury Cardoso Araujo** | 558850 |
| **Jhonatan Lopes Da Silva** | 559174 |

---

## Arquitetura e Recursos Implementados

* **Backend (`solution/`)**:
  * **Arquitetura em Camadas**: organizado em `controller`, `service`, `repository`, `model`, `dto` e `config`.
  * **Persistência em H2 (`solution/data/urbanriskdb.mv.db`)**: banco de dados embarcado persistido em arquivo no repositório, já populado com dados iniciais via `DatabaseSeeder`.
  * **Motor Analítico de Priorização (`AlertPrioritizationService`)**: calcula um score de `0` a `100` ponderando severidade (`1..5`), confiabilidade e peso institucional da origem (`SENSOR`, `BASE_PUBLICA`, `REGISTRO_COMUNITARIO`) e bônus de recorrência espaço-temporal no mesmo bairro na última 1 hora.
  * **Ingestão Multiorigem e Simulação IoT (`IngestionController` & `SensorSimulatorService`)**: endpoints dedicados para sensores, bases públicas e relatos comunitários, além de geração periódica simulada de eventos em tempo real.
  * **Proteção de Dados Pessoais (LGPD)**: identificadores opcionais enviados por moradores são convertidos em hash **SHA-256** irreversível antes da persistência e nunca são expostos nos DTOs públicos.

* **Frontend (`mobile/`)**:
  * **Painel de Acompanhamento (`DashboardScreen`)**: indicadores consolidados em tempo real (ocorrências ativas, alertas críticos, confiança média e bairro mais afetado), atalhos por categoria e top 3 alertas prioritários.
  * **Eventos & Mapa Urbano (`EventListScreen`)**: lista filtrável por tipo de risco e visualização em mapa setorial georreferenciado, exibindo origem, nível de confiança e encerramento de ocorrências por agentes locais.
  * **Registro Comunitário (`ReportFormScreen`)**: formulário acessível para moradores reportarem ocorrências urbanas na sua região.
  * **Resiliência e Disponibilidade (`useRealtimeAlerts`)**: sincronização automática a cada 5 segundos com tratamento de timeout e falhas de rede, mantendo os últimos dados em tela e alertando o usuário caso o servidor fique indisponível, com recuperação automática ao reconectar.

---

## Estrutura do Repositório

```text
urban-risk/
├── solution/                  # API REST Java 17 + Spring Boot + H2
│   ├── data/
│   │   └── urbanriskdb.mv.db # Arquivo do banco H2 com dados de teste
│   └── src/
│       ├── main/java/global/solution/
│       └── test/java/global/solution/
├── mobile/                   # Aplicativo React Native (Expo + TypeScript)
│   ├── App.tsx
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       ├── services/
│       └── types/
└── README.md
```

---

## Pré-requisitos

* **Java 17** (JDK 17 ou superior)
* **Node.js 18+** e **npm**

---

## Como Executar o Backend (Spring Boot)

1. Acesse a pasta do backend:
   ```bash
   cd backend
   ```
2. Execute os testes unitários:
   ```bash
   ./mvnw test
   ```
3. Inicie a aplicação na porta `8080`:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Endpoints principais disponíveis em `http://localhost:8080`:
   * `GET /api/alerts/dashboard` — Resumo consolidado e alertas ordenados por prioridade
   * `GET /api/alerts?category=ALAGAMENTO` — Listagem filtrada por categoria (`ALAGAMENTO`, `ILHA_CALOR`, `INTERRUPCAO_SERVICO`)
   * `GET /api/alerts/health` — Verificação de disponibilidade da API
   * `POST /api/events/sensor` — Ingestão de dados de sensores IoT
   * `POST /api/events/public-base` — Ingestão de bases públicas oficiais
   * `POST /api/events/community` — Registro comunitário (com anonimização LGPD)
   * `POST /api/events/simulate-now` — Dispara leitura imediata do simulador IoT
   * `PATCH /api/events/{id}/resolve` — Marca ocorrência como resolvida

---

## Como Executar o Aplicativo Mobile (React Native / Expo)

1. Em um segundo terminal, acesse a pasta `mobile`:
   ```bash
   cd mobile
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor Expo:
   ```bash
   npx expo start
   ```
4. Pressione **`w`** no terminal para abrir diretamente no navegador (`http://localhost:8081`) ou escaneie o QR Code no aplicativo **Expo Go** (caso utilize dispositivo físico, ajuste `DEFAULT_HOST` em `mobile/src/services/api.ts` para o IP local da máquina).

---