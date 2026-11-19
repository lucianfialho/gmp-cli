import { test } from "node:test";
import assert from "node:assert/strict";
import { paginateByOffset } from "../dist/lib/paginate.js";
import { runPaginatedReport } from "../dist/commands/ga/helpers.js";

/**
 * runReport falso: o relatório tem `total` linhas, mas cada chamada devolve no
 * máximo `cap` linhas (como a API faz com o limit default de 10.000).
 */
function fakeRunReport(total, cap = 10000) {
  const calls = [];
  const runReport = async ({ property, requestBody }) => {
    calls.push({ property, offset: Number(requestBody.offset), limit: Number(requestBody.limit) });
    const offset = Number(requestBody.offset);
    const n = Math.max(0, Math.min(Number(requestBody.limit), cap, total - offset));
    const rows = Array.from({ length: n }, (_, i) => ({
      dimensionValues: [{ value: `/p/${offset + i}` }],
      metricValues: [{ value: String(offset + i) }],
    }));
    return {
      data: {
        dimensionHeaders: [{ name: "pagePath" }],
        metricHeaders: [{ name: "screenPageViews" }],
        rows,
        rowCount: total,
      },
    };
  };
  return { runReport, calls };
}

test("sem --limit: 11.698 linhas em duas páginas devolve todas, em ordem", async () => {
  const { runReport, calls } = fakeRunReport(11698);
  const r = await runPaginatedReport(runReport, "properties/1", { metrics: [{ name: "screenPageViews" }] });
  assert.equal(r.rows.length, 11698);
  assert.equal(r.total, 11698);
  assert.equal(r.truncated, false);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((c) => c.offset), [0, 10000]);
  assert.equal(calls[1].limit, 1698);
  assert.equal(r.rows[0].dimensionValues[0].value, "/p/0");
  assert.equal(r.rows[11697].dimensionValues[0].value, "/p/11697");
  assert.deepEqual(r.first.dimensionHeaders, [{ name: "pagePath" }]);
});

test("sem --limit: nunca pede mais de 250.000 linhas por requisição", async () => {
  const { runReport, calls } = fakeRunReport(600000, 250000);
  const r = await runPaginatedReport(runReport, "properties/1", {});
  assert.equal(r.rows.length, 600000);
  assert.ok(calls.every((c) => c.limit <= 250000));
  assert.deepEqual(calls.map((c) => c.offset), [0, 250000, 500000]);
});

test("com --limit N explícito: devolve N linhas, total real e truncated", async () => {
  const { runReport, calls } = fakeRunReport(11698);
  const r = await runPaginatedReport(runReport, "properties/1", {}, { limit: 500 });
  assert.equal(r.rows.length, 500);
  assert.equal(r.total, 11698);
  assert.equal(r.truncated, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].limit, 500);
});

test("--limit maior que o total devolve tudo sem truncar", async () => {
  const { runReport } = fakeRunReport(42);
  const r = await runPaginatedReport(runReport, "properties/1", {}, { limit: 1000 });
  assert.equal(r.rows.length, 42);
  assert.equal(r.truncated, false);
});

test("relatório vazio: uma chamada, zero linhas", async () => {
  const { runReport, calls } = fakeRunReport(0);
  const r = await runPaginatedReport(runReport, "properties/1", {});
  assert.equal(r.rows.length, 0);
  assert.equal(r.truncated, false);
  assert.equal(calls.length, 1);
});

test("página vazia antes do total: para e marca truncated (não falha em silêncio)", async () => {
  let call = 0;
  const fetchPage = async () => (call++ === 0 ? { items: [1, 2, 3], total: 10 } : { items: [], total: 10 });
  const r = await paginateByOffset(fetchPage, { pageSize: 3 });
  assert.deepEqual(r.items, [1, 2, 3]);
  assert.equal(r.total, 10);
  assert.equal(r.truncated, true);
  assert.equal(r.stoppedEarly, true);
  assert.equal(call, 2);
});

test("sem --limit: --max-rows limita o total buscado e marca truncated", async () => {
  const { runReport, calls } = fakeRunReport(11698);
  const r = await runPaginatedReport(runReport, "properties/1", {}, { maxRows: 10500 });
  assert.equal(r.rows.length, 10500);
  assert.equal(r.total, 11698);
  assert.equal(r.truncated, true);
  assert.equal(r.stoppedEarly, false);
  assert.deepEqual(calls.map((c) => [c.offset, c.limit]), [[0, 10500], [10000, 500]]);
});

test("--limit acima do tamanho de página percorre várias páginas", async () => {
  const { runReport, calls } = fakeRunReport(30000);
  const r = await runPaginatedReport(runReport, "properties/1", {}, { limit: 25000 });
  assert.equal(r.rows.length, 25000);
  assert.equal(r.truncated, true);
  assert.deepEqual(calls.map((c) => c.offset), [0, 10000, 20000]);
  assert.equal(calls[2].limit, 5000);
});

test("rowCount ausente: mantém as linhas e segue até uma página curta", async () => {
  const pages = [[1, 2, 3], [4, 5, 6], [7]];
  const offsets = [];
  const fetchPage = async (offset) => {
    offsets.push(offset);
    return { items: pages[offsets.length - 1], total: undefined };
  };
  const r = await paginateByOffset(fetchPage, { pageSize: 3 });
  assert.deepEqual(r.items, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(r.total, 7);
  assert.equal(r.truncated, false);
  assert.deepEqual(offsets, [0, 3, 6]);
});

test("--limit com API parando antes: stoppedEarly distingue do corte pedido", async () => {
  let call = 0;
  const fetchPage = async () => (call++ === 0 ? { items: [1, 2], total: 10 } : { items: [], total: 10 });
  const r = await paginateByOffset(fetchPage, { limit: 5, pageSize: 2 });
  assert.deepEqual(r.items, [1, 2]);
  assert.equal(r.stoppedEarly, true);
  assert.equal(r.truncated, true);
});
