import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { GlobalSearch } from '@/components/global-search';
import { AdminIcon, ShieldIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { SiteNav } from '@/components/site-nav';
import './globals.css';

const fontSans = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EuroZoo Atlas — европейский атлас зоопарков, видов и сохранения',
    template: '%s — EuroZoo Atlas',
  },
  description:
    'Европейский атлас зоопарков, биологических видов, программ сохранения EEP/ESB и научных связей. Каждый опубликованный факт верифицирован первоисточником.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={fontSans.variable}>
      <body>
        <header className="site-header-dock">
          <div className="container">
            <div className="dock-capsule">
              <Logo />

              <SiteNav />

              <div className="header-tools">
                <div className="header-search">
                  <GlobalSearch />
                </div>
                <Link
                  href="/sources"
                  className="header-pill-btn"
                  title="Реестр верифицированных первоисточников"
                >
                  <ShieldIcon size={15} />
                  <span className="hidden xl:inline">Провенанс</span>
                </Link>
                <Link
                  href="/admin"
                  className="header-admin"
                  aria-label="Административная панель"
                  title="Панель куратора"
                >
                  <AdminIcon size={16} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="container page-shell">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <Logo compact />
              </div>
              <div>
                <h2>Разделы</h2>
                <ul className="footer-links">
                  <li>
                    <Link href="/zoos">Зоопарки</Link>
                  </li>
                  <li>
                    <Link href="/species">Виды</Link>
                  </li>
                  <li>
                    <Link href="/countries">География</Link>
                  </li>
                  <li>
                    <Link href="/programs">Программы</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h2>Данные</h2>
                <ul className="footer-links">
                  <li>
                    <Link href="/graph">Граф знаний</Link>
                  </li>
                  <li>
                    <Link href="/sources">Источники</Link>
                  </li>
                  <li>
                    <Link href="/research">Исследования</Link>
                  </li>
                  <li>
                    <Link href="/admin">Панель куратора</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© 2026 EuroZoo Atlas</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
