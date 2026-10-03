"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleProvider";

const NAV = [
  { href: "/", key: "nav.journeys" },
  { href: "/benefits", key: "nav.benefits" },
  { href: "/calendar", key: "nav.calendar" },
  { href: "/about", key: "nav.about" },
] as const;

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 glass border-b border-indigo-ink/[0.08] px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-offset-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-saffron to-saffron-deep text-white grid place-items-center font-bold shadow-md shadow-saffron/30 ring-1 ring-white/40 ring-inset">
            {icon}
          </div>
          <div>
            <h1 className="font-display font-semibold text-indigo-ink text-lg leading-tight tracking-tight">{title}</h1>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 text-[13px] ml-auto">
          <nav className="flex items-center gap-1 rounded-full glass ring-1 ring-indigo-ink/[0.07] shadow-sm p-1">
            {NAV.map(({ href, key }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    active
                      ? "bg-indigo-ink text-white shadow-sm"
                      : "text-slate-600 hover:text-saffron hover:bg-white/80"
                  }`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>
          {actions}
        </div>
      </div>
      <div className="hairline" aria-hidden />
    </header>
  );
}
