export default function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6">
      <h3 className="text-lg font-semibold text-rose-200">{title}</h3>
      <p className="mt-2 text-sm text-rose-100/90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
