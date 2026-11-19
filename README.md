# Urban Risk Intelligence Platform

Plataforma integrada de monitoramento, análise e priorização de riscos cotidianos em áreas urbanas (**alagamentos**, **ilhas de calor** e **interrupções de serviços essenciais**), composta por API REST em **Java / Spring Boot** e aplicativo mobile em **React Native (Expo)** no mesmo repositório.

---

## Integrantes do Grupo

| Nome Completo | RM |
| :--- | :--- |
| **Bruno Seidi Ferreira Takaya** | 554986 |
| **Iury Cardoso Araujo** | 558850 |
| **Jhonatan Lopes Da Silva** | 559174 |

---

## Arquitetura e Recursos Implementados

* **Backend (`backend/`)**:
  * Arquitetura em camadas (`controller`, `service`, `repository`, `model`, `dto`, `config`).
  * Banco de dados **H2** persistido em arquivo (`backend/data/urbanriskdb.mv.db`) com carga inicial automática (`DatabaseSeeder`).
  * **Motor Analítico de Priorização (`AlertPrioritizationService`)**: calcula um score de `0` a `100` ponderando severidade (`1..5`), confiabilidade da fonte (`SENSOR`, `BASE_PUBLICA`, `REGISTRO_COMUNITARIO`) e bônus de recorrência espaço-temporal no mesmo bairro na última 1 hora.
  * **Ingestão Multiorigem e Simulação IoT (`IngestionController` & `SensorSimulatorService`)**: endpoints dedicados para sensores, bases públicas e relatos comunitários, além de telemetria simulada periódica.
  * **Proteção de Dados Pessoais (LGPD)**: identificadores opcionais enviados por moradores são convertidos em hash **SHA-256** antes da persistência e nunca são expostos nos DTOs de resposta.

* **Frontend Mobile (`mobile/`)**:
  * **Painel de Acompanhamento**: indicadores em tempo real (ocorrências ativas, alertas críticos, confiança média e bairro mais afetado) e atalhos por categoria.
  * **Eventos & Mapa Urbano**: lista filtrável por tipo de risco e visualização em mapa setorial georreferenciado, exibindo origem e nível de confiança de cada registro, além de encerramento de ocorrências por agentes locais.
  * **Registro Comunitário**: formulário acessível para moradores reportarem riscos na região.
  * **Resiliência Offline**: sincronização contínua a cada 5 segundos com tratamento de falhas de rede, mantendo os dados em tela e alertando o usuário caso o servidor fique indisponível, com reconexão automática.

---

## Pré-requisitos

* **Java 17** (JDK 17+)
* **Node.js 18+** e **npm**

---

## Como Executar o Backend (Spring Boot)

1. Acesse a pasta do backend:
   ```bash
   cd backend