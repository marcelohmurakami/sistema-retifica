import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main id="conteudo" className="public-state" tabIndex={-1}><SearchX size={42} /><span className="public-state__code">404</span><h1>Empresa não encontrada.</h1><p>Este domínio não está ligado a um site publicado. Confira o endereço ou peça à empresa para revisar a publicação no painel.</p><Link className="button" href="/">Tentar novamente</Link></main>;
}
