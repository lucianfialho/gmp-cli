import { test } from "node:test";
import assert from "node:assert/strict";
import { paginateAll } from "../dist/lib/paginate.js";

/** Cria um fetchPage falso a partir de uma lista de páginas e registra os tokens recebidos. */
function fakeFetcher(pages) {
  const calls = [];
  let i = 0;
  const fetchPage = async (pageToken) => {
    calls.push(pageToken);
    if (i >= pages.length) throw new Error("fetchPage chamado além da última página");
    return pages[i++];
  };
  return { fetchPage, calls };
}

test("página única: retorna os itens e chama fetchPage uma vez, sem token", async () => {
  const { fetchPage, calls } = fakeFetcher([{ items: [1, 2, 3] }]);
  assert.deepEqual(await paginateAll(fetchPage), [1, 2, 3]);
  assert.deepEqual(calls, [undefined]);
});

test("várias páginas: concatena em ordem e repassa cada nextPageToken", async () => {
  const { fetchPage, calls } = fakeFetcher([
    { items: ["a", "b"], nextPageToken: "t1" },
    { items: ["c"], nextPageToken: "t2" },
    { items: ["d", "e"] },
  ]);
  assert.deepEqual(await paginateAll(fetchPage), ["a", "b", "c", "d", "e"]);
  assert.deepEqual(calls, [undefined, "t1", "t2"]);
});

test("sem resultados: retorna lista vazia (borda: vazio)", async () => {
  const { fetchPage, calls } = fakeFetcher([{ items: [] }]);
  assert.deepEqual(await paginateAll(fetchPage), []);
  assert.equal(calls.length, 1);
});

test("nextPageToken null ou string vazia encerra a paginação (borda: limite)", async () => {
  for (const end of [null, ""]) {
    const { fetchPage, calls } = fakeFetcher([
      { items: [1], nextPageToken: end },
      { items: [99], nextPageToken: "nunca" },
    ]);
    assert.deepEqual(await paginateAll(fetchPage), [1]);
    assert.equal(calls.length, 1);
  }
});

test("página intermediária vazia não interrompe a paginação", async () => {
  const { fetchPage, calls } = fakeFetcher([
    { items: [], nextPageToken: "t1" },
    { items: [7] },
  ]);
  assert.deepEqual(await paginateAll(fetchPage), [7]);
  assert.deepEqual(calls, [undefined, "t1"]);
});

test("erro do fetchPage é propagado (borda: entrada inválida)", async () => {
  let n = 0;
  const fetchPage = async () => {
    if (n++ === 0) return { items: [1], nextPageToken: "t1" };
    throw new Error("quota exceeded");
  };
  await assert.rejects(paginateAll(fetchPage), /quota exceeded/);
  assert.equal(n, 2);
});
