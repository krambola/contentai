# ContentAI — Central de Conteúdo com IA

Plataforma completa de gestão de conteúdo para redes sociais com inteligência artificial.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase** (Firestore + Storage + Auth)
- **Claude API** (análise SWOT, calendário, ideias, roteiros, radar, ações)
- **Together AI / FLUX** (geração de imagens)
- **jsPDF** (export de calendário em PDF)
- **Zustand** (estado global)

## Módulos

| # | Módulo | Status |
|---|--------|--------|
| 1 | Cadastro de Clientes | ✅ Completo |
| 2 | Banco de Produtos e Serviços | ✅ Completo |
| 3 | IA Analista (SWOT) | ✅ Completo |
| 4 | Calendário Automático | ✅ Completo |
| 5 | Gerador de Ideias | ✅ Completo |
| 6 | Gerador de Roteiros | ✅ Completo |
| 7 | Artes com IA (FLUX + editor) | ✅ Completo |
| 8 | Editor Visual (textos, cores, overlay) | ✅ Completo |
| 9 | Radar de Oportunidades | ✅ Completo |
| 10 | Próximas Ações | ✅ Completo |
| 11 | Biblioteca de Conteúdo | ✅ Completo |
| — | Autenticação (Firebase Auth + Google) | ✅ Completo |
| — | Export de Calendário em PDF | ✅ Completo |

## Setup em 5 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com suas credenciais:

**Firebase** → [console.firebase.google.com](https://console.firebase.google.com)
- Crie um projeto
- Ative Firestore Database
- Ative Storage
- Ative Authentication (Email/Password + Google)
- Copie as credenciais do SDK Web

**Claude API** → [console.anthropic.com](https://console.anthropic.com)
- Crie uma API key

**Together AI** → [api.together.xyz](https://api.together.xyz)
- Cadastro gratuito
- Plano free inclui FLUX.1-schnell-Free

### 3. Criar índices no Firestore

No console Firebase → Firestore → Índices → Criar índice composto:

| Coleção | Campos |
|---------|--------|
| `produtos` | `clienteId` ASC + `criadoEm` DESC |
| `calendario` | `clienteId` ASC + `mes` ASC + `ano` ASC + `data` ASC |
| `ideias` | `clienteId` ASC + `produtoId` ASC + `geradoEm` DESC |
| `roteiros` | `clienteId` ASC + `geradoEm` DESC |
| `analises` | `clienteId` ASC + `geradoEm` DESC |
| `alertas` | `clienteId` ASC + `geradoEm` DESC |
| `artes` | `clienteId` ASC + `geradoEm` DESC |
| `biblioteca` | `clienteId` ASC + `criadoEm` DESC |

> 💡 O Firestore mostra um link de erro no console para criar o índice automaticamente na primeira consulta. Aceite e aguarde 1-2 min.

### 4. Configurar domínio no Firebase Auth

No console Firebase → Authentication → Settings → Authorized domains:
- Adicione seu domínio Vercel: `seuapp.vercel.app`

### 5. Rodar

```bash
npm run dev
# ou em produção:
npm run build && npm start
```

## Deploy na Vercel

1. Suba o código no GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Adicione todas as variáveis de `.env.local` nas configurações do projeto
4. Clique em Deploy

Em ~2 minutos o sistema estará em `https://seuapp.vercel.app`.

## Estrutura

```
src/
├── app/
│   ├── api/              # Rotas server-side (Claude + Together AI)
│   │   ├── analise/
│   │   ├── calendario/
│   │   ├── ideias/
│   │   ├── roteiros/
│   │   ├── radar/
│   │   ├── acoes/
│   │   └── artes/        # NOVO: geração FLUX
│   ├── login/            # NOVO: página de autenticação
│   ├── dashboard/
│   ├── clientes/
│   ├── produtos/
│   ├── analise/
│   ├── calendario/       # + export PDF
│   ├── ideias/
│   ├── roteiros/
│   ├── artes/            # NOVO: editor completo
│   ├── radar/
│   ├── acoes/
│   └── biblioteca/
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx    # + logout
│   │   └── AppAuthGuard.tsx  # NOVO
│   └── modules/
├── lib/
│   ├── firebase/
│   ├── ai/
│   │   ├── claude.ts
│   │   └── images.ts     # NOVO: prompts + Together AI
│   ├── auth/
│   │   └── AuthContext.tsx   # NOVO
│   ├── pdf/
│   │   └── exportCalendario.ts  # NOVO
│   ├── store.ts
│   └── utils.ts
└── types/
    └── index.ts          # + tipo Arte
```
