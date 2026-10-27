import Link from "next/link";

const modules = ["Produtos e serviços", "Pedidos", "Financeiro", "Relatórios", "Atividades"];

export default function PanelPage() {
  return <>
    <header className="topbar"><div className="container topbar-inner"><Link className="brand" href="/">Topázio<span>.</span></Link><span className="muted" style={{ fontSize: 14 }}>Ambiente inicial</span></div></header>
    <main className="container" style={{ paddingBlock: 48 }}>
      <p className="eyebrow">Visão geral</p><h1 style={{ fontSize: 32, letterSpacing: "-.04em", margin: "8px 0" }}>Bem-vindo ao Topázio</h1>
      <p className="muted" style={{ marginTop: 0, lineHeight: 1.6 }}>Este espaço será preparado para reunir a operação da sua empresa.</p>
      <div className="notice" style={{ marginBlock: 24 }}><strong>Prévia de interface.</strong> A autenticação e a proteção desta rota ainda não estão implementadas. Não há dados empresariais conectados.</div>
      <section className="card" style={{ padding: 24, marginBottom: 20 }}><p className="eyebrow" style={{ marginTop: 0 }}>Sua empresa</p><h2 style={{ marginBottom: 8 }}>Nenhuma empresa conectada</h2><p className="muted" style={{ marginBottom: 0 }}>Os dados da empresa aparecerão aqui após as próximas etapas de configuração.</p></section>
      <h2 style={{ fontSize: 18, marginBlock: "28px 14px" }}>Módulos planejados</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>{modules.map((name) => <div className="card" key={name} style={{ padding: 18, color: "var(--muted)" }}>{name}<div style={{ fontSize: 12, marginTop: 10 }}>Disponível em etapa futura</div></div>)}</div>
      <p style={{ marginTop: 28 }}><Link href="/sem-permissao" className="button-secondary">Página de acesso negado</Link></p>
    </main>
  </>;
}
