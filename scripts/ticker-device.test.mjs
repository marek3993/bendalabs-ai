import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function loadSource(relativePath, imports = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } });
  const exports = {};
  runInNewContext(output.outputText, { exports, require: id => imports[id] ?? (id.endsWith(".css") ? {} : require(id)) });
  return exports;
}
const model = loadSource("../src/components/bendalabs/ticker-device-model.ts");
const { initialTicker, tickerReducer, tickerMessage, TickerPressSession, messageColumns, matrixBits, LONG_PRESS_MS } = model;
const press = (state, button, long = false) => tickerReducer(state, { type: "press", button, long });

test("short buttons independently cycle coins, views and currencies", () => {
  let coin = initialTicker;
  for (const expected of [1, 2, 0]) { coin = press(coin, "next"); assert.equal(coin.coin, expected); }
  let view = initialTicker;
  for (const expected of [1, 2, 0]) { view = press(view, "mode"); assert.equal(view.view, expected); }
  assert.equal(press(initialTicker, "currency").currency, "USD");
  assert.equal(press(press(initialTicker, "currency"), "currency").currency, "EUR");
  assert.equal(coin.view, 0);
  assert.equal(view.coin, 0);
});

test("long functions do not also trigger the short function", () => {
  const greeting = press(initialTicker, "next", true);
  assert.equal(greeting.greeting, true);
  assert.equal(greeting.coin, initialTicker.coin);
  assert.equal(press(greeting, "next", true).greetingId, 2);
  const night = press(initialTicker, "mode", true);
  assert.equal(night.night, true);
  assert.equal(night.view, initialTicker.view);
  assert.equal(press(night, "mode", true).night, false);
  const automatic = press(initialTicker, "currency", true);
  assert.equal(automatic.auto, true);
  assert.equal(automatic.currency, initialTicker.currency);
  assert.equal(press(automatic, "currency", true).auto, false);
});

test("automatic changes pause during greeting and resume afterwards", () => {
  assert.equal(tickerReducer(initialTicker, { type: "rotate" }), initialTicker);
  let state = press(initialTicker, "currency", true);
  state = tickerReducer(state, { type: "rotate" });
  assert.equal(state.coin, 1);
  state = press(state, "next", true);
  assert.equal(tickerReducer(state, { type: "rotate" }), state);
  state = tickerReducer(state, { type: "greetingEnd" });
  assert.equal(state.greeting, false);
  assert.equal(tickerReducer(state, { type: "rotate" }).coin, 2);
});

test("pointer and both keyboard keys classify 1499/1500 ms on matching release", () => {
  for (const [source, identity] of [["pointer", "7"], ["keyboard", " "], ["keyboard", "Enter"]]) {
    for (const duration of [LONG_PRESS_MS - 1, LONG_PRESS_MS, LONG_PRESS_MS + 800]) {
      const session = new TickerPressSession();
      assert.equal(session.begin("mode", source, identity, 100), true);
      assert.equal(session.held.button, "mode");
      assert.equal(session.release("mode", source, "other", 200), null);
      assert.equal(session.held.button, "mode");
      const action = session.release("mode", source, identity, 100 + duration);
      assert.equal(action.long, duration >= LONG_PRESS_MS);
      assert.equal(session.held, null);
      assert.equal(session.release("mode", source, identity, 100 + duration), null);
    }
  }
});

test("repeat, overlapping pointers and cancellation never create extra actions", () => {
  const session = new TickerPressSession();
  assert.equal(session.begin("next", "keyboard", "Enter", 0), true);
  assert.equal(session.begin("next", "keyboard", "Enter", 800), false);
  assert.equal(session.begin("currency", "pointer", "2", 900), false);
  assert.equal(session.release("currency", "pointer", "2", 2000), null);
  assert.equal(session.release("next", "keyboard", "Enter", 1500).long, true);
  session.begin("currency", "pointer", "3", 3000);
  session.cancel(4500);
  assert.equal(session.held, null);
  assert.equal(session.release("currency", "pointer", "3", 4600), null);
  assert.equal(session.click("currency", 1, 4610), null);
  assert.equal(session.begin("currency", "pointer", "4", 4700), true);
  assert.equal(session.release("currency", "pointer", "4", 4800).long, false);
});

test("follow-up native clicks are suppressed while accessible clicks work", () => {
  for (const [source, identity, detail] of [["pointer", "1", 1], ["keyboard", "Enter", 0]]) {
    const session = new TickerPressSession();
    session.begin("next", source, identity, 0);
    assert.equal(session.release("next", source, identity, 1500).long, true);
    assert.equal(session.click("next", detail, 1501), null);
    assert.equal(session.click("next", 0, 1600).long, false);
  }
  const accessible = new TickerPressSession();
  assert.equal(accessible.click("mode", 0, 0).button, "mode");
  accessible.begin("mode", "keyboard", " ", 100);
  assert.equal(accessible.click("mode", 0, 200), null);
});

test("sample data changes numerically and supports Czech and Slovak greetings", () => {
  const eur = tickerMessage(initialTicker, false);
  const usd = tickerMessage(press(initialTicker, "currency"), false);
  assert.notEqual(eur.value.replace(/\D/g, ""), usd.value.replace(/\D/g, ""));
  assert.match(eur.matrix, /€/);
  assert.match(usd.matrix, /\$/);
  assert.match(tickerMessage({ ...initialTicker, coin: 1, view: 1 }, false).value, /^-/);
  const greeting = { ...initialTicker, greeting: true };
  assert.equal(tickerMessage(greeting, false).value, "Veselé Vianoce!");
  assert.equal(tickerMessage(greeting, true).value, "Veselé Vánoce!");
});

test("dot matrix keeps 64 columns, complete glyphs and a seamless scroll cycle", () => {
  const columns = messageColumns("BTC ^ €54 000");
  assert.equal(columns.length, 13 * 6);
  assert.ok(columns.every(value => Number.isInteger(value) && value >= 0 && value < 128));
  const frame = matrixBits(columns, 0);
  assert.equal(frame.length, 64);
  assert.equal(JSON.stringify(frame), JSON.stringify(matrixBits(columns, columns.length + 16)));
  assert.notEqual(JSON.stringify(frame), JSON.stringify(matrixBits(columns, 8)));
  assert.equal(JSON.stringify(messageColumns("VÁNOCE")), JSON.stringify(messageColumns("VANOCE")));
  assert.notEqual(JSON.stringify(messageColumns("€")), JSON.stringify(messageColumns("$")));
  assert.notEqual(JSON.stringify(messageColumns("v")), JSON.stringify(messageColumns("V")));
  assert.ok(matrixBits([], 0).every(value => value === 0));
});

test("both language variants server-render exactly three physical controls", () => {
  const { default: TickerDevice } = loadSource("../src/components/bendalabs/ticker-device.tsx", { "./ticker-device-model": model });
  for (const cs of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(TickerDevice, { cs }));
    assert.equal((html.match(/<button\b/g) ?? []).length, 3);
    assert.equal(/<(input|select|textarea)\b/.test(html), false);
    assert.match(html, cs ? /Ceny jsou ukázkové/ : /Ceny sú ukážkové/);
    assert.match(html, cs ? /MĚNA/ : /MENA/);
    assert.equal((html.match(/aria-describedby=/g) ?? []).length, 3);
    assert.equal((html.match(/class="td-dots-off"/g) ?? []).length, 1);
  }
});
