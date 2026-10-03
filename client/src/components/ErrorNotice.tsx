interface Props {
  message: string;
  onRetry: () => void;
}

export default function ErrorNotice({ message, onRetry }: Props) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-semibold">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-field bg-white px-4 text-sm font-semibold transition-colors hover:bg-wash"
      >
        Retry
      </button>
    </div>
  );
}
