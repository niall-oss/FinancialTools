import { ExternalLink, Link } from "@/components/app/Link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolDefinition } from "@/core/types";
import type { LearnSource } from "@/learn/types";

function sourceLookup(sources: LearnSource[]): Map<string, LearnSource> {
  return new Map(sources.map((source) => [source.id, source]));
}

export function LearnPage({ tool }: { tool: ToolDefinition }) {
  const { learn } = tool;
  const byId = sourceLookup(learn.sources);
  const firstTopic = learn.topics[0]?.id;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <Link href="#/" className="text-xs text-muted-foreground hover:text-foreground">
            ← All tools
          </Link>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight">{tool.title}</h1>
          <p className="text-xs text-muted-foreground">Learn</p>
        </div>
        <Link
          href={`#/${tool.id}`}
          className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open calculator
        </Link>
      </header>

      <p className="mb-4 max-w-prose text-sm leading-relaxed">{learn.overview}</p>

      <Accordion
        type="multiple"
        defaultValue={firstTopic ? [firstTopic] : []}
        className="max-w-prose rounded-lg border border-border bg-card px-3"
      >
        {learn.topics.map((topic) => {
          const refs = topic.sourceIds
            .map((id) => byId.get(id))
            .filter((source): source is LearnSource => Boolean(source));
          const paragraphs = topic.body.split("\n\n");
          return (
            <AccordionItem key={topic.id} value={topic.id}>
              <AccordionTrigger>{topic.title}</AccordionTrigger>
              <AccordionContent className="[&_p:not(:last-child)]:mb-2">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {refs.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    References:{" "}
                    {refs.map((source, index) => (
                      <span key={source.id}>
                        {index > 0 ? ", " : null}
                        <ExternalLink href={source.url}>{source.title}</ExternalLink>
                      </span>
                    ))}
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <section className="mt-6 max-w-prose">
        <h2 className="mb-2 text-sm font-semibold">Official sources</h2>
        <ul className="flex flex-col gap-2">
          {learn.sources.map((source) => (
            <li key={source.id} className="text-sm leading-snug">
              <ExternalLink href={source.url}>{source.title}</ExternalLink>
              <span className="text-muted-foreground"> · {source.publisher}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-snug text-muted-foreground">
          Illustrative only, not advice. Rules and rates change. Read the linked pages before you act.
        </p>
      </section>
    </div>
  );
}
