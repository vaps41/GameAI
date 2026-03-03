# GamePrice AI 🎮

Bem-vindo ao **GamePrice AI**, uma plataforma SaaS pronta para produção que analisa preços de jogos e fornece recomendações precisas de compra usando o poder da Inteligência Artificial (Google Gemini). Nunca mais pague mais caro por um jogo!

## 🚀 Demonstração ao Vivo

Acesse o aplicativo em funcionamento (Vercel):  
👉 **[https://game-ai-three.vercel.app/](https://game-ai-three.vercel.app/)**

### 🧪 Conta de Teste
Quer explorar as funcionalidades sem criar uma conta? Use nossas credenciais configuradas:
- **Email:** `test@gameprice.ai`
- **Senha:** `Test123456`
- **Plano:** Bronze (Acesso aos favoritos e análises expandidas)
> Basta clicar em "⚡ Quick Login with Test Account" na tela de Login!

---

## 📋 Funcionalidades Principais

- 🤖 **Análise com Inteligência Artificial:** Ao buscar um jogo (ex: Cyberpunk 2077), nossa integração com IA analisa o "Preço Cheio" (Retail) comparado ao "Menor Preço Histórico" (Historical Low) e ao "Preço Atual", definindo se você deve **COMPRAR (BUY)**, **ESPERAR (WAIT)** ou **PASSAR (PASS)**.
- 💡 **Economia Real (Savings):** O site calcula em tempo real o quanto você está economizando em cima do Valor Cheio do jogo original.
- ❤️ **Favoritos:** Salve os jogos que você deseja acompanhar e fique de olho nas quedas de preço (Exclusivo para assinantes).
- 🎁 **Jogos Gratuitos (Free Games Tracker):** Uma rota dedicada apenas para lhe informar de jogos 100% grátis ou com 100% de desconto no momento na Steam, Epic, GOG, etc.
- 🛒 **Planos e Assinatura (Stripe Integration):** Sistema de assinaturas robusto (Bronze, Silver, Gold, Diamond) gerenciando portal de pagamento, Webhooks, e limitador de pesquisas diárias integrado.

---

## 🛠 Tech Stack (Tecnologias Utilizadas)

### Frontend
- **HTML5 & Vanilla JavaScript** (Sem a complexidade de grandes frameworks, apenas rápido e limpo).
- **Tailwind CSS:** (Via CDN) para a construção bonita de UI e temas escuros focados no público gamer.

### Backend Severless (Vercel Node.js)
- **Node.js + Express:** API que serve o backend com arquitetura Serverless.
- **Vercel Functions:** As rotas são re-escritas para que as APIs (AI, API proxy) e a navegação estática convivam sem problemas através do `vercel.json` configurado.

### Database & Auth
- **Firebase Auth:** Controles de estado, Login Seguros (E-mail, Google).
- **Firestore (NoSQL):** Salvamento de histórico de análises, favoritação e checagem de plano e consumo do usuário.

### IA & APIs Externas
- **Google Generative AI (Gemini Flash/Pro):** Analisa a recomendação inteligente de compra no backend.
- **Stripe SDK:** Gerenciamento do Checkout do cartão e redirecionamento de Portal do Cliente.
- **CheapShark API e GamerPower API:** Buscadores de informações cruciais de preços, menor preço histórico de todas as lojas, e caçadores de jogos "na faixa".

---

## ⚙️ Como Instalar e Rodar na sua Máquina

### 1. Clonando o repositório
```bash
git clone https://github.com/SeuUsuario/gameprice-ai.git
cd gameprice-ai
```

### 2. Instalando Dependências do Backend
Como o projeto utiliza rotas locais servidas pelo Express para simular o backend e a inteligência das chamadas para a IA.
```bash
npm install
```

### 3. Configuração de Variáveis (Arquivo `.env`)
Você precisa criar o arquivo `.env` na raiz do seu projeto contendo exatamente essas variáveis (consiga as chaves dos respectivos portais - Stripe, Firebase e Google AI MakerSuite):
```env
PORT=3000
NODE_ENV=development
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
# Banco de Dados (Firebase)
FIREBASE_API_KEY=sua_chave_do_firebase
# Google Gemini
GEMINI_API_KEY=sua_chave_do_gemini
# APIs de Jogos (opcional)
ITAD_API_KEY=sua_chave_itad
```

### 4. Rodando Localmente
Use o comando baixo para rodar e visualizar todo seu ambiente de Desenvolvimento local (Frontend + Requisições HTTP simulando o Serverless):
```bash
npm start
# Ou
node app-server.js
```
Abra e navegue em `http://localhost:3000`

---

## 🚀 Publicando para a Produção (Vercel)
Esse projeto já está estritamente ajustado para rodar na Vercel (Hospedagem gratuita na nuvem). 

As rotinas e configurações já estão tratadas no arquivo de manifesto `vercel.json`. Ao mandar o código para a Vercel, o diretório e suas telas não irão gerar os temidos `Erro 404 Cannot GET/`.
A Vercel hospedará os conteúdos `.html` como estáticos virtuais, e levantará automaticamente as funções em `/api/*` pelo módulo `@vercel/node`.

**Passo a passo rápido:**
1. Crie uma nova aplicação no site [Vercel.com](https://vercel.com) com o seu Github linkado.
2. Em **"Settings -> Environment Variables"**, preencha exatamente as tags e senhas contidas no seu `.env` local. (A Vercel precisa para enxergar o processo!)
3. Faça o **Deploy**! A configuração cuidará de todo o servidor express (Não é necessário alterar arquivos `main` no seu package).

---

## 📝 Contato e Modificações
Desenvolvido focado em performance, conversão de usuários para compras (CTA's e Planos dinâmicos), e inteligência robusta de recomendações de preço utilizando arquitetura ágil M-SaaS.
Sinta-se à vontade para contribuir no repositório prestando forks, commits adicionais e pull requests!

🎮 Construído para gamers de todos os níveis que não querem desperdiçar nenhum real! Não jogue os seus bits fora!
