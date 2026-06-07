export default function SimpleCoreApplicationNotFound() {
  return (
    <main className="min-h-screen bg-surface">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded border border-line bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Application not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">Loan application unavailable</h1>
          <p className="mt-3 text-slate-600">
            This loan application could not be found. Please start a new application or check your application link.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/app/apply"
              className="focus-ring rounded bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Start application
            </a>
            <a
              href="/app/admin/applications"
              className="focus-ring rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-surface"
            >
              Admin applications
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
