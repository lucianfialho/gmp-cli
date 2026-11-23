import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMaxBytes, formatBytes, runBqQuery, costSummary } from "../dist/commands/bq/shared.js";

function fakeBigquery(response) {
  const calls = [];
  return {
    calls,
    jobs: {
      query: async (req) => {
        calls.push(req);
        return { data: response };
      },
      getQueryResults: async () => ({ data: { rows: [] } }),
    },
  };
}

test("parseMaxBytes aceita número puro e sufixos (base 1024)", () => {
  assert.equal(parseMaxBytes("500000000"), 500000000);
  assert.equal(parseMaxBytes("1KB"), 1024);
  assert.equal(parseMaxBytes("500mb"), 500 * 1024 ** 2);
  assert.equal(parseMaxBytes("1.5GB"), Math.floor(1.5 * 1024 ** 3));
});

test("parseMaxBytes rejeita zero, negativo e lixo", () => {
  for (const bad of ["0", "-5", "abc", "10XB", ""]) {
    assert.throws(() => parseMaxBytes(bad), /Invalid --max-bytes/);
  }
});

test("formatBytes escolhe a unidade", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1536), "1.50 KB");
  assert.equal(formatBytes(5 * 1024 ** 3), "5.00 GB");
});

test("sem opções de custo, o corpo da requisição não muda", async () => {
  const bq = fakeBigquery({ schema: { fields: [] }, rows: [] });
  await runBqQuery(bq, "p", "SELECT 1");
  const body = bq.calls[0].requestBody;
  assert.equal(body.dryRun, undefined);
  assert.equal(body.maximumBytesBilled, undefined);
  assert.equal(body.maxResults, 10000);
});

test("dryRun e maxBytes vão no corpo; maximumBytesBilled como string", async () => {
  const bq = fakeBigquery({ totalBytesProcessed: "1073741824", cacheHit: false });
  const r = await runBqQuery(bq, "p", "SELECT 1", { dryRun: true, maxBytes: 2_000_000_000 });
  const body = bq.calls[0].requestBody;
  assert.equal(body.dryRun, true);
  assert.equal(body.maximumBytesBilled, "2000000000");
  assert.equal(r.bytesProcessed, 1073741824);
  assert.deepEqual(r.rows, []);
  assert.match(costSummary(r, { dryRun: true }), /dry-run: would process 1\.00 GB/);
});

test("execução normal devolve bytesProcessed e cacheHit", async () => {
  const bq = fakeBigquery({
    schema: { fields: [{ name: "n" }] },
    rows: [{ f: [{ v: "7" }] }],
    totalRows: "1",
    totalBytesProcessed: "2048",
    cacheHit: true,
  });
  const r = await runBqQuery(bq, "p", "SELECT 7 AS n");
  assert.deepEqual(r.rows, [{ n: "7" }]);
  assert.equal(r.bytesProcessed, 2048);
  assert.match(costSummary(r, {}), /# processed 2\.00 KB \(2048 bytes\) \(cache hit\)/);
});
