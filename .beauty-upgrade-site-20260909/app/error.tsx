"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="conteudo" className="public-state" tabIndex={-1}><span className="public-state__code">Ops</span><h1>Não conseguimos carregar o site.</h1><p>A conexão pode ter oscilado. Tente novamente em alguns instantes.</p><button className="button" type="button" onClick={reset}><RotateCcw size={17} /> Tentar novamente</button></main>;
}
