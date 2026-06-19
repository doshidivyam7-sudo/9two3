"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab {
  value: string;
  label: string;
  content: React.ReactNode;
}

export function TabsShell({ tabs, ticker }: { tabs: Tab[]; ticker: string }) {
  return (
    <Tabs defaultValue={tabs[0].value} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="min-w-fit">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-6">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
