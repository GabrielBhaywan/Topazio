# Relatório — Projeto Topázio: administração e segurança multiempresa

**Data e hora:** 30/10/2026 às 15:15 (America/Fortaleza)
**Escopo:** implementação da administração de empresas e proteção de acesso no projeto Next.js com Supabase, além das verificações locais realizadas nesta etapa.

## 1. Objetivo

Foi preparada a base para que um usuário administrador da plataforma gerencie empresas e convide seus primeiros usuários, enquanto o acesso ao painel e os dados são limitados por autenticação, perfil e estado da empresa.

## 2. Implementações realizadas

### Autenticação, autorização e proteção de rotas

- `proxy.ts`: atualiza/verifica a sessão do Supabase e protege as rotas do painel. Consulta o perfil e considera a empresa vinculada e seu estado antes de permitir o acesso. Redireciona usuários sem sessão, perfil reconhecido ou empresa ativa conforme o fluxo implementado. As rotas da API fazem sua própria autorização; o proxy não é a única barreira.
- `lib/admin-auth.ts`: concentra a verificação, no servidor, de que a sessão pertence a um administrador da plataforma (`rumofalcao_admin`) sem empresa associada.
- `app/painel/page.tsx`: ajustada para diferenciar o acesso administrativo do fluxo de usuário de empresa.
- `app/auth/callback/route.ts`: troca o código de autenticação recebido no callback do Supabase e encaminha o fluxo de convite.
- `app/definir-senha/page.tsx` e `app/definir-senha/set-password-form.tsx`: adicionam a tela e o formulário para definir senha após o convite.

### Administração de empresas

- `app/painel/empresas/page.tsx` e `app/painel/empresas/companies-manager.tsx`: página e interface para listar empresas, cadastrar uma empresa com o e-mail do primeiro usuário e alterar o estado de uma empresa.
- `app/api/admin/companies/route.ts`: endpoint para listar empresas e criar uma empresa/iniciar o convite do usuário. Valida a origem da requisição e exige autorização administrativa.
- `app/api/admin/companies/[id]/route.ts`: endpoint para atualizar o estado da empresa, também protegido por autorização administrativa.
- A criação usa o convite de usuário do Supabase e uma função SQL transacional para inserir empresa e perfil com papel `company_user`. Se houver falha depois do convite, o código verifica o resultado da operação e tenta remover somente o usuário recém-convidado quando apropriado; falhas de compensação são comunicadas para investigação.
- O cliente administrativo é utilizado somente no servidor e após autorização. As consultas de listagem usam o cliente autenticado sujeito às políticas de acesso.

### Cliente administrativo e banco de dados

- `lib/supabase-admin.ts`: cliente servidor do Supabase com chave secreta, sem persistência ou renovação automática de sessão no cliente administrativo, e marcado como exclusivo do servidor.
- `supabase/migrations/20261030000100_admin_company_management.sql`: migração com políticas restritivas para impedir que usuários de empresas bloqueadas consultem o perfil próprio ou a empresa, além da função transacional de criação. A função é restrita ao papel `service_role`; não remove políticas nem dados existentes.
- A chave secreta não deve ser prefixada com `NEXT_PUBLIC_` nem exposta ao navegador.

### Configuração e documentação

- `.env.example`: atualizado para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e inclui `SUPABASE_SECRET_KEY` e `NEXT_PUBLIC_SITE_URL` como variáveis esperadas.
- `README.md`: atualizado com orientação de configuração e execução.
- `docs/admin-company-testing.md`: contém roteiro de validação manual, inclusive convites, autorização, bloqueio/reativação, isolamento entre empresas e falhas parciais.
- `eslint.config.mjs`: atualizado para a configuração Flat Config compatível com a versão atual do Next.js/ESLint usada no projeto.

## 3. Arquivos alterados e criados

**Alterados:** `.env.example`, `README.md`, `app/page.tsx`, `app/painel/page.tsx`, `eslint.config.mjs`, `lib/supabase-admin.ts` e `proxy.ts`.

**Criados:** `lib/admin-auth.ts`, `app/api/admin/companies/route.ts`, `app/api/admin/companies/[id]/route.ts`, `app/auth/callback/route.ts`, `app/definir-senha/page.tsx`, `app/definir-senha/set-password-form.tsx`, `app/painel/empresas/page.tsx`, `app/painel/empresas/companies-manager.tsx`, `supabase/migrations/20261030000100_admin_company_management.sql` e `docs/admin-company-testing.md`.

O arquivo `.env.local` não foi alterado e valores de credenciais não foram incluídos neste relatório.

## 4. Verificações executadas

- `npm run typecheck`: concluído com sucesso na execução final.
- `npm run lint`: concluído com sucesso na execução final.
- `npm run build`: concluído com sucesso; o Next.js reconheceu o proxy e gerou as rotas da API administrativa, callback, definição de senha, painel e gerenciamento de empresas.
- `git diff --check`: sem erros de espaços em branco. O Git emitiu avisos de conversão de finais de linha LF/CRLF, sem falha no comando.
- Foi verificado que o valor da chave secreta configurada não aparece nos arquivos estáticos produzidos em `.next/static`. A cadeia genérica `sb_secret_` encontrada no bundle pertence à validação de tipos de chave do SDK, não é o valor da credencial.
- Durante os ajustes, uma primeira execução do lint apontou incompatibilidade na configuração antiga do ESLint, corrigida no `eslint.config.mjs`. A verificação de tipos também apontou inicialmente um uso incorreto do retorno de `getClaims()` no proxy; o acesso às claims foi corrigido. As execuções finais passaram.

