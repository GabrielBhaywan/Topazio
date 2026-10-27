# Topázio

Fundação inicial do sistema web de gestão empresarial da RumoFalcão. O projeto prepara a estrutura de interface para evoluir com contas empresariais isoladas e contas administrativas autorizadas.

## Tecnologias

- Next.js com App Router e TypeScript
- Tailwind CSS
- Supabase (integração futura)

## Pré-requisitos

- Node.js 20.9 ou superior
- npm

## Instalação e execução

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. Para validar a aplicação, use `npm run typecheck`, `npm run lint` e `npm run build`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha as variáveis quando houver um projeto Supabase configurado. Nenhum projeto ou credencial foi presumido. Não coloque chaves secretas no código do navegador ou em arquivos versionados.

## Implementado nesta etapa

- Estrutura inicial do Next.js, TypeScript e Tailwind CSS.
- Página visual de login em português, sem envio ou validação de credenciais.
- Esqueleto visual do painel em `/painel`, sem dados reais ou proteção de rota.
- Estado visual de acesso negado em `/sem-permissao`, sem verificação real de permissões.
- Variáveis de ambiente exemplificadas sem valores.

## Ainda não implementado

Autenticação Supabase, autorização por tipo de conta, isolamento de dados, políticas de banco, administração de empresas e módulos operacionais. O formulário e as páginas protegidas são apenas estrutura visual; não use o sistema para autenticar ou armazenar dados.

## Próxima etapa recomendada

Configurar um projeto Supabase e desenhar o modelo de contas, vínculos entre usuários e empresas e políticas de segurança RLS antes de conectar o Supabase Auth e proteger as rotas.
