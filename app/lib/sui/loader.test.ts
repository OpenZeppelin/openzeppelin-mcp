import { untar } from "./loader";

// Build a minimal ustar archive in-memory (enough of the format for untar).
function header(name: string, size: number, type = "0", prefix = ""): Buffer {
  const h = Buffer.alloc(512);
  h.write(name, 0, "utf8"); // name (100)
  h.write(`${size.toString(8).padStart(11, "0")}\0`, 124, "utf8"); // size, octal (12)
  h.write(type, 156, "utf8"); // typeflag
  if (prefix) h.write(prefix, 345, "utf8"); // prefix (155)
  return h;
}

function file(path: string, content: string, prefix = ""): Buffer {
  const data = Buffer.from(content, "utf8");
  const pad = Buffer.alloc(Math.ceil(data.length / 512) * 512 - data.length);
  return Buffer.concat([header(path, data.length, "0", prefix), data, pad]);
}

const END = Buffer.alloc(1024); // two zero blocks = end-of-archive

describe("untar", () => {
  it("extracts file contents and strips the top-level directory", () => {
    const tar = Buffer.concat([file("repo-abc/contracts/x/Move.toml", 'name = "x"'), END]);
    const files = untar(tar);
    expect(files.get("contracts/x/Move.toml")).toBe('name = "x"');
    expect(files.size).toBe(1);
  });

  it("combines the ustar prefix and name for long paths", () => {
    const tar = Buffer.concat([
      file("faucet.move", "module x;", "repo-abc/contracts/utils/examples/rate_limiter"),
      END,
    ]);
    const files = untar(tar);
    expect(files.get("contracts/utils/examples/rate_limiter/faucet.move")).toBe("module x;");
  });

  it("skips directory entries and stops at the end-of-archive blocks", () => {
    const tar = Buffer.concat([
      header("repo-abc/contracts/", 0, "5"), // directory entry → skipped
      file("repo-abc/README.md", "# hi"),
      END,
      file("repo-abc/after-end.md", "ignored"), // after END → not read
    ]);
    const files = untar(tar);
    expect([...files.keys()]).toEqual(["README.md"]);
  });
});
