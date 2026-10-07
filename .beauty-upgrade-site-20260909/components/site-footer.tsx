import Link from "next/link";
import { Camera, Mail, MapPin, Phone } from "lucide-react";
import type { PublicSite } from "@/lib/supabase/site";

const phoneHref = (value: string) => `tel:${value.replace(/\D/g, "")}`;
const instagramHref = (value: string) => value.startsWith("http") ? value : `https://instagram.com/${value.replace(/^@/, "")}`;

export function SiteFooter({ data }: { data: PublicSite }) {
  const { site, unidade, horarios } = data;
  const location = unidade ? [[unidade.endereco, unidade.numero].filter(Boolean).join(", "), [unidade.bairro, unidade.cidade, unidade.estado].filter(Boolean).join(" · ")].filter(Boolean) : [];
  const first = horarios[0]; const last = horarios.at(-1);
  return <footer className="site-footer" id="contato"><div className="footer-main"><div className="footer-brand"><Link href="/" className="brand brand-light"><span className="brand-mark">{site.nome_publico.charAt(0)}</span><span>{site.nome_publico}</span></Link><p>{site.texto_rodape || site.descricao_hero}</p>{site.instagram_url && <a href={instagramHref(site.instagram_url)} target="_blank" rel="noreferrer" aria-label={`Instagram do ${site.nome_publico}`}><Camera size={19} /></a>}</div><div><p className="footer-title">Explore</p><Link href="/#servicos">Serviços</Link><Link href="/#studio">O espaço</Link>{site.mostrar_profissionais && <Link href="/#profissionais">Especialistas</Link>}<Link href="/agendar">Agendar online</Link></div><div><p className="footer-title">Atendimento</p>{location.length > 0 && <p><MapPin size={15} /> {location.map((line) => <span key={line}>{line}<br /></span>)}</p>}{site.whatsapp && <a href={phoneHref(site.whatsapp)}><Phone size={15} /> {site.whatsapp}</a>}{site.email_publico && <a href={`mailto:${site.email_publico}`}><Mail size={15} /> {site.email_publico}</a>}{first && last && <p>{first.hora_abertura.slice(0, 5)} às {last.hora_fechamento.slice(0, 5)}</p>}</div><div className="footer-cta"><p className="footer-title">Seu momento começa aqui</p><h2>Encontre o melhor horário para você.</h2><Link href="/agendar" className="button button-light">Agendar meu horário <span>↗</span></Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {site.nome_publico}. Todos os direitos reservados.</span><span>Privacidade · Termos de uso</span></div></footer>;
}
