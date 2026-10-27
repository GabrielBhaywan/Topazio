import Link from "next/link";

export default function NoPermissionPage() {
  return <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", paddingBlock: 32 }}>
    <section className="card" style={{ width: "min(100%, 520px)", padding: 32 }}>
      <Link className="brand" href="/">Topázio<span>.</span></Link>
      <p className="eyebrow" style={{ marginTop: 36 }}>Acesso</p>
      <h1 style={{ fontSize: 28, letterSpacing: "-.04em", margin: "8px 0" }}>Acesso não autorizado</h1>
      <p className="muted" style={{ lineHeight: 1.65 }}>Esta página representa o estado visual para quando uma conta não tiver permissão para acessar um recurso.</p>
      <div className="notice" style={{ marginBlock: 22 }}>O controle de sessão e permissões ainda não foi implementado. Esta tela não representa uma verificação real de acesso.</div>
      <Link className="button-secondary" href="/">Voltar ao início</Link>
    </section>
  </main>;
}
