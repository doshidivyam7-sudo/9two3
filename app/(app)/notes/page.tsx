import { FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { NewNoteDialog } from "./_new-note";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await auth();
  const notes = await prisma.researchNote.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <FileText className="h-5 w-5" /> Research Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investment journals, channel checks, meeting notes — kept with your theses.
          </p>
        </div>
        <NewNoteDialog />
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">No notes yet. Capture your first research observation.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <Card key={n.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs normal-case tracking-normal">{n.ticker ?? "General"}</CardTitle>
                  {n.pinned && <Badge variant="default">Pinned</Badge>}
                </div>
                <div className="mt-1 text-sm font-semibold">{n.title}</div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground line-clamp-6">{n.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="flex flex-wrap gap-1">
                    {n.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                  <span className="text-muted-foreground">{fmtDate(n.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