## 5. Pendências e validações ainda necessárias

1. **Aplicar a migração no Supabase:** a migração SQL foi criada, mas não foi executada no banco remoto. Aplicá-la pelo mecanismo de migrações adotado pelo projeto ou pelo SQL Editor do projeto Supabase, depois de revisar o conteúdo.
2. **Configurar `NEXT_PUBLIC_SITE_URL`:** a variável não está configurada no `.env.local` atual. Para desenvolvimento, definir `http://localhost:3000`; em produção, usar a URL HTTPS real do site. Reiniciar o servidor após alterar variáveis.
3. **Configurar convites no Supabase:** revisar a URL de redirecionamento permitida para `/auth/callback` e a configuração de SMTP/modelo de e-mail. O recebimento e a conclusão de um convite real ainda não foram testados.
4. **Executar o roteiro manual:** não foram feitos testes de integração com o Supabase remoto nem testes reais de autorização, isolamento RLS, bloqueio/reativação ou falhas parciais. Seguir `docs/admin-company-testing.md`, de preferência em ambiente de teste, antes de disponibilizar a funcionalidade.
5. **Verificar os papéis e dados existentes:** confirmar no Supabase se o usuário administrador tem `profiles.role = 'rumofalcao_admin'` e `company_id = NULL`, e se os nomes/tipos das colunas e políticas atuais correspondem às premissas da migração.
6. **Revisar as páginas de diagnóstico:** `/teste-login` e `/teste-conexao` continuam no projeto para diagnóstico local. Removê-las quando não forem mais necessárias. O proxy as restringe em produção conforme a implementação atual.
7. **Tabelas futuras:** tabelas comerciais ainda não fazem parte desta implementação. Ao criá-las, definir políticas RLS que também impeçam leitura/escrita por empresas inativas e garantam isolamento entre empresas.
8. **Finais de linha:** o Git avisou que alguns arquivos LF poderão ser convertidos para CRLF em futuras operações; não impediu as verificações.

## 6. Observações

- O build local comprova compilação e geração das rotas; não comprova funcionamento de configuração externa, entrega de e-mail ou comportamento das políticas no banco remoto.
- A variável `SUPABASE_SECRET_KEY` está configurada no ambiente local segundo a verificação feita, mas seu conteúdo foi deliberadamente omitido. Não compartilhar essa chave em mensagens, código de cliente ou repositório.
- A configuração de produção ainda requer URL pública correta e validação no projeto Supabase correspondente.
- O estado do repositório inclui outras alterações e arquivos não rastreados do trabalho; este relatório descreve a implementação, mas não afirma que houve commit ou publicação.

## Versão resumida

Foi implementada a base de administração multiempresa: proteção do painel, verificação do papel administrativo, cadastro e bloqueio/reativação de empresas, convite do primeiro usuário, definição de senha, endpoints protegidos, cliente administrativo servidor, migração SQL e documentação. As verificações locais finais de tipos, lint e build passaram. Ainda falta aplicar a migração no Supabase, configurar `NEXT_PUBLIC_SITE_URL` e os redirecionamentos/e-mails, e executar testes manuais de integração e RLS antes de liberar a funcionalidade.

# Adendo — investigação do convite e definição de senha

**Data e hora:** 30/10/2026 às 22:22 (America/Fortaleza)
**Escopo:** análise do retorno do convite Supabase, persistência da sessão no callback e submissão da nova senha. Este adendo complementa o relatório anterior.

## Investigação e causa identificada

- `app/api/admin/companies/route.ts` envia o convite por `admin.auth.admin.inviteUserByEmail` com `redirectTo` para `/auth/callback?next=%2Fdefinir-senha`. Portanto, quando o Supabase respeita essa URL, o destino esperado após a confirmação é `/definir-senha`.
- O callback anterior só aceitava o parâmetro `code` e executava `exchangeCodeForSession`. Quando o link/template de convite entrega o formato `token_hash` (com `type=invite`), ou não entrega os parâmetros que esse callback espera, o fluxo terminava no erro genérico. Essa incompatibilidade é uma causa plausível e diretamente tratável no código.
- O repositório não contém o link real recebido nem a configuração do modelo de e-mail do Supabase. Assim, não foi possível confirmar qual formato específico o convite enviado ao usuário usou. O fluxo PKCE de servidor retorna `code`; templates de e-mail configurados para verificação no servidor podem enviar `token_hash` e `type`. Um fluxo implícito que entregue tokens no fragmento da URL também não é processável por um Route Handler, pois o fragmento não é enviado ao servidor.
- `lib/supabase-server.ts` usa `createServerClient` de `@supabase/ssr`, lê cookies com a API assíncrona `cookies()` do Next.js e grava os cookies da sessão com `cookieStore.set` em `setAll`. Em Route Handlers do Next.js 16, essa API permite escrever cookies na resposta. Portanto, a implementação atual consegue persistir a sessão do callback; não foi identificada uma falha estrutural de cookies. O `catch` existente evita erros em contextos somente de leitura, mas pode ocultar uma falha de gravação; o callback executado como Route Handler é um contexto gravável.

## Correções feitas

