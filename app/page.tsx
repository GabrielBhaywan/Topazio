import Link from "next/link";

export default function HomePage() {
  return <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", paddingBlock: 40 }}>
    <section className="card" style={{ width: "min(100%, 440px)", padding: 32 }}>
      <div className="brand" style={{ marginBottom: 32 }}>Topázio<span>.</span></div>
      <p className="eyebrow">Acesso ao sistema</p>
      <h1 style={{ fontSize: 28, letterSpacing: "-.04em", margin: "8px 0" }}>Entre na sua conta</h1>
      <p className="muted" style={{ lineHeight: 1.6, margin: "0 0 24px" }}>Acesse o ambiente de gestão da sua empresa.</p>
      <form action="#" style={{ display: "grid", gap: 16 }}>
        <div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" /></div>
        <div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" autoComplete="current-password" placeholder="Sua senha" /></div>
        <button className="button" type="button" style={{ width: "100%", marginTop: 4 }}>Entrar</button>
      </form>
      <div className="notice" style={{ marginTop: 20 }}><strong>Autenticação indisponível nesta etapa.</strong> Este formulário é apenas visual e não envia nem valida credenciais. O acesso com Supabase Auth será implementado posteriormente.</div>
      <div style={{ marginTop: 22, textAlign: "center", fontSize: 13 }}><Link href="/sem-permissao" style={{ color: "var(--green)" }}>Sobre o acesso ao sistema</Link></div>
    </section>
  </main>;
}
