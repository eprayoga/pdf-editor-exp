import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  FilePdf,
  GithubLogo,
  Layout,
  Signature,
} from "@phosphor-icons/react/dist/ssr";

const GITHUB_URL = "https://github.com/eprayoga/pdf-editor-exp";

type Experiment = {
  href: string;
  title: string;
  description: string;
  icon: ElementType;
  tags: string[];
};

const EXPERIMENTS: Experiment[] = [
  {
    href: "/pdf-me",
    title: "pdfme",
    description:
      "Template-based PDF designer powered by pdfme. Build reusable layouts with fields, custom fonts, and a signature plugin, then generate PDFs from data.",
    icon: Layout,
    tags: ["pdfme", "Template Designer", "Generator"],
  },
  {
    href: "/pdf-paperless",
    title: "PDF Paperless",
    description:
      "Upload an existing PDF and place signatures, text, multiline text, QR codes, and images with precise PDF coordinates, then export using pdf-lib.",
    icon: Signature,
    tags: ["pdf-lib", "PDF.js", "Signature", "QR Code"],
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FilePdf className="h-4 w-4" weight="bold" />
            </div>
            <span className="text-sm font-semibold">PDF Experimental</span>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GithubLogo className="h-4 w-4" />
            <span className="hidden sm:inline">View on GitHub</span>
            <span className="sm:hidden">GitHub</span>
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Experiments
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            PDF Experimental
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            by{" "}
            <span className="font-medium text-foreground">Endang Prayoga</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A small playground for exploring different approaches to creating
            and editing PDF documents in the browser.
          </p>
        </section>

        <section aria-labelledby="experiments-heading" className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="experiments-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Experiments
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {EXPERIMENTS.length} projects
            </span>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {EXPERIMENTS.map((experiment) => {
              const ExperimentIcon = experiment.icon;
              return (
                <li key={experiment.href}>
                  <Link
                    href={experiment.href}
                    className="group flex h-full flex-col rounded-xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50 text-foreground">
                        <ExperimentIcon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {experiment.href}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold">
                      {experiment.title}
                    </h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {experiment.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {experiment.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-1.5 border-t pt-4 text-sm font-medium">
                      Open experiment
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border bg-background p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GithubLogo className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Source code on GitHub</h2>
              <p className="text-xs text-muted-foreground">
                github.com/eprayoga/pdf-editor-exp
              </p>
            </div>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Open repository
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Endang Prayoga</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <GithubLogo className="h-3.5 w-3.5" />
            eprayoga/pdf-editor-exp
          </a>
        </div>
      </footer>
    </div>
  );
}