- `app/auth/callback/route.ts` agora aceita o código PKCE por `exchangeCodeForSession(code)` e, alternativamente, um `token_hash` somente quando `type=invite`, validado por `verifyOtp`.
- O `next` continua validado contra caminhos locais, bloqueando URLs externas, caminhos iniciados por `//` e barras invertidas. Se estiver ausente ou for inválido, o destino seguro padrão passou a ser `/definir-senha`.
- O servidor registra apenas a categoria do problema e campos técnicos não secretos (`code`/`status` do erro, ou presença dos parâmetros). Não registra código de autenticação, token hash, URL completa, senha, e-mail ou chave secreta. A mensagem para o navegador continua genérica.
- `app/definir-senha/set-password-form.tsx` confirma a sessão com `auth.getUser()` antes de chamar `auth.updateUser({ password })`. Se a sessão tiver expirado ou estiver ausente, informa que o link precisa ser aberto novamente; erros ao atualizar a senha e falhas de conexão continuam tratados sem expor detalhes internos.
- Não houve alteração no banco ou na migração, criação de usuário/empresa, envio de convite, nem modificação da autorização administrativa, do proxy ou das políticas de isolamento entre empresas.

## Verificações desta etapa

- `npm run typecheck`: passou (código de saída zero).
- `npm run lint`: passou (código de saída zero).
- `npm run build`: passou. O Next.js compilou o projeto, concluiu verificação de TypeScript, gerou as páginas e incluiu `/auth/callback` e `/definir-senha` na saída.
- O build atualizou `next-env.d.ts` automaticamente; a alteração gerada foi restaurada para o estado anterior ao build.
- A variável `NEXT_PUBLIC_SITE_URL` está definida no `.env.local` (foi verificada somente sua presença, sem ler ou exibir seu valor). O usuário também informou que a URL de redirecionamento local foi autorizada no Supabase; essa configuração remota não foi inspecionada por esta sessão.

## Pendências e observações

- Não foi aberto nem validado um convite real, e não houve autenticação contra o Supabase remoto. Logo, não afirmo que a aceitação do convite foi testada com sucesso.
- Conferir o modelo **Invite user** no Supabase. Com o modelo padrão usando `{{ .ConfirmationURL }}`, confirmar que após a verificação o redirecionamento chega ao callback com `code`. Se o modelo estiver configurado para servidor, direcionar o link com `token_hash` e `type=invite` ao callback. Não usar um modelo que dependa de access token no fragmento para esse callback servidor.
- Como `code` PKCE é de uso único e temporário, testar com um convite novo somente quando a administração decidir fazê-lo; esta alteração não solicita nem dispara convites automaticamente.
- Após teste real autorizado, confirmar no navegador a presença de cookie de sessão (sem copiar seu valor), o acesso a `/definir-senha`, atualização de senha e encaminhamento ao painel. A autorização do painel e o isolamento por empresa permanecem protegidos pelos controles existentes e não foram revalidados contra o banco remoto.

## Versão resumida

O callback aceitava somente `code`, enquanto links/templates de convite podem chegar como `token_hash`/`type=invite`; o link real e o template remoto não estavam disponíveis para confirmar qual formato causou o erro. Agora o callback valida os dois formatos, preserva a validação de `next`, grava diagnóstico seguro e encaminha ao formulário de senha. O formulário verifica a sessão antes de atualizar a senha. O cliente SSR existente pode gravar cookies em Route Handler do Next.js. Typecheck, lint e build passaram. Falta testar um convite real e confirmar o modelo de e-mail no Supabase; nenhum teste remoto foi declarado como concluído.

# Adendo — análise de recuperação de senha da conta de teste

**Data e hora:** 31/10/2026 às 15:04 (America/Fortaleza)
**Escopo:** verificar se a conta de teste existente pode definir uma nova senha por recuperação de e-mail, identificar o que falta no aplicativo e registrar o procedimento recomendado.

## 1. Objetivo

Determinar se o Topázio já oferece recuperação de senha por e-mail e se essa alternativa pode ser usada pela conta de teste já confirmada no Supabase, sem recriar usuário ou empresa.

## 2. Arquivos e fluxos analisados

- `app/login-form.tsx`: formulário atual permite entrar com e-mail e senha. Não oferece ação para solicitar redefinição.
- `app/page.tsx`: exibe o formulário de login e mensagens de erro; não contém fluxo de recuperação.
- `app/auth/callback/route.ts`: aceita retorno PKCE pelo parâmetro `code`, trocando-o por sessão; também aceita `token_hash` quando `type=invite`. Atualmente não trata `type=recovery` para o formato de token hash.
- `app/definir-senha/page.tsx`: exige usuário autenticado via `auth.getUser()` e apresenta a página de definição de senha, com texto associado ao convite.
- `app/definir-senha/set-password-form.tsx`: confirma a sessão com `auth.getUser()` antes de executar `auth.updateUser({ password })`. A alteração é aplicada à identidade da sessão atual, sem receber ID de outro usuário.
- `lib/supabase-client.ts`: cria o cliente Supabase no navegador com `createBrowserClient`.
- `lib/supabase-server.ts`: cria o cliente SSR com `createServerClient` e cookies do Next.js para compartilhar a sessão entre navegador e servidor.
- `lib/supabase.ts`, `proxy.ts` e `app/api/admin/companies/route.ts`: examinados como fluxos relacionados; não implementam recuperação de senha.

