export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
