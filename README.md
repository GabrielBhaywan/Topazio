# Topázio

Sistema web de gestão empresarial multiempresa da RumoFalcão. Esta etapa implementa o início da administração de empresas, com controle de acesso pelo servidor e isolamento apoiado pelo Supabase RLS.

## Tecnologias

- Next.js 16 com App Router e TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, `@supabase/ssr` e RLS

## Pré-requisitos e execução

- Node.js 20.9 ou superior
- npm

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. As verificações locais são `npm run typecheck`, `npm run lint` e `npm run build`.

## Configuração

Configure `.env.local` sem versionar esse arquivo:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publishable, permitida no cliente.
- `SUPABASE_SECRET_KEY`: chave secreta, somente no servidor. Nunca use prefixo `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_SITE_URL`: origem da aplicação usada no link do convite, como `http://localhost:3000` em desenvolvimento.

O arquivo `.env.example` contém somente os nomes e um valor local não secreto para a URL do site. No Supabase, adicione `/auth/callback` às URLs de redirecionamento permitidas. Em produção, configure a URL HTTPS pública como Site URL e Redirect URL.

## Administração de empresas

Após aplicar a migração descrita em [supabase/migrations/20261030000100_admin_company_management.sql](supabase/migrations/20261030000100_admin_company_management.sql), usuários autenticados com perfil `rumofalcao_admin` podem abrir **Administrar empresas** no painel. O cadastro envia um convite de definição de senha; a conta criada recebe sempre `role = 'company_user'` e o vínculo com a nova empresa. A lista permite pesquisar, bloquear e reativar empresas.

Cada operação administrativa confirma a sessão e o perfil no servidor antes de carregar a chave secreta. A migração cria empresa e perfil em uma transação e limita a execução da função ao papel `service_role`. Políticas SELECT restritivas preservam as políticas existentes e ocultam o próprio perfil/empresa de uma conta enquanto ela estiver bloqueada.

Consulte [docs/admin-company-testing.md](docs/admin-company-testing.md) para a ordem de configuração e o roteiro de validação.

## Testes diagnósticos temporários

`/teste-login` e `/teste-conexao` permanecem disponíveis durante o desenvolvimento e retornam 404 em produção via `proxy.ts`. Não são necessários para a administração e devem ser removidos quando o diagnóstico terminar.

## Limitações desta etapa

- A migração SQL precisa ser aplicada manualmente; o código não altera o banco remoto.
- Convites dependem do serviço de e-mail e das URLs configuradas no Supabase.
- A criação usa compensação do usuário Auth se a transação pública falhar; falha de compensação é explicitamente sinalizada para suporte.
- Os módulos comerciais (produtos, pedidos e financeiro) continuam fora do escopo.

## Recuperação de senha

Na tela de login, **Esqueci minha senha** solicita um link pelo Supabase Auth. O callback valida o retorno e abre `/redefinir-senha`; a atualização só ocorre depois de confirmar a sessão do usuário. A mensagem após a solicitação é genérica para não revelar se um e-mail possui conta.

Em **Authentication > URL Configuration > Redirect URLs**, permita os retornos usados pela aplicação. Para desenvolvimento local, inclua `http://localhost:3000/auth/callback?next=%2Fredefinir-senha` e, para convites, `http://localhost:3000/auth/callback?next=%2Fdefinir-senha`. Em produção, configure as URLs equivalentes com a origem HTTPS real. Mantenha também a Site URL (`NEXT_PUBLIC_SITE_URL`) apontada para a origem correta. O modelo de recuperação precisa preservar o redirecionamento recebido (`{{ .RedirectTo }}` quando o modelo usar token hash); o callback aceita PKCE `code` e `token_hash` dos tipos `invite` e `recovery`.