## 3. Conclusão

O projeto não possui um fluxo completo de recuperação por e-mail: não há chamada a `resetPasswordForEmail`, interface para solicitar o e-mail ou página de recuperação dedicada.

A conta de teste confirmada pode, em princípio, usar a recuperação do Supabase sem novo convite. A recuperação solicita um link enviado ao endereço da própria conta; após validar esse link, a aplicação deve exigir a sessão resultante e chamar `updateUser({ password })`. O Supabase documenta que `resetPasswordForEmail()` não revela se o endereço existe, ajudando a evitar enumeração de contas.

A página e o formulário atuais de definição de senha já fornecem parte do fluxo, pois exigem sessão e atualizam a senha do usuário autenticado. Contudo, isoladamente, não iniciam recuperação por e-mail, e a apresentação atual é voltada a convites.

## 4. Estrutura mínima recomendada

1. Adicionar ao login uma opção “Esqueci minha senha” que chame `supabase.auth.resetPasswordForEmail(email, { redirectTo })` usando o cliente do navegador.
2. Apontar `redirectTo` para `app/auth/callback/route.ts` com destino interno a uma tela própria de redefinição, e manter essa URL de retorno na lista permitida do Supabase.
3. Reutilizar o formulário atual de senha ou torná-lo neutro quanto à origem (convite/recuperação). A tela final deve continuar verificando a sessão e usar `updateUser({ password })`; não criar endpoint administrativo que altere a senha de outro ID.
4. Se o modelo de recuperação do Supabase usar `token_hash`, estender o callback para validar `type=recovery` com `verifyOtp`. O suporte atual para `token_hash` cobre somente `type=invite`. No fluxo PKCE, o retorno `code` pode usar o tratamento existente.
5. Mostrar uma resposta genérica após a solicitação, sem informar se o e-mail corresponde a uma conta.

