import "server-only";
import { randomUUID } from "node:crypto";
import type { FittingRequest, FittingStatus } from "@sarpech/core/types";
import { db, nowIso, parseJson } from "./db";

/* ───────────── Newsletter ───────────── */

export function addSubscriber(email: string) {
  const r = db().prepare("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)").run(email.toLowerCase(), nowIso());
  return Number(r.changes) > 0;
}

export function listSubscribers() {
  return db().prepare("SELECT email, created_at AS createdAt FROM subscribers ORDER BY created_at DESC").all() as {
    email: string;
    createdAt: string;
  }[];
}

export function removeSubscriber(email: string) {
  db().prepare("DELETE FROM subscribers WHERE email = ?").run(email);
}

/* ───────────── Fitting requests ───────────── */

export function addFitting(data: Record<string, string>): FittingRequest {
  const id = randomUUID();
  const createdAt = nowIso();
  db().prepare("INSERT INTO fittings (id, created_at, status, data) VALUES (?, ?, 'new', ?)").run(id, createdAt, JSON.stringify(data));
  return { id, createdAt, status: "new", data };
}

export function listFittings(): FittingRequest[] {
  return (
    db().prepare("SELECT * FROM fittings ORDER BY created_at DESC").all() as {
      id: string;
      created_at: string;
      status: FittingStatus;
      data: string;
    }[]
  ).map((r) => ({ id: r.id, createdAt: r.created_at, status: r.status, data: parseJson(r.data, {}) }));
}

export function setFittingStatus(id: string, status: FittingStatus) {
  db().prepare("UPDATE fittings SET status = ? WHERE id = ?").run(status, id);
}

export function newFittingsCount() {
  return (db().prepare("SELECT COUNT(*) AS n FROM fittings WHERE status = 'new'").get() as { n: number }).n;
}

export function subscriberCount() {
  return (db().prepare("SELECT COUNT(*) AS n FROM subscribers").get() as { n: number }).n;
}
