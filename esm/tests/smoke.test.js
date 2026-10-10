import test from "node:test";
import assert from "node:assert/strict";
import { NexusVoiceBrowser, NEXUSVOICE_MODEL } from "../index.js";
test("public browser API is available without loading weights", () => {
  const v = new NexusVoiceBrowser();
  assert.equal(v.isSpeaking(), false);
  assert.match(NEXUSVOICE_MODEL, /Kokoro/);
  let count = 0;
  const unsubscribe = v.on("cancelled", () => count++);
  v.stop(); unsubscribe(); v.stop();
  assert.equal(count, 0);
  v.dispose();
});
