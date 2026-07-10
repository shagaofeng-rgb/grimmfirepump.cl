import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("后台角色权限", () => {
  it("超级管理员可以管理系统设置", () => expect(can("super_admin", "settings:manage")).toBe(true));
  it("销售人员可以管理客户线索但不能发布新闻", () => { expect(can("sales", "leads:write")).toBe(true); expect(can("sales", "news:publish")).toBe(false); });
  it("只读用户无法导出客户数据", () => expect(can("viewer", "leads:export")).toBe(false));
});
