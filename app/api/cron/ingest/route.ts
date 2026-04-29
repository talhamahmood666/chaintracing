import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const script = resolve(process.cwd(), "scripts/ingest/run-all.ts");

  try {
    const { stdout, stderr } = await execFileAsync("npx", ["tsx", script], {
      env: { ...process.env },
      timeout: 270_000,
    });
    if (stderr) console.warn("[cron/ingest] stderr:", stderr);

    // Extract summary lines from stdout
    const lines = stdout.split("\n").filter((l) => l.startsWith("  "));
    const summary: Record<string, string> = {};
    for (const line of lines) {
      const m = line.trim().match(/^(\w+):\s+(.+)$/);
      if (m) summary[m[1]] = m[2];
    }

    return Response.json({ ok: true, summary, log: stdout.slice(-2000) });
  } catch (err) {
    console.error("[cron/ingest] failed:", err);
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
