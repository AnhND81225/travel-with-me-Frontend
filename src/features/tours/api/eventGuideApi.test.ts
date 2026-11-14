import assert from "node:assert/strict";
import { test } from "node:test";
import { EventGuideApiError, eventGuideApi } from "./eventGuideApi";

// Kiểm contract HTTP mà không gọi BE, Cloudinary hoặc lưu dữ liệu dùng chung.
test("photo layout preserves ordered IDs, day assignments, null clearing and shared Bearer", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: () => "local-test-token", removeItem: () => {} } });
  try {
    const images = [{ imageId: 12, dayNumber: 2 }, { imageId: 10, dayNumber: null }];
    const metadata = [{ ...images[0], imageUrl: "https://example.test/12.png", description: null, sortOrder: 0, cover: true }];
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "/api/admin/events/60/images/layout");
      assert.equal(init?.method, "PUT");
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer local-test-token");
      assert.deepEqual(JSON.parse(String(init?.body)), { images });
      return new Response(JSON.stringify({ data: metadata }), { status: 200 });
    };
    assert.deepEqual(await eventGuideApi.saveEventImageLayout(60, images), metadata);
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "The image library changed", data: { code: "CONFLICT" } }), { status: 409 });
    await assert.rejects(eventGuideApi.saveEventImageLayout(60, images), error => error instanceof EventGuideApiError && error.status === 409);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, "sessionStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
