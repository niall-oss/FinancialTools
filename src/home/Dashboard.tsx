import { BookOpen } from "lucide-react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FieldGrid, FieldNote } from "@/components/app/FieldChrome";
import { ConfigNumberField } from "@/components/app/NumberField";
import { taxIeConfigValues } from "@/core/irish-income-tax";
import { PROFILE_FIELDS } from "@/core/profile";
import { useConfigStore } from "@/hooks/use-config";
import { navigate } from "@/hooks/use-hash-route";
import { getTools } from "@/tools/registry";

export function Dashboard() {
  const tools = getTools();
  useConfigStore();

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto lg:grid-cols-[280px_1fr]">
      <aside className="flex min-h-0 flex-col gap-3">
        <ProfilePanel />
        <TaxBandsPanel />
      </aside>
      <section className="min-w-0">
        <h2 className="mb-3 text-sm font-semibold">Tools</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-px">
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

function ProfilePanel() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Profile
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2.5 px-3 pb-3">
        {PROFILE_FIELDS.map((field) => (
          <ConfigNumberField
            key={field.key}
            section="profile"
            configKey={field.key}
            label={field.label}
          />
        ))}
      </div>
    </Card>
  );
}

function TaxBandsPanel() {
  const config = useConfigStore();

  return (
    <Card size="sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="tax-ie" className="border-b-0 px-3">
          <AccordionTrigger className="text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:no-underline">
            Irish tax bands
          </AccordionTrigger>
          <AccordionContent>
            <FieldNote className="mb-2">
              Working 2026 rates for Irish tools. Change them to model a Budget or match a tax-credit cert.
            </FieldNote>
            <FieldGrid>
              <ConfigNumberField
                section="tax_ie"
                configKey="standard_rate_pct"
                label="Standard rate (%)"
                step={1}
              />
              <ConfigNumberField
                section="tax_ie"
                configKey="higher_rate_pct"
                label="Higher rate (%)"
                step={1}
              />
              <ConfigNumberField section="tax_ie" configKey="band_single" label="Single band (€)" step={100} />
              <ConfigNumberField section="tax_ie" configKey="band_spccc" label="SPCCC band (€)" step={100} />
              <ConfigNumberField
                section="tax_ie"
                configKey="band_married_one"
                label="Married, one income (€)"
                step={100}
              />
              <ConfigNumberField
                section="tax_ie"
                configKey="band_married_two_base"
                label="Married two-income base (€)"
                step={100}
              />
              <ConfigNumberField
                section="tax_ie"
                configKey="band_married_two_max_increase"
                label="Married two-income max extra (€)"
                step={100}
              />
            </FieldGrid>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => config.setSection("tax_ie", taxIeConfigValues())}
            >
              Reset to 2026
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
