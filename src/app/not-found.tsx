import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
      <p className="text-sm text-foreground/70 mt-2">Dossier or page not found.</p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary-hover transition-colors"
      >
        Return to Workbench
      </Link>
    </div>
  );
}
