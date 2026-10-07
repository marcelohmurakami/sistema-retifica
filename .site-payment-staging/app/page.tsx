import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { getRequestPublicSite } from "@/lib/supabase/request-site";

export const dynamic = "force-dynamic";

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const schemaDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const time = (value: string) => value.slice(0, 5).replace(":", "h");

function address(site: Awaited<ReturnType<typeof getRequestPublicSite>>) {
  const unit = site?.unidade;
  if (!unit) return "";
  return [
    [unit.endereco, unit.numero].filter(Boolean).join(", "),
    unit.bairro,
    [unit.cidade, unit.estado].filter(Boolean).join(" — "),
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function Home() {
  const data = await getRequestPublicSite();
  if (!data) notFound();

  const {
    site,
    empresa,
    unidade,
    horarios,
    servicos,
    profissionais,
    avaliacoes,
  } = data;
  const fullAddress = address(data);
  const faqs = site.perguntas_frequentes.filter(
    (item) => item.pergunta && item.resposta,
  );
  const average = avaliacoes.length
    ? avaliacoes.reduce((total, item) => total + item.nota, 0) /
      avaliacoes.length
    : null;
  const canonical = `https://${site.dominio}`;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: site.nome_publico,
    url: canonical,
    image:
      site.imagem_compartilhamento_url || site.imagem_hero_url || undefined,
    telephone: site.whatsapp || unidade?.telefone || undefined,
    email: site.email_publico || undefined,
    address: unidade
      ? {
          "@type": "PostalAddress",
          streetAddress: [unidade.endereco, unidade.numero]
            .filter(Boolean)
            .join(", "),
          addressLocality: unidade.cidade,
          addressRegion: unidade.estado,
          postalCode: unidade.cep,
          addressCountry: "BR",
        }
      : undefined,
    openingHoursSpecification: horarios.map((item) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: schemaDays[item.dia_semana],
      opens: item.hora_abertura.slice(0, 5),
      closes: item.hora_fechamento.slice(0, 5),
    })),
    aggregateRating: average
      ? {
          "@type": "AggregateRating",
          ratingValue: average.toFixed(1),
          reviewCount: avaliacoes.length,
        }
      : undefined,
  };
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.pergunta,
          acceptedAnswer: { "@type": "Answer", text: item.resposta },
        })),
      }
    : null;

  return (
    <main id="conteudo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> beleza com identidade
          </p>
          <h1>
            {site.titulo_hero || site.nome_publico}
            <br />
            {site.destaque_hero && <em>{site.destaque_hero}</em>}
          </h1>
          <p className="hero-text">
            {site.descricao_hero ||
              `Conheça os serviços e agende online com ${site.nome_publico}.`}
          </p>
          <div className="hero-actions">
            <Link href="/agendar" className="button">
              Agendar agora <ArrowRight size={17} />
            </Link>
            <a href="#servicos" className="text-link">
              Conhecer serviços <ArrowDown size={15} />
            </a>
          </div>
          <div
            className="trust-row"
            aria-label={`Indicadores do catálogo online ${site.nome_publico}`}
          >
            {site.mostrar_profissionais && (
              <div>
                <strong>{profissionais.length}</strong>
                <span className="stars">✦ equipe</span>
                <small>profissionais disponíveis</small>
              </div>
            )}
            <div>
              <strong>{servicos.length}</strong>
              <small>serviços para agendar</small>
            </div>
            <div>
              <strong>24h</strong>
              <small>agendamento online</small>
            </div>
          </div>
        </div>
        <div className="hero-photo-wrap">
          {/* A URL é validada e publicada pelo administrador da empresa. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.imagem_hero_url || "/images/hero-murakami.png"}
            alt={`Ambiente e atendimento do ${site.nome_publico}`}
            className="hero-photo"
          />
          <div className="photo-label">
            <Sparkles size={15} />
            <span>
              <strong>Agenda online</strong> disponível 24 horas
            </span>
          </div>
          <div className="photo-caption">
            Cuidado real.
            <br />
            <em>Do seu jeito.</em>
          </div>
        </div>
      </section>

      <div className="benefit-strip" aria-label="Vantagens do agendamento">
        <span>
          <CalendarCheck size={17} /> Agendamento online 24h
        </span>
        <span>
          <ShieldCheck size={17} /> Confirmação segura
        </span>
        <span>
          <Clock3 size={17} /> Lembrete automático
        </span>
        <span>
          <Heart size={17} /> Atendimento personalizado
        </span>
      </div>

      <section className="services" id="servicos">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span /> nossos cuidados
            </p>
            <h2>Serviços disponíveis.</h2>
          </div>
          <p>
            Escolha seu cuidado, encontre o melhor horário e confirme em poucos
            minutos.
          </p>
        </div>
        {servicos.length ? (
          <div className="service-grid">
            {servicos.slice(0, 9).map((service, index) => (
              <article className="service-card" key={service.id}>
                <div className="service-top">
                  <span className="service-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Sparkles size={18} />
                </div>
                <h3>{service.nome}</h3>
                <p>
                  {service.descricao ||
                    `Atendimento de ${service.nome.toLocaleLowerCase("pt-BR")}.`}
                </p>
                <div className="service-meta">
                  <span>
                    {service.preco !== null && (
                      <strong>
                        a partir de {money(Number(service.preco))}
                      </strong>
                    )}
                    <small>{service.duracao_minutos} min</small>
                  </span>
                  <Link
                    href={`/agendar?servico=${service.id}`}
                    aria-label={`Agendar ${service.nome}`}
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-public-section">
            <p>
              O catálogo está sendo atualizado. Entre em contato para consultar
              os serviços.
            </p>
          </div>
        )}
        {servicos.length > 0 && (
          <div className="center-action">
            <Link href="/agendar" className="text-link">
              Ver todos e agendar <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-art" aria-hidden="true">
          <div className="studio-arch">
            <span>{site.nome_publico.charAt(0)}</span>
          </div>
          <div className="studio-note">
            <Star size={15} fill="currentColor" />
            <span>
              um espaço pensado
              <br />
              para cuidar de você
            </span>
          </div>
        </div>
        <div className="studio-copy">
          <p className="eyebrow">
            <span /> conheça nosso espaço
          </p>
          <h2>{site.titulo_sobre || `Conheça ${site.nome_publico}.`}</h2>
          <p>{site.descricao_sobre || site.descricao_hero}</p>
          {site.diferenciais.length > 0 && (
            <ul>
              {site.diferenciais.map((item) => (
                <li key={item}>
                  <Check size={16} /> {item}
                </li>
              ))}
            </ul>
          )}
          {fullAddress && (
            <a href="#contato" className="button button-outline">
              <MapPin size={16} /> Como chegar
            </a>
          )}
        </div>
      </section>

      {site.mostrar_profissionais && profissionais.length > 0 && (
        <section className="professionals" id="profissionais">
          <div className="section-heading centered-heading">
            <div>
              <p className="eyebrow">
                <span /> quem cuida de você <span />
              </p>
              <h2>Nossa equipe.</h2>
            </div>
            <p>
              Escolha quem vai atender você ou deixe o sistema encontrar um
              horário disponível.
            </p>
          </div>
          <div className="professional-grid">
            {profissionais.map((person, index) => (
              <article
                className={`professional-card ${["rose", "sand", "wine"][index % 3]}`}
                key={person.id}
              >
                <div className="professional-portrait">
                  <span>
                    {person.nome
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <small>{site.nome_publico}</small>
                </div>
                <div>
                  <p>{person.cargo}</p>
                  <h3>{person.nome}</h3>
                  <span>
                    {person.servicos.length} serviço(s) disponível(is)
                  </span>
                </div>
                <Link
                  href={`/agendar?profissional=${person.id}`}
                  aria-label={`Agendar com ${person.nome}`}
                >
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {site.mostrar_avaliacoes && avaliacoes.length > 0 && (
        <section className="review-section">
          <div className="review-score">
            <strong>{average?.toFixed(1)}</strong>
            <span>{"★".repeat(Math.round(average || 0))}</span>
            <small>
              {avaliacoes.length} avaliação(ões) publicada(s) com autorização.
            </small>
          </div>
          <blockquote>
            “{avaliacoes[0].comentario}”
            <footer>
              <span>{avaliacoes[0].nome.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{avaliacoes[0].nome}</strong>
                <small>cliente verificado</small>
              </div>
            </footer>
          </blockquote>
        </section>
      )}

      <section className="complete-flow">
        <div>
          <p className="eyebrow">
            <span /> tudo na palma da mão
          </p>
          <h2>
            Seu horário,
            <br />
            <em>do seu jeito.</em>
          </h2>
          <p>Agende, confirme e acompanhe seus cuidados sem precisar ligar.</p>
        </div>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>Escolha e agende</strong>
              <small>Serviço, especialista, data e horário.</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Confirme com segurança</strong>
              <small>Pague o sinal, quando necessário.</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Receba lembretes</strong>
              <small>WhatsApp e e-mail antes do horário.</small>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Gerencie quando precisar</strong>
              <small>Confirme, remarque ou cancele pela sua área.</small>
            </div>
          </li>
        </ol>
        <Link href="/agendar" className="button button-light">
          Agendar agora <ArrowRight size={16} />
        </Link>
      </section>

      {(faqs.length > 0 || site.whatsapp) && (
        <section className="faq-section">
          <div>
            <p className="eyebrow">
              <span /> dúvidas frequentes
            </p>
            <h2>Tudo bem explicado.</h2>
            {site.whatsapp && (
              <p>Ainda precisa de ajuda? Fale com a equipe pelo WhatsApp.</p>
            )}
          </div>
          {faqs.length > 0 && (
            <div className="faq-list">
              {faqs.map((item) => (
                <details key={item.pergunta}>
                  <summary>
                    {item.pergunta}
                    <span>+</span>
                  </summary>
                  <p>{item.resposta}</p>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {(fullAddress || horarios.length > 0) && (
        <section
          className="public-contact-card"
          aria-label="Endereço e horários"
        >
          <div>
            <p className="eyebrow">
              <span /> atendimento
            </p>
            <h2>{unidade?.nome || empresa.nome}</h2>
            {fullAddress && (
              <p>
                <MapPin size={17} /> {fullAddress}
              </p>
            )}
          </div>
          {horarios.length > 0 && (
            <div className="public-hours">
              {horarios.map((item) => (
                <span key={item.dia_semana}>
                  <strong>{dayNames[item.dia_semana]}</strong>
                  {time(item.hora_abertura)} às {time(item.hora_fechamento)}
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
