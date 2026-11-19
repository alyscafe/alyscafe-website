# alys.cafe ☕🐰

> **Mesa digital e website pessoal de Alysia Germani**  
> Estudante de Ciência da Computação (Unisinos) · Ex-Bolsista de Iniciação Científica CNPq em Inteligência Artificial  
> Foco: **Primeiro Estágio em Tecnologia da Informação** na Grande Porto Alegre e em qualquer lugar do mundo

---

## 🎯 Sobre o Projeto

O `alys.cafe` foi concebido como um ambiente de trabalho digital acolhedor com temática de café ("Mesa Digital"). Cada seção do portfólio funciona como uma janela interativa posicionada sobre a mesa de trabalho, permitindo arrastar, focar, fechar, reabrir pela dock inferior e organizar automaticamente em colunas ("arrumar a mesa").

Este projeto segue a tese de que **o site é portfólio duas vezes**: pelo conteúdo que apresenta e pela qualidade técnica de sua própria construção.

---

## ☕ Decisões Arquiteturais e de Engenharia

### 1. Zero Build Step & Zero Dependências
- Construído com **HTML5 Semântico**, **CSS3 Moderno** e **Vanilla JavaScript (ES6+)**.
- Carregamento instantâneo (pontuação máxima no Google Lighthouse em Performance, Acessibilidade e SEO).
- Sem complexidade de build ou dependências frágeis: roda nativamente em qualquer navegador e hospeda sem atrito no GitHub Pages, Vercel, Netlify ou Cloudflare Pages.

### 2. Design System & Identidade Visual
- **Tipografia:** Google Fonts **Caprasimo** (títulos orgânicos e com personalidade) e **Figtree** (leitura clara e moderna para corpo de texto).
- **Temas integrados:**
  - `dia`: Paleta pergaminho / café com leite suave (`#f5ead8`, `#ebddc5`, terracota `#c67139`).
  - `cafe`: Dark roast aconchegante (`#241a13`, `#33261c`, caramelo `#e2a068`).
  - Persistência automática da preferência do usuário no `localStorage`.
- **Animações fluidas:** Vapor animado na xícara de café, movimento orgânico suave no fundo e transições de elevação nas janelas.
- **Assinatura pessoal sutil:** Logotipo e favicon vetorial integrando a xícara de café às orelhinhas da coelhinha.

### 3. Gerenciador de Janelas da Mesa Digital
- Sistema interativo de janelas com arraste via `PointerEvents` (compatível com mouse e touch).
- Controle dinâmico de sobreposição (`z-index`) e foco ativo.
- **"Arrumar a mesa":** Algoritmo de auto-organização em colunas responsivas:
  - Mobile (< 820px): 1 coluna fluida
  - Tablet (820px – 1320px): 2 colunas
  - Desktop (> 1320px): 3 colunas harmoniosas

### 4. Suporte Bilíngue Nativo (PT / EN) & Detecção Automática
- Detecção automática do idioma do navegador (`js/lang.js` no `<head>`, antes da pintura inicial): navegadores em português abrem em `PT`; qualquer outro idioma abre em `EN`.
- Alternância instantânea de idioma com seletores declarativos em CSS (`[data-lang="pt"]` e `[data-lang="en"]`), persistência da escolha explícita no `localStorage` e propagação do idioma via `?lang=pt|en` para a página de currículo (`/curriculo`).

### 5. Currículo Otimizado para ATS, IAs de Triagem e Recrutadores
- Página interativa em `curriculo.html` (`/curriculo`) e arquivos PDF compilados em **1 página A4** e **fluxo linear de 1 coluna** (`curriculo.pdf` em português e `resume-en.pdf` em inglês).
- Estrutura sem colunas paralelas nas seções de conteúdo, garantindo que parsers de ATS e IAs de triagem (Gupy, Kenoby, Workday, Greenhouse) extraiam 100% dos campos na ordem exata, sem misturar linhas.

---

## 📁 Estrutura do Repositório

```text
alyscafe-website/
├── index.html        # Página principal com a mesa de trabalho e todas as janelas
├── curriculo.html    # Currículo ATS estruturado em 1 coluna (HTML para visualização/impressão)
├── curriculo.pdf     # Currículo ATS compilado em Português (1 página, texto 100% extraível)
├── resume-en.pdf     # Currículo ATS compilado em Inglês (1 página, texto 100% extraível)
├── favicon.svg       # Favicon vetorial com a coelhinha e a xícara de café
├── css/
│   └── style.css     # Design tokens, temas dia/cafe, layout, dock e animações
├── js/
│   ├── lang.js       # Detecção de idioma do navegador, persistência e sincronização de links
│   └── app.js        # Gerenciador de janelas, temas, idiomas, relógio e toasts
├── .gitignore        # Exclusão de notas pessoais (Contexto/) e temporários
└── README.md         # Documentação e decisões do projeto
```

---

## 🚀 Como Executar Localmente

Como o projeto é estático e puro, você pode abri-lo de várias formas:

### Opção 1: Abrir diretamente no navegador
Basta abrir o arquivo `index.html` em qualquer navegador moderno.

### Opção 2: Servidor local simples
Se tiver Python ou Node instalado:
```bash
# Com Python 3
python -m http.server 3000

# Com Node / npx
npx serve .
```
Acesse `http://localhost:3000`.

---

## 📦 Padrão de Versionamento

Este repositório utiliza rigorosamente o padrão **Conventional Commits**:
- `feat`: Novas funcionalidades e componentes de interface.
- `chore`: Configurações de repositório e infraestrutura (ex.: `.gitignore`).
- `docs`: Atualizações de documentação.
- `style`: Ajustes cosméticos e de folha de estilos.
- `fix`: Correções de bugs ou alinhamentos.

---

## ☕ Contato

- **Website:** [alys.cafe](https://alys.cafe)
- **E-mail:** [oi@alys.cafe](mailto:oi@alys.cafe)
- **LinkedIn:** [linkedin.com/in/alys-muni](https://linkedin.com/in/alys-muni)
- **GitHub:** [github.com/alyscafe](https://github.com/alyscafe)
- **Lattes:** [lattes.cnpq.br/5102566330101906](http://lattes.cnpq.br/5102566330101906)
- **ORCID:** [orcid.org/0009-0005-5597-1001](https://orcid.org/0009-0005-5597-1001)
