// app/api/sync/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromCookie } from '@/lib/cookies';
import { decrypt } from '@/lib/crypto';
import { getCalendarEvents, fetchCanvasJson, getAllWithPagination } from '@/lib/canvas';

const prisma = new PrismaClient();

// simple per-user rate limit (memory)
const syncRateLimit = new Map<string, { count: number; resetTime: number }>();
const SYNC_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const SYNC_RATE_LIMIT_MAX = 5; // 5 syncs/min

function checkSyncRateLimit(userId: string): boolean {
  const now = Date.now();
  const u = syncRateLimit.get(userId);
  if (!u || now > u.resetTime) {
    syncRateLimit.set(userId, { count: 1, resetTime: now + SYNC_RATE_LIMIT_WINDOW });
    return true;
  }
  if (u.count >= SYNC_RATE_LIMIT_MAX) return false;
  u.count++;
  return true;
}

export async function POST(_req: NextRequest) {
  try {
    // 1) auth
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // 2) rate limit
    if (!checkSyncRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many sync requests. Please wait before syncing again.' },
        { status: 429 }
      );
    }

    // 3) user + decrypt
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const token = await decrypt(user.encToken, user.iv);

    // 4) date window (past 14d → next 120d; full ISO)
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const end = new Date();
    end.setDate(end.getDate() + 120);
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // 5) try calendar_events first
    const calEvents = await getCalendarEvents(user.canvasBaseUrl, token, startISO, endISO);
    const gathered: Array<any> = [];

    for (const ev of calEvents) {
      if (ev.type !== 'assignment' && !ev.assignment) continue;
      const a = ev.assignment;
      gathered.push({
        canvasId: a?.id ?? ev.id,
        courseId: a?.course_id ?? 0,
        courseName: ev.context_name ?? 'Unknown Course',
        title: a?.name ?? ev.title ?? 'Untitled',
        htmlUrl: a?.html_url ?? ev.html_url ?? ev.url ?? '',
        dueAtISO: a?.due_at ?? ev.due_at ?? null,
        pointsPossible: a?.points_possible ?? null,
        rawDescription: a?.description ?? ev.description ?? null,
      });
    }

    // 6) if empty, fallback to /courses + /assignments
    if (gathered.length === 0) {
      // get active courses
      const courses = await getAllWithPagination<any>(
        user.canvasBaseUrl,
        `/courses?enrollment_state=active&per_page=100`,
        token
      );

      // fetch assignments per course; include big windows & per_page
      for (const c of courses) {
        if (!c?.id) continue;
        const courseId = Number(c.id);
        const courseName = c.name ?? 'Unknown Course';

        // pull all upcoming + past window
        const courseAssignments = await getAllWithPagination<any>(
          user.canvasBaseUrl,
          `/courses/${courseId}/assignments?per_page=100`,
          token
        );

        for (const a of courseAssignments) {
          // keep assignments within our window if due_at exists; otherwise include undated too
          const dueAtISO: string | null = a.due_at ?? null;
          const include =
            !dueAtISO ||
            (new Date(dueAtISO) >= start && new Date(dueAtISO) <= end);

          if (!include) continue;

          gathered.push({
            canvasId: a.id,
            courseId,
            courseName,
            title: a.name ?? 'Untitled',
            htmlUrl: a.html_url ?? a.url ?? '',
            dueAtISO,
            pointsPossible: a.points_possible ?? null,
            rawDescription: a.description ?? null,
          });
        }
      }
    }

    // 7) upsert to DB
    let created = 0, updated = 0;
    for (const it of gathered) {
      if (!it.canvasId) continue;

      const existing = await prisma.assignment.findFirst({
        where: { userId: user.id, canvasId: it.canvasId }
      });

      const data = {
        userId: user.id,
        canvasId: it.canvasId,
        courseId: it.courseId ?? 0,
        courseName: it.courseName ?? 'Unknown Course',
        title: it.title ?? 'Untitled',
        htmlUrl: it.htmlUrl ?? '',
        dueAt: it.dueAtISO ? new Date(it.dueAtISO) : null,
        pointsPossible: it.pointsPossible ?? null,
        rawDescription: it.rawDescription ?? null,
      };

      if (existing) {
        await prisma.assignment.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.assignment.create({
          data: { ...data, status: 'planned', strategy: 'even' }
        });
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      counts: { created, updated, fetched: gathered.length }
    });
  } catch (e: any) {
    console.error('SYNC ERROR:', e?.message || e);
    if (e instanceof Error && e.message.includes('Invalid Canvas token')) {
      return NextResponse.json({ error: 'Canvas token is invalid. Please reconnect.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to sync assignments. Please try again.' }, { status: 500 });
  }
}
