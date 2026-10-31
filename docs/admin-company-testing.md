# Configuração e validação da administração

## Preparação

1. Confirme no Supabase que as tabelas `public.companies` e `public.profiles`, os papéis, as restrições e as quatro políticas SELECT descritas no escopo já existem.
2. No SQL Editor do projeto correto, execute uma única vez o arquivo `supabase/migrations/20261030000100_admin_company_management.sql`. Ele adiciona políticas SELECT restritivas e uma função transacional; não exclui nem atualiza registros existentes.
3. Configure `SUPABASE_SECRET_KEY` no ambiente do servidor usando uma chave secreta do projeto. Não a coloque em variável `NEXT_PUBLIC_*`, código ou log.
4. Configure `NEXT_PUBLIC_SITE_URL` para `http://localhost:3000` localmente e para a origem HTTPS real em produção.
5. Em Authentication > URL Configuration, adicione `http://localhost:3000/auth/callback` e a URL de produção correspondente à lista de Redirect URLs. Ajuste o modelo **Invite user** se desejar personalizar o e-mail; o link precisa continuar apontando para `{{ .ConfirmationURL }}`.
6. Inicie com `npm run dev`, entre com uma conta cujo perfil existente seja `rumofalcao_admin` e abra `/painel/empresas`.

## Roteiro manual obrigatório

Execute em um projeto de teste antes de produção. Não use uma conta real de cliente para as verificações de bloqueio.

1. Com administrador autenticado, abra `/painel/empresas`; a página e `GET /api/admin/companies` devem funcionar.
2. Com usuário `company_user`, abra `/painel/empresas`; deve ser redirecionado para `/sem-permissao`.
3. Sem sessão, abra `/painel/empresas`; deve voltar para `/` e chamadas diretas à API devem retornar HTTP 401.
4. Faça `POST /api/admin/companies` como usuário comum ou sem sessão; deve retornar 403 ou 401 sem criar usuário/empresa.
5. Como administrador, cadastre uma empresa com um e-mail de teste. O convite deve chegar; abra-o, defina uma senha e entre.
6. No banco, confirme que a empresa está ativa, que o perfil do convidado tem `role = 'company_user'` e que `company_id` aponta para a empresa criada.
7. Com esse usuário, confirme que não é possível abrir `/painel/empresas` nem consultar os dados da outra empresa.
8. Como administrador, bloqueie a empresa. Na sessão do usuário, navegue novamente para `/painel` e faça uma consulta RLS às tabelas `profiles` e `companies`; a rota deve ser negada e o próprio perfil/empresa não deve ser legível.
9. Reative a empresa e confirme que `/painel` volta a funcionar.
10. Faça chamadas diretas com método PATCH e confirme que usuário comum recebe 403; tente status diferente de `active`/`blocked` e confirme HTTP 400.
11. Inspecione o bundle do navegador e confirme que o valor de `SUPABASE_SECRET_KEY` não foi incorporado. A chave nunca deve ser impressa para fazer essa verificação.
12. Em um projeto descartável, simule falha da função SQL após o convite e confirme que a transação pública não deixa empresa/perfil parcial e que a conta Auth convidada é cancelada. Se a limpeza falhar, a API deve orientar suporte e não declarar sucesso.

Os testes 1–12 dependem de usuários, e-mail, RLS e configuração do projeto Supabase real; não foram simulados automaticamente pelo build local.

## Migração

O único SQL necessário nesta etapa está em `supabase/migrations/20261030000100_admin_company_management.sql`. Aplique-o manualmente no SQL Editor e confirme o resultado antes de testar a tela. Não conceda INSERT/UPDATE/DELETE ao papel `authenticated`.

## Recuperação de senha

- Permita nas Redirect URLs do Supabase `http://localhost:3000/auth/callback?next=%2Fredefinir-senha` para recuperação e `http://localhost:3000/auth/callback?next=%2Fdefinir-senha` para convite. Cadastre também as URLs equivalentes da origem HTTPS de produção. Use destinos exatos; não abra curingas amplos para produção.
- Confirme que o modelo **Reset password** preserva o destino fornecido pelo app (`{{ .RedirectTo }}` ao montar link por token hash). O callback aceita o retorno PKCE com `code` e o retorno por `token_hash` com `type=recovery`.
- Teste com endereço de uma conta de teste: solicite a recuperação, abra o e-mail, confirme a sessão na página `/redefinir-senha`, atualize a senha e entre novamente. A interface não deve revelar se um endereço não cadastrado existe.
- Confirme que link expirado ou sessão ausente apresenta mensagem simples e que não é possível definir senha para outra conta. Não copie tokens, códigos ou cookies para logs ou relatórios.
