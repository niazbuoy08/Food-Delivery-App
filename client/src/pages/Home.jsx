import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck, Truck } from 'lucide-react';
import api from '../lib/api';
import MenuItemCard from '../components/MenuItemCard';

const PERKS = [
  { icon: Clock, title: 'Cooked to order', body: 'Nothing sits under a heat lamp. The kitchen starts the moment you check out.' },
  { icon: Truck, title: 'Free delivery over €35', body: 'A flat €3.50 below that. No surge pricing, no service fee bolted on at the end.' },
  { icon: ShieldCheck, title: 'No account needed', body: 'Choose your dishes, give us an address, pay. You are never asked to sign up.' },
];

export default function Home() {
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    // A failure here shouldn't break the landing page — the section just stays empty.
    api
      .get('/menu')
      .then(({ data }) => setPopular(data.items.filter((i) => i.isPopular).slice(0, 4)))
      .catch(() => setPopular([]));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-ink-50 to-ink-50">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="chip bg-white text-brand-700 shadow-sm ring-1 ring-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Service continu · until 23:00
            </span>

            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              The classics,
              <br />
              <span className="italic text-brand-600">cooked properly.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
              Bœuf bourguignon that took six hours. Croissants laminated over three days.
              Ordered in under a minute — no sign-up, no app to install.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu" className="btn-primary btn-lg">
                See la carte <ArrowRight size={18} />
              </Link>
              <Link to="/track" className="btn-secondary btn-lg">
                Track an order
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <img
              src="/hero.jpg"
              alt="A table laid for dinner at Bistro Lumière"
              className="aspect-square w-full rounded-3xl object-cover shadow-lift"
            />
            <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white p-4 shadow-lift">
              <p className="font-display text-2xl font-extrabold">30 min</p>
              <p className="text-xs text-ink-400">average delivery</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {popular.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Our signatures</h2>
              <p className="mt-1 text-sm text-ink-600">The dishes the kitchen is known for.</p>
            </div>
            <Link
              to="/menu"
              className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              See all →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((item, i) => (
              <MenuItemCard key={item._id} item={item} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
