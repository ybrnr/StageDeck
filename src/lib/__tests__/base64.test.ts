import { base64ToUint8Array } from "../base64";

function toBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

describe("base64ToUint8Array", () => {
  it("decodes an empty string", () => {
    expect(base64ToUint8Array("")).toEqual(new Uint8Array(0));
  });

  it.each(["f", "fo", "foo", "foob", "fooba", "foobar"])(
    "round-trips %j across all padding lengths",
    (text) => {
      const decoded = base64ToUint8Array(toBase64(text));
      expect(Buffer.from(decoded).toString("utf8")).toBe(text);
    },
  );

  it("decodes binary content", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    const encoded = Buffer.from(bytes).toString("base64");
    expect(base64ToUint8Array(encoded)).toEqual(bytes);
  });

  it("tolerates whitespace and missing padding", () => {
    expect(Buffer.from(base64ToUint8Array("Zm9v\nYmFy")).toString()).toBe(
      "foobar",
    );
    expect(Buffer.from(base64ToUint8Array("Zm8")).toString()).toBe("fo");
  });

  it("throws on invalid characters", () => {
    expect(() => base64ToUint8Array("Zm9v!")).toThrow(
      "Invalid base64 character",
    );
    expect(() => base64ToUint8Array("Zm9vä")).toThrow(
      "Invalid base64 character",
    );
  });
});
