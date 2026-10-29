import { supabase } from '@/lib/supabase'

export default async function TesteConexaoPage() {
  const { error } = await supabase
    .from('teste_conexao')
    .select('*')
    .limit(1)

  return (
    <main style={{ padding: '32px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste de conexão — Topázio</h1>

      {error ? (
        <section>
          <h2>Conexão iniciada, mas o teste retornou um erro.</h2>
          <p>Mensagem: {error.message}</p>
          <p>
            Isso pode acontecer porque a tabela de teste ainda não existe
            ou porque suas permissões não foram configuradas.
          </p>
        </section>
      ) : (
        <section>
          <h2>Consulta realizada com sucesso!</h2>
          <p>O Supabase respondeu à consulta do Topázio.</p>
        </section>
      )}
    </main>
  )
}