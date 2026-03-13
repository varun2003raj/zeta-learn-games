export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-blue-400" />
      <span>{label}</span>
    </div>
  );
}
