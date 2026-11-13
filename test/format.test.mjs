import { test } from "node:test";
import assert from "node:assert/strict";
import { formatOutput } from "../dist/lib/format.js";

const rows = [
  { page: "/home", clicks: 10 },
  { page: "/blog", clicks: 3 },
];

test("json: serializa as linhas com indentação de 2 espaços", () => {
  const out = formatOutput(rows, "json");
  assert.equal(out, JSON.stringify(rows, null, 2));
  assert.deepEqual(JSON.parse(out), rows);
});

test("json: lista vazia vira '[]' (borda: vazio)", () => {
  assert.equal(formatOutput([], "json"), "[]");
});

test("csv: cabeçalho vem das chaves da primeira linha", () => {
  assert.equal(formatOutput(rows, "csv"), "page,clicks\n/home,10\n/blog,3");
});

test("csv: headers explícitos definem colunas e ordem", () => {
  assert.equal(formatOutput(rows, "csv", ["clicks", "page"]), "clicks,page\n10,/home\n3,/blog");
});

test("csv: valor com vírgula é envolvido em aspas", () => {
  assert.equal(formatOutput([{ q: "a, b", n: 1 }], "csv"), 'q,n\n"a, b",1');
});

test("csv: null, undefined e chave ausente viram campo vazio (borda)", () => {
  const out = formatOutput([{ a: null, b: undefined, c: 0 }], "csv", ["a", "b", "c", "d"]);
  assert.equal(out, "a,b,c,d\n,,0,");
});

test("csv: lista vazia vira string vazia (borda: vazio)", () => {
  assert.equal(formatOutput([], "csv"), "");
  assert.equal(formatOutput([], "csv", ["a", "b"]), "");
});

test("table: contém cabeçalhos e valores de todas as linhas", () => {
  const out = formatOutput(rows, "table");
  for (const expected of ["page", "clicks", "/home", "10", "/blog", "3"]) {
    assert.ok(out.includes(expected), `tabela deveria conter ${expected}`);
  }
  // borda superior + cabeçalho + separador + 2 linhas + separador entre elas + borda inferior
  assert.equal(out.split("\n").length, 7);
});

test("table: headers explícitos omitem colunas não listadas", () => {
  const out = formatOutput(rows, "table", ["page"]);
  assert.ok(out.includes("/home"));
  assert.ok(!out.includes("clicks"));
  assert.ok(!out.includes("10"));
});

test("table: lista vazia vira 'No data' (borda: vazio)", () => {
  assert.equal(formatOutput([], "table"), "No data");
});

test("formato desconhecido cai no JSON (borda: entrada inválida)", () => {
  assert.equal(formatOutput(rows, "xml"), JSON.stringify(rows, null, 2));
});
