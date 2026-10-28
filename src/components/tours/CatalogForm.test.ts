import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogField, CatalogForm } from "./CatalogForm";

test("GUIDE/tour có nhãn và tên field để focus đúng đường dẫn lỗi", () => {
  const field = createElement(CatalogField, { name: "details.itinerary[0].title", label: "Tên chặng", children: createElement("input", { required: true }) });
  const html = renderToStaticMarkup(createElement(CatalogForm, { validate: () => ({}), onSubmit: async () => {}, children: field }));
  assert.match(html, /noValidate=""/i);
  assert.match(html, /name="details.itinerary\[0\].title"/);
  assert.match(html, /aria-label="Tên chặng"/);
});

test("STAFF giữ native form/input cũ và không gọi validation của GUIDE", () => {
  const field = createElement(CatalogField, { enabled: false, name: "guide-only", label: "Guide", children: createElement("input", { id: "staff-name", required: true }) });
  const html = renderToStaticMarkup(createElement(CatalogForm, { enabled: false, validate: () => { throw new Error("Không được áp rule GUIDE cho STAFF"); }, onSubmit: async () => {}, children: field }));
  assert.equal(html, '<form><input id="staff-name" required=""/></form>');
});
