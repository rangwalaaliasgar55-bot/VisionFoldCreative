#!/usr/bin/env node
/**
 * Email layer tests — transport behaviour and template safety.
 *
 * The transport is exercised with a stub, so this proves retry/failure
 * behaviour without sending mail or needing a key.
 *
 * Usage: npx tsx scripts/check-email.mjs
 */
import { sendEmail, sendAll, emailStatus } from "../src/lib/email";
import {
  escapeHtml,
  newLeadEmail,
  leadAutoReplyEmail,
  invoiceOverdueEmail,
  digestEmail,
} from "../src/lib/emailTemplates";

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

const KEY = "re_testkey_ABCDEFGH12345678";
const stub = (responses) => {
  const calls = [];
  let i = 0;
  const fn = async (url, init) => {
    calls.push({ url, init });
    const r = responses[Math.min(i++, responses.length - 1)];
    if (r.throw) throw new Error(r.throw);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body ?? {},
      text: async () => JSON.stringify(r.body ?? {}),
    };
  };
  fn.calls = calls;
  return fn;
};

const payload = { to: "a@b.com", subject: "S", html: "<p>H</p>", text: "H" };

/* --- not configured: must skip silently, never call out --- */
let fetchStub = stub([{ status: 200 }]);
let res = await sendEmail(payload, { fetch: fetchStub, apiKey: "" });
check("no key → skipped", res.ok === false && res.skipped === true);
check("no key → no network call", fetchStub.calls.length === 0);

/* --- happy path --- */
fetchStub = stub([{ status: 200, body: { id: "email_123" } }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, from: "Studio <x@y.com>" });
check("sends successfully", res.ok === true && res.id === "email_123");
const call = fetchStub.calls[0];
check("hits the Resend endpoint", call.url === "https://api.resend.com/emails");
check("sends the auth header", call.init.headers.Authorization === `Bearer ${KEY}`);
const sent = JSON.parse(call.init.body);
check("from is set", sent.from === "Studio <x@y.com>");
check("to is an array", Array.isArray(sent.to) && sent.to[0] === "a@b.com");
check("html and text both sent", Boolean(sent.html) && Boolean(sent.text));

/* --- reply-to and tags --- */
fetchStub = stub([{ status: 200, body: {} }]);
await sendEmail({ ...payload, replyTo: "lead@x.com", tag: "lead" }, { fetch: fetchStub, apiKey: KEY });
const tagged = JSON.parse(fetchStub.calls[0].init.body);
check("reply_to passed through", tagged.reply_to === "lead@x.com");
check("tag passed through", tagged.tags?.[0]?.value === "lead");

/* --- retries: 500 then success --- */
fetchStub = stub([{ status: 500 }, { status: 200, body: { id: "ok" } }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0 });
check("retries a 500 and succeeds", res.ok === true && fetchStub.calls.length === 2);

/* --- 429 is retried --- */
fetchStub = stub([{ status: 429 }, { status: 200, body: {} }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0 });
check("retries a 429", res.ok === true && fetchStub.calls.length === 2);

/* --- 422 is NOT retried (our fault, retrying is pointless) --- */
fetchStub = stub([{ status: 422, body: { message: "bad address" } }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0 });
check("gives up on 4xx", res.ok === false && fetchStub.calls.length === 1);

/* --- exhausts retries without throwing --- */
fetchStub = stub([{ status: 500 }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0, maxAttempts: 3 });
check("gives up after maxAttempts", res.ok === false && fetchStub.calls.length === 3);

/* --- network explosion must not throw --- */
fetchStub = stub([{ throw: "ECONNRESET" }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0, maxAttempts: 2 });
check("network failure returns, never throws", res.ok === false);

/* --- the key must never leak into an error --- */
fetchStub = stub([{ throw: `bad key ${KEY} rejected` }]);
res = await sendEmail(payload, { fetch: fetchStub, apiKey: KEY, backoffMs: 0, maxAttempts: 1 });
check("key redacted from errors", !JSON.stringify(res).includes(KEY));
check("status never exposes the key", !JSON.stringify(emailStatus()).includes("re_"));

/* --- one failure must not sink the batch --- */
let n = 0;
const mixed = async () => {
  n++;
  if (n === 1) throw new Error("boom");
  return { ok: true, status: 200, json: async () => ({ id: "x" }), text: async () => "" };
};
const batch = await sendAll([payload, payload], { fetch: mixed, apiKey: KEY, backoffMs: 0, maxAttempts: 1 });
check("batch isolates failures", batch.length === 2 && batch.some((r) => r.ok) && batch.some((r) => !r.ok));

/* --- templates ---------------------------------------------------- */
check("escapes angle brackets", escapeHtml('<script>x</script>') === "&lt;script&gt;x&lt;/script&gt;");
check("escapes quotes", escapeHtml('a"b\'c') === "a&quot;b&#39;c");

const hostile = {
  name: '<img src=x onerror="alert(1)">',
  email: "a@b.com",
  message: "Line one\nLine two <b>bold</b>",
  service: "Brand film",
};
const lead = newLeadEmail(hostile);
check("lead email escapes injected HTML", !lead.html.includes("onerror=\"alert(1)\""));
check("lead email keeps the raw text version", lead.text.includes("Line two"));
check("lead email keeps line breaks in html", lead.html.includes("<br>"));
check("lead subject has no newline (header injection)", !/[\r\n]/.test(lead.subject));

const templates = [
  newLeadEmail({ name: "Sam", email: "s@x.com", message: "Hello there, a real brief." }),
  leadAutoReplyEmail({ name: "Sam Rivera" }),
  invoiceOverdueEmail({ number: "INV-4", amount: "12,000", daysOverdue: 6, clientName: "Nova" }),
  digestEmail([{ title: "Invoice overdue", detail: "6 days", severity: "high" }]),
  digestEmail([]),
];
for (const [i, t] of templates.entries()) {
  check(`template ${i}: has a subject`, Boolean(t.subject) && t.subject.length < 120);
  check(`template ${i}: no newline in subject`, !/[\r\n]/.test(t.subject));
  check(`template ${i}: html and text both present`, t.html.length > 200 && t.text.length > 20);
  check(`template ${i}: no unresolved templates`, !/\$\{|undefined|\[object/.test(t.html + t.text));
  check(`template ${i}: has a preheader`, t.html.includes("max-height:0"));
  check(`template ${i}: links are absolute`, !/href="\//.test(t.html));
}
check("auto-reply greets by first name only", leadAutoReplyEmail({ name: "Sam Rivera" }).text.startsWith("Thanks, Sam "));
check("auto-reply handles a blank name", leadAutoReplyEmail({ name: "  " }).text.includes("there"));
check("digest pluralises", digestEmail([{ title: "a", detail: "b", severity: "low" }]).subject.includes("1 thing need"));
check("empty digest says so", digestEmail([]).subject.toLowerCase().includes("nothing"));

if (failures.length) {
  console.error(`✗ ${failures.length} email assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log("✓ email: transport retries, failure isolation, key redaction and template escaping all hold");
