"use client";

import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SiteHeaderProps = {
  name: string;
  showProfessionals: boolean;
  customerName?: string | null;
};

export function SiteHeader({
  name,
  showProfessionals,
  customerName,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const firstName = customerName?.trim().split(/\s+/)[0];
  const accountLabel = firstName || "Minha conta";
  const links = [
    { href: "/#servicos", label: "Serviços" },
    { href: "/#studio", label: "O espaço" },
    ...(showProfessionals
      ? [{ href: "/#profissionais", label: "Especialistas" }]
      : []),
    { href: "/#contato", label: "Contato" },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          href="/"
          className="brand"
          aria-label={`${name} — página inicial`}
          onClick={() => setOpen(false)}
        >
          <span className="brand-mark">{name.charAt(0)}</span>
          <span>{name}</span>
        </Link>
        <nav
          className={open ? "nav-links nav-open" : "nav-links"}
          aria-label="Navegação principal"
        >
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/minha-conta"
            className="mobile-account"
            onClick={() => setOpen(false)}
          >
            <UserRound size={16} /> {accountLabel}
          </Link>
          <Link
            href="/agendar"
            className="button mobile-book"
            onClick={() => setOpen(false)}
          >
            Agendar horário
          </Link>
        </nav>
        <div className="header-actions">
          <Link
            href="/minha-conta"
            className={
              pathname === "/minha-conta"
                ? "account-link active"
                : "account-link"
            }
            aria-label={firstName ? `Área de ${customerName}` : "Minha conta"}
          >
            <UserRound size={16} /> <span>{accountLabel}</span>
          </Link>
          <Link href="/agendar" className="button button-small">
            Agendar horário
          </Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
