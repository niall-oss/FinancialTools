import { BookOpen } from "lucide-react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "@/components/app/ProfileSettings";
import { useIsLg } from "@/hooks/use-media-query";
import { navigate } from "@/hooks/use-hash-route";
import { getTools } from "@/tools/registry";

export function Dashboard() {
  const tools = getTools();
  const isLg = useIsLg();

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto lg:grid-cols-[280px_1fr]">
      {isLg ? (
        <aside className="flex min-h-0 flex-col gap-3">
          <ProfileSettings />
        </aside>
      ) : null}
      <section className="min-w-0">
        <h2 className="mb-3 text-sm font-semibold">Tools</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-px">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} size="sm" className="h-full min-w-0 transition-colors hover:ring-primary/40">
                <CardHeader>
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`Learn more about ${tool.title}`}
                      onClick={() => navigate(`learn/${tool.id}`)}
                    >
                      <BookOpen />
                    </Button>
                  </CardAction>
                  <button type="button" className="min-w-0 w-full text-left" onClick={() => navigate(tool.id)}>
                    <Icon className="mb-1 size-5 text-primary" />
                    <CardTitle>{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </button>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