Referências: [guia de recuperação de senha do Supabase](https://supabase.com/docs/guides/auth/passwords), [API `resetPasswordForEmail`](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) e [API `updateUser`](https://supabase.com/docs/reference/javascript/auth-updateuser).

## 5. Procedimento manual recomendado após implementação

1. Abrir a tela de login e solicitar redefinição usando o e-mail da conta de teste existente.
2. Verificar a caixa de entrada e abrir o link no mesmo ambiente/navegador em que o endereço de retorno do Topázio pode ser acessado; para desenvolvimento local, isso requer o servidor em execução no endereço configurado.
3. Confirmar que o callback cria a sessão e direciona à tela de redefinição.
4. Definir uma senha nova e entrar com ela na tela de login.
5. Verificar no Supabase o último acesso, sem copiar ou compartilhar link, código, token ou cookies.

## 6. Pendências e observações

- A análise foi somente do código local. Não foi testada uma conta no Supabase remoto, nem foi verificado o modelo de e-mail ou a allowlist de redirecionamento do projeto Supabase.
- Não foi enviada mensagem de recuperação, convite ou qualquer outro e-mail.
- Não foram criados, alterados ou removidos usuários ou empresas, e o banco/migração não foi modificado.
- Não houve alteração de arquivos de código nesta etapa; por isso, `npm run typecheck`, `npm run lint` e `npm run build` não foram executados.
- A confirmação de conta e o registro de último acesso relatados pelo usuário não provam, por si só, que a recuperação por e-mail esteja configurada ou que a autenticação remota funcione.

## Versão resumida

O Topázio ainda não tem recuperação de senha por e-mail: o login não chama `resetPasswordForEmail`. A conta confirmada pode, em princípio, redefinir a própria senha pelo fluxo do Supabase, sem novo convite. A implementação mínima é oferecer a solicitação no login, validar o retorno no callback (`code` ou `token_hash` do tipo `recovery`) e exigir sessão antes de atualizar a senha com `updateUser`. Nenhum e-mail ou dado remoto foi acessado e não houve teste real; o procedimento manual está descrito acima.

# Adendo — implementação de recuperação de senha por e-mail

**Data e hora:** 31/10/2026 às 15:15 (America/Fortaleza)
**Escopo:** adicionar recuperação de senha pelo Supabase Auth, validar o retorno por callback e permitir que cada usuário altere somente a senha da própria sessão autenticada.

## 1. Objetivo

Completar o fluxo que antes não tinha opção “Esqueci minha senha”: solicitar um link por e-mail, validar o retorno e abrir uma tela de redefinição que atualiza a senha do usuário autenticado.

## 2. Alterações realizadas

- `app/login-form.tsx`: adicionada a opção **Esqueci minha senha**, com modo de solicitação, campo de e-mail `type=email` obrigatório e validação nativa do navegador. O envio usa `supabase.auth.resetPasswordForEmail` e o destino local `/auth/callback?next=%2Fredefinir-senha`. Após sucesso, apresenta mensagem genérica que não revela se o e-mail existe. Erros de rede/configuração têm mensagens genéricas, sem registrar tokens, e-mail ou detalhes internos. A senha digitada para login é limpa ao alternar de modo.
- `app/auth/callback/route.ts`: preservado o tratamento PKCE por `exchangeCodeForSession`; o caminho por hash agora aceita `type=invite` e `type=recovery` usando `verifyOtp`. Continua validando `next` como caminho local e usa mensagem genérica para links inválidos/expirados. O diagnóstico de servidor registra apenas categorias e metadados não secretos.
- `app/redefinir-senha/page.tsx`: criada tela dedicada de recuperação. Exige usuário validado com `auth.getUser()` no servidor antes de renderizar o formulário; sem sessão, encaminha para mensagens compreensíveis na página inicial.
- `app/definir-senha/page.tsx`: mantém o fluxo de convite, com texto neutro de definição de senha e validação da sessão; erros de indisponibilidade e ausência de sessão retornam mensagens próprias.
- `app/definir-senha/set-password-form.tsx`: compartilhado entre convite e recuperação. Antes da alteração, confirma a sessão com `auth.getUser()` e chama `auth.updateUser({ password })` sem receber ou permitir selecionar ID de usuário. Trata divergência, sessão expirada, falha de atualização e erro de conexão com mensagens ao usuário.
- `app/page.tsx`: adicionadas mensagens de retorno para link inválido/expirado, sessão ausente e indisponibilidade.
- `README.md` e `docs/admin-company-testing.md`: documentados o fluxo, os destinos permitidos e as etapas para teste manual.

## 3. Segurança e limites

- A atualização de senha está vinculada à sessão autenticada do navegador. Não existe endpoint de alteração administrativa de senha nem campo de ID de conta.
- O cliente do navegador continua usando apenas `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; nenhuma chave secreta foi adicionada ao bundle ou ao fluxo do navegador.
- A autorização administrativa, o proxy, o isolamento multiempresa, o banco e as migrações não foram alterados.
- A solicitação mostra sempre uma resposta genérica de sucesso, como recomendado pelo Supabase para evitar enumeração de contas.
- A variável de redirecionamento usada é `NEXT_PUBLIC_SITE_URL`; a origem é validada como HTTPS, ou localhost/127.0.0.1 para desenvolvimento.

## 4. URLs necessárias no Supabase

Em **Authentication > URL Configuration > Redirect URLs**, permitir os destinos exatos usados pelo sistema:

- Recuperação local: `http://localhost:3000/auth/callback?next=%2Fredefinir-senha`
- Convite local: `http://localhost:3000/auth/callback?next=%2Fdefinir-senha`
- Produção: cadastrar os mesmos caminhos e parâmetros usando a origem HTTPS real do Topázio.

Manter `NEXT_PUBLIC_SITE_URL` igual à origem ativa da aplicação. O modelo **Reset password** deve preservar o destino `redirectTo` enviado pelo cliente. Se o modelo usar token hash, ele deve retornar com `type=recovery`; o callback reconhece esse tipo. A lista remota não foi consultada nesta tarefa.

## 5. Verificações executadas

- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run build`: passou com Next.js 16.4.3. A compilação e verificação de TypeScript concluíram e a saída incluiu `/auth/callback`, `/definir-senha` e `/redefinir-senha`.
- `git diff --check`: sem erros de whitespace. O Git emitiu apenas avisos de conversão LF/CRLF.
- O build atualizou automaticamente os imports de rotas em `next-env.d.ts`; o arquivo foi restaurado ao estado anterior ao build.

## 6. Procedimento manual e pendências

1. No Dashboard do Supabase, conferir/adicionar as URLs de recuperação e convite acima, com a URL de produção correta quando aplicável.
2. Conferir o modelo **Reset password** e o serviço de e-mail configurado.
3. Com o Topázio em execução e acessível pelo endereço configurado, abrir **Esqueci minha senha**, inserir o e-mail da conta de teste e solicitar o link.
4. Abrir o link no mesmo navegador em que a solicitação foi iniciada, confirmar que `/redefinir-senha` aparece com sessão válida, definir senha e entrar novamente.
5. Testar link expirado, sessão ausente e endereço sem conta; verificar que a interface não revela a existência da conta e não imprime tokens/cookies nos logs.

Nenhum e-mail foi enviado durante a implementação. Não foram criados, alterados ou excluídos usuários ou empresas. O fluxo não foi testado contra o Supabase remoto; portanto, não se afirma que a recuperação remota esteja operacional. A confirmação depende da configuração real de redirect URL, template e e-mail do projeto.

## Versão resumida

Foi implementado o fluxo de recuperação por e-mail: opção no login, solicitação genérica com `resetPasswordForEmail`, callback para PKCE e `token_hash` de convite/recuperação, página dedicada e atualização de senha somente após validar a sessão do próprio usuário. Documentação e URLs permitidas foram atualizadas. Typecheck, lint e build passaram. Falta conferir as configurações do Supabase e testar manualmente com uma conta real; nenhum e-mail ou alteração remota foi feito.

# Relatório de auditoria de segurança — Topázio

**Data e hora:** 31/10/2026 às 15:57 (America/Fortaleza)
**Escopo prioritário:** isolamento entre empresas, bloqueio com sessão existente e privilégios administrativos.
**Método:** inspeção somente de leitura do código e dos SQL versionados; verificações locais não destrutivas. Não houve acesso ao Supabase Dashboard ou execução de consultas no banco remoto.

## A. Resumo executivo

O repositório contém controles relevantes no servidor: o proxy verifica a sessão e o estado atual do perfil/empresa para as rotas `/painel/**`; as rotas administrativas verificam sessão e papel no servidor antes de carregar a chave administrativa; e a migração adiciona políticas RLS restritivas de **SELECT** para `companies` e `profiles` que pretendem limitar leitura por empresa e negar leitura de empresa bloqueada.

Os três pontos mais importantes, porém, não podem ser certificados somente pelo repositório. Há apenas uma migração SQL versionada, e ela não cria o esquema base, não habilita RLS e não define as políticas permissivas existentes ou as funções `current_user_company_id()` e `is_rumofalcao_admin()` das quais depende. As guardas adicionadas cobrem SELECT, não INSERT/UPDATE/DELETE. Assim, o comportamento real de escrita e a eficácia integral do bloqueio direto no banco dependem de configuração remota não inspecionada.

Não foi demonstrado um caminho de exploração no código atual para um usuário empresarial chamar as duas rotas administrativas. Ambas exigem papel administrativo no servidor. Isso não prova que o papel não possa ser alterado por acesso direto ao banco: as políticas e grants preexistentes de `profiles` não estão no repositório.

**Veredito: PARCIALMENTE VALIDADO.** Não foi confirmada uma exploração entre empresas, mas faltam evidências do banco e testes RLS com usuários independentes para garantir os controles fundamentais de isolamento e bloqueio.

## B. Arquitetura encontrada

- `lib/supabase-client.ts`: cliente de navegador `createBrowserClient` com URL e chave publishable.
- `lib/supabase-server.ts`: cliente SSR `createServerClient`, usa a API assíncrona `cookies()` do Next.js para ler e gravar cookies.
- `lib/supabase-admin.ts`: módulo `server-only`; obtém `SUPABASE_SECRET_KEY` somente no servidor e desabilita persistência/renovação automática da sessão administrativa.
- `proxy.ts`: atualiza/valida claims, protege `/painel` e subrotas, consulta o perfil e o estado atual da empresa e encaminha acesso negado. Não faz o papel de proteção do banco nem substitui autorização nas APIs.
- `lib/admin-auth.ts`: usa `auth.getUser()` no servidor e exige perfil `rumofalcao_admin` com `company_id = null`. `hasTrustedOrigin()` compara a origem em chamadas de escrita.
- APIs presentes: `GET/POST /api/admin/companies` e `PATCH /api/admin/companies/[id]`. Não há API empresarial de pedidos, produtos ou finanças no código atual.
- Tabelas referenciadas: `public.profiles` e `public.companies`. Os módulos empresariais adicionais aparecem como planejados, sem tabelas ou APIs de dados correspondentes neste repositório.
- Migrações versionadas: somente `supabase/migrations/20261030000100_admin_company_management.sql`.
- Essa migração referencia `current_user_company_id()` e `is_rumofalcao_admin()`, mas suas definições e grants não estão presentes nos arquivos versionados. Ela define também `admin_create_company_for_user(text,text,uuid)` como `SECURITY INVOKER`, com `search_path` vazio e execução concedida somente a `service_role`.
- Fluxo Auth: login no navegador; recuperação por e-mail com sessão resultante; callback para `code` PKCE ou `token_hash`; páginas de definição/redefinição de senha exigem usuário autenticado e atualizam somente a senha da sessão atual.

## C. Problemas, riscos e lacunas prioritárias

### AUD-01 — Escritas RLS e isolamento de todas as tabelas não comprováveis

**Gravidade:** alta (controle fundamental pendente de comprovação; vulnerabilidade não confirmada).

**Evidência:** a única migração versionada cria guardas restritivas `FOR SELECT` para `companies` e `profiles`. Não contém `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, políticas `INSERT`, `UPDATE` ou `DELETE`, nem definições de schema/tabelas base. Não há outras tabelas empresariais implementadas no repositório.

**Cenário e impacto:** se no banco real RLS estiver desabilitado, ou se políticas/grants permissivos de escrita permitirem operações sem checar `company_id` e o estado ativo, uma pessoa autenticada pode tentar ler ou alterar registros por chamadas diretas à API PostgREST, ignorando a interface. As guardas restritivas de SELECT, por si só, não bloqueiam escrita. Não há evidência local suficiente para dizer que essa exploração é possível no projeto remoto.

**Recomendação:** inventariar no Supabase, sem alterar dados, o estado de RLS/`FORCE ROW LEVEL SECURITY`, políticas e grants de cada tabela e as definições/atributos de segurança das duas funções auxiliares. Depois, com aprovação separada, garantir políticas por comando e `WITH CHECK` para cada tabela que guarde dados empresariais; testes devem cobrir alteração de `company_id`, inserção, atualização e exclusão entre duas empresas.

### AUD-02 — Bloqueio da empresa é verificado nas páginas e em SELECT, mas o bloqueio de escrita direta depende de políticas ausentes

**Gravidade:** alta para certificação do controle (lacuna não confirmada como falha remota).

**Evidência favorável:** em cada requisição ao painel, `proxy.ts` obtém claims e consulta perfil/empresa; empresa que não esteja `active` é redirecionada. `app/painel/page.tsx` repete a verificação no servidor. A migração define `companies_active_status_guard` e `profiles_active_company_guard` como políticas restritivas `FOR SELECT`, verificando o status ativo.

**Limite:** isso protege as rotas do painel e pretende limitar leitura. Não invalida o token Auth da pessoa e não impede, por si só, chamadas diretas de escrita ao PostgREST. As políticas de INSERT/UPDATE/DELETE, o RLS efetivamente habilitado e o resultado com as funções reais não estão disponíveis. A sessão continuará autenticada para rotas não protegidas até expirar ou ser encerrada.

**APIs:** atualmente as únicas APIs são administrativas. As duas verificam o papel administrativo em cada requisição; usuário empresarial deve receber 403 antes do uso da chave elevada. Não há APIs empresariais de negócio para avaliar. Portanto, o código local não oferece uma API empresarial conhecida que continue operando após bloqueio, mas isso não demonstra a proteção de escrita direta no banco.

**Recomendação:** em ambiente de teste, manter uma sessão de uma empresa ativa, bloqueá-la com administrador e repetir leituras e escritas diretas com a mesma sessão. As políticas RLS de cada escrita devem avaliar o estado atual, não apenas dados antigos do JWT. Fazer também a chamada direta às APIs encontradas e confirmar 403 para o perfil empresarial.

### AUD-03 — Não é possível confirmar que usuários comuns não alterem papel/perfil diretamente

**Gravidade:** alta (elevação de privilégio não confirmada; depende de políticas/grants remotos).

**Evidência favorável:** `getAdminAuthorization()` usa `auth.getUser()` e lê o perfil no servidor; exige explicitamente `role = 'rumofalcao_admin'` e `company_id = null`. POST e PATCH só criam ou alteram empresa depois dessa validação. O POST fixa o novo papel como `company_user`. A função RPC revoga EXECUTE de `public`, `anon` e `authenticated`, concede apenas a `service_role` e confere `auth.role()`.

**Limite:** nenhuma rota da aplicação permite alterar papel ou perfil. Contudo, as políticas e privilégios preexistentes de `profiles` não estão versionados; não dá para descartar que uma chamada direta ao banco permita atualizar `role` ou `company_id`.

**Recomendação:** verificar grants e políticas de `profiles` no Supabase. Garantir que usuários comuns não tenham INSERT/UPDATE/DELETE nesses campos, inclusive via triggers, funções, views ou RPCs. Testar acesso direto às rotas GET/POST/PATCH administrativas e a chamada RPC como `authenticated`, sem usar a chave secreta.

### AUD-04 — Funções de autorização do banco não auditáveis localmente

**Gravidade:** média/alta, pois são dependência direta das guardas RLS.

**Evidência:** `current_user_company_id()` e `is_rumofalcao_admin()` são chamadas nas políticas, mas não há definição local. Não é possível avaliar se derivam a empresa do `auth.uid()` sem aceitar valor enviado pelo cliente, como tratam perfil inexistente, se têm `SECURITY DEFINER`, `search_path` fixo, proprietário/grants seguros ou se podem ser usadas para escalada.

**Recomendação:** obter no Dashboard/SQL Editor a definição, proprietário, `prosecdef`, `search_path` e ACL/grants das funções e revisar sua relação com `auth.uid()` e RLS. Não alterar funções durante esta auditoria.

### AUD-05 — RLS aplicado no ambiente remoto não verificado

**Gravidade:** alta como pendência operacional.

**Evidência:** não foi acessado o Supabase remoto. O repositório não comprova que a única migração está aplicada nem quais políticas anteriores existem. A migração em questão cria políticas e RPC, mas não constitui o schema completo.

**Recomendação:** comparar migrations aplicadas com o repositório e inventariar políticas/grants do projeto correto antes de declarar o isolamento validado.

## D. Controles que parecem corretos no código

- **Autorização administrativa nas rotas presentes:** GET/POST/PATCH chamam `getAdminAuthorization()` e validam a identidade com `getUser()` no servidor antes de operações elevadas. POST e PATCH também verificam `Origin`; PATCH valida UUID e restringe status aos valores `active`/`blocked`; POST valida tamanho/formato/campos.
- **Chave administrativa:** `lib/supabase-admin.ts` é `server-only`, e os handlers só constroem o cliente privilegiado depois da checagem administrativa. O cliente de navegador usa apenas a chave publishable; `.env.local` não é rastreado e a regra `.env*` do `.gitignore` o ignora. O arquivo `.env.example` é a configuração de exemplo versionada. Nenhum valor secreto foi lido ou reproduzido neste relatório.
- **RPC de criação:** a função versionada não é `SECURITY DEFINER`, fixa `search_path` vazio, revoga a execução de papéis públicos/autenticados e concede ao `service_role`; a API atribui sempre papel `company_user`.
- **Bloqueio no painel:** as requisições para `/painel/**` consultam estado atual no banco, além de validar claims; o bloqueio não depende exclusivamente de um valor de status antigo no JWT.
- **Redirecionamento do callback:** `safeNextPath()` exige caminho iniciado por `/`, rejeita `//` e barras invertidas. Os caminhos enviados pela recuperação são internos.
- **Recuperação/definição de senha:** as páginas exigem usuário verificado e `updateUser({ password })` não recebe ID de alvo, limitando a alteração à sessão atual.
- **Escopo de tabelas:** no código atual, só há consultas aos recursos `profiles` e `companies`; módulos de negócio ainda são placeholders. Novas tabelas exigirão auditoria e políticas próprias antes de serem disponibilizadas.

Esses pontos demonstram o desenho implementado no repositório, não substituem verificação de configuração ou teste do banco real.

## E. Testes e verificações realizados

- Inspeção somente de leitura dos arquivos de cliente Supabase, `proxy.ts`, `lib/admin-auth.ts`, `lib/supabase-admin.ts`, páginas do painel, APIs administrativas, callback de autenticação, páginas de redefinição e migração versionada.
- Inventário de arquivos/migrações Supabase: uma migração SQL no repositório; não foram encontradas outras definições SQL locais.
- Verificação de `.gitignore`, rastreamento e histórico disponível: `.env.local` não é rastreado, está coberto pela regra `.env*`, e não há commit desse arquivo nas referências Git disponíveis. Nenhum conteúdo de ambiente foi exibido.
- `npm run typecheck`: passou.
- `npm run lint`: passou.
- `npm run build`: passou; build Next.js 16.4.3 gerou painel, APIs administrativas e páginas de autenticação.
- `git diff --check`: não apontou erros de whitespace; o Git apresentou avisos de conversão de LF/CRLF.
- Não foi executado teste automatizado de segurança: o `package.json` contém scripts de typecheck, lint e build, sem script de testes.

## F. Testes ainda necessários

**Não executados:** chamadas contra Supabase/PostgREST com usuários de duas empresas; tentativa de INSERT/UPDATE/DELETE e troca de `company_id`; bloqueio com sessão já aberta seguido de consultas REST diretas; chamadas de usuário empresarial às APIs/RPC administrativas; testes de administrador legítimo; análise do estado remoto de RLS e funções; verificação de tabelas e views no banco.

**Matriz manual recomendada, em projeto de teste:**

1. Com usuário da Empresa A e chave publishable, tentar SELECT de registros da Empresa B em cada tabela empresarial; resultado esperado: zero linhas/negação.
2. Tentar INSERT com `company_id` da Empresa B; UPDATE de linha da Empresa B; troca do próprio `company_id`; DELETE de linha da Empresa B. Resultado esperado: negação RLS.
3. Abrir sessão da Empresa A, bloquear a empresa como administrador e, sem renovar a sessão, repetir chamadas à API e ao banco. Confirmar bloqueio imediato de rotas e leituras e negação das escritas diretas.
4. Como usuário empresarial, chamar `GET/POST /api/admin/companies`, `PATCH /api/admin/companies/{id}` e RPC administrativo. Resultado esperado: 403/401 ou privilégio negado sem alteração de dados.
5. Como administrador autorizado, confirmar somente as operações previstas; não usar `service_role` como substituto de uma sessão comum nos testes RLS.
6. Fazer inventário SQL somente de leitura para `relrowsecurity`/`relforcerowsecurity`, `pg_policies`, grants das tabelas e definições/ACL das funções auxiliares; comparar com os resultados de chamadas autenticadas.

O usuário informa no contexto que alguns fluxos foram testados manualmente. Esses testes não foram repetidos nem há evidências de suas chamadas/RLS disponíveis nesta auditoria; por isso não foram contabilizados como testes realizados.

## G. Plano de correção/validação priorizado

1. **Prioridade máxima:** obter schema, estado de RLS e todas as políticas/grants remotos para `profiles` e `companies`; confirmar aplicação da migração e definições seguras das funções helper.
2. **Alta:** validar políticas de escrita com `USING` e `WITH CHECK` para cada operação e assegurar que verificam identidade, empresa proprietária e status atual. Tratar separadamente acesso administrativo autorizado.
3. **Alta:** executar matriz de duas empresas e bloqueio com sessão ativa usando contas de teste, PostgREST e APIs, sem usar chave secreta para simular usuário comum.
4. **Alta:** confirmar que perfil empresarial não pode alterar `profiles.role`, `company_id` ou executar funções administrativas diretamente.
5. **Antes de novos módulos:** definir e testar RLS para cada nova tabela/view/RPC empresarial antes da exposição pela API ou interface.
6. **Depois da validação:** registrar evidências de resultados e reavaliar a classificação. Nenhuma correção foi aplicada nesta auditoria, conforme o escopo somente de leitura.

## H. Veredito

**PARCIALMENTE VALIDADO.** A proteção administrativa e o bloqueio de navegação no painel estão sustentados pelo código local. As políticas SQL locais pretendem restringir leituras entre empresas e de empresas bloqueadas. Porém, as políticas de escrita, habilitação RLS, funções auxiliares, grants e estado real da migração não podem ser confirmados sem inspeção e testes no Supabase. Não se declara o sistema totalmente seguro nem se afirma que os cenários remotos passaram.

## Versão resumida — pontos de maior atenção

- **Isolamento de dados:** as guardas versionadas cobrem SELECT em `companies` e `profiles`; não há políticas de INSERT/UPDATE/DELETE nem schema completo no repositório. A proteção contra escrita cruzada e a configuração real do RLS permanecem sem comprovação.
- **Empresa bloqueada:** o proxy e o painel consultam o estado atual e devem negar `/painel/**` mesmo com sessão aberta; guardas SELECT também verificam status. A sessão Auth não é revogada, APIs empresariais ainda não existem e a negação de escrita direta depende de políticas remotas não inspecionadas.
- **Privilégios administrativos:** as APIs existentes verificam `getUser()` e papel administrativo no servidor antes de usar chave privilegiada; a RPC local é concedida apenas a `service_role`. Falta comprovar que políticas/grants remotos impedem alteração direta de `role` e `company_id` por usuário empresarial.
- **Resultado:** typecheck, lint e build passaram, mas não são testes de segurança. Sem consulta/teste remoto das políticas e funções, o veredito é **PARCIALMENTE VALIDADO**.
