import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDateRange } from "../dist/commands/gsc/date-range.js";

// "Hoje" fixo, ao meio-dia UTC, para o resultado não depender do relógio nem do fuso do host.
const NOW = new Date("2026-03-15T12:00:00Z");
const mockNow = (t) => t.mock.timers.enable({ apis: ["Date"], now: NOW });

test("intervalo explícito: devolve as duas datas sem alterar", () => {
  assert.deepEqual(parseDateRange("2026-04-01..2026-04-30"), {
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  });
});

test("intervalo explícito de um único dia (borda: limite)", () => {
  assert.deepEqual(parseDateRange("2026-04-01..2026-04-01"), {
    startDate: "2026-04-01",
    endDate: "2026-04-01",
  });
});

test("intervalo explícito não depende da data atual", (t) => {
  mockNow(t);
  assert.deepEqual(parseDateRange("2020-01-01..2020-01-31"), {
    startDate: "2020-01-01",
    endDate: "2020-01-31",
  });
});

test("'7d': termina 3 dias atrás (atraso do GSC) e começa 7 dias antes", (t) => {
  mockNow(t);
  assert.deepEqual(parseDateRange("7d"), { startDate: "2026-03-05", endDate: "2026-03-12" });
});

test("'30d': atravessa a virada de mês", (t) => {
  mockNow(t);
  assert.deepEqual(parseDateRange("30d"), { startDate: "2026-02-10", endDate: "2026-03-12" });
});

test("'0d': início e fim iguais (borda: limite)", (t) => {
  mockNow(t);
  assert.deepEqual(parseDateRange("0d"), { startDate: "2026-03-12", endDate: "2026-03-12" });
});

test("virada de ano: o fim cai no ano anterior", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-01-02T12:00:00Z") });
  assert.deepEqual(parseDateRange("7d"), { startDate: "2025-12-23", endDate: "2025-12-30" });
});

test("string vazia usa o padrão de 28 dias (borda: vazio)", (t) => {
  mockNow(t);
  assert.deepEqual(parseDateRange(""), { startDate: "2026-02-12", endDate: "2026-03-12" });
});

test("entrada não reconhecida usa o padrão de 28 dias (borda: entrada inválida)", (t) => {
  mockNow(t);
  const padrao = { startDate: "2026-02-12", endDate: "2026-03-12" };
  for (const entrada of ["abc", "7", "d", "-7d", "7days", " 7d"]) {
    assert.deepEqual(parseDateRange(entrada), padrao, `entrada: ${JSON.stringify(entrada)}`);
  }
});
