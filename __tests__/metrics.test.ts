import { GET } from "../app/metrics/route";

describe("metrics route", () => {
  it("returns status ok", async () => {
    const response = await GET();
    const text = await response.text();
    expect(text).toEqual(expect.any(String));
  });
});
