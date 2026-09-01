import { Link } from "react-router-dom";

const adminCards = [
  {
    id: "ctf",
    eyebrow: "Games Admin",
    title: "CTF Admin",
    description: "Open the CTF control area and manage the full challenge flow.",
    actionLabel: "Open CTF Admin",
    actionTo: "/games/ctf/categories",
    accent: "from-sky-600 via-cyan-500 to-teal-500",
    items: [
      "CTF Categories",
      "CTF Challenges",
      "CTF Hints",
      "Announcements",
      "Teams",
      "Leaderboard",
    ],
  },
  {
    id: "escape",
    eyebrow: "Games Admin",
    title: "Escape Room Admin",
    description: "Open the Escape Room control area and manage rooms and attempts.",
    actionLabel: "Open Escape Admin",
    actionTo: "/games/escape-rooms",
    accent: "from-emerald-600 via-teal-500 to-cyan-500",
    items: ["Escape Room", "Attempts"],
  },
];

export default function Dashboard() {
  return (
    <section className="flex justify-center py-6 md:py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-2">
        {adminCards.map((card) => (
          <article
            key={card.id}
            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(80,108,150,0.12)]"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${card.accent}`} />
            <div className="flex h-full flex-col p-6 md:p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {card.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-800">Includes</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={card.actionTo}
                className={`mt-6 inline-flex w-fit rounded-2xl bg-gradient-to-r ${card.accent} px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] transition hover:scale-[1.01]`}
              >
                {card.actionLabel}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
