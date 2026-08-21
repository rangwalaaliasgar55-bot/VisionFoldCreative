import { describe, expect, it } from "vitest";
import { money, parseCsv, slugify } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Brand Films & Commercials!")).toBe("brand-films-commercials");
  });
  it("collapses repeats and trims edges", () => {
    expect(slugify("  Hello -- World  ")).toBe("hello-world");
  });
  it("handles unicode by stripping to alphanumerics", () => {
    expect(slugify("Café München")).toBe("caf-mnchen");
  });
});

describe("money", () => {
  it("parses numeric strings", () => {
    expect(money("1250.5")).toBe(1250.5);
  });
  it("defaults invalid input to 0", () => {
    expect(money("abc")).toBe(0);
    expect(money(null)).toBe(0);
  });
});

describe("parseCsv", () => {
  it("parses quoted fields with commas", () => {
    const rows = parseCsv('name,budget\n"Doe, Jane","2000"\nMax,500');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(["name", "budget"]);
    expect(rows[1]).toEqual(["Doe, Jane", "2000"]);
    expect(rows[2]).toEqual(["Max", "500"]);
  });

  it("skips fully empty lines", () => {
    const rows = parseCsv("a,b\n\n,c\n");
    expect(rows).toHaveLength(2);
  });
});
