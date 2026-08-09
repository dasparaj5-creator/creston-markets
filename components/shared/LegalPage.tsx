export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: {updated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-text-primary/90">{children}</div>
    </div>
  );
}
