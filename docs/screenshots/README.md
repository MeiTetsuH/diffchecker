# 截图与样例 / Screenshots and examples

这些 PNG 是实际页面的截图，不是设计稿。示例文件完全虚构；所有图片都在本地生产构建中截取，没有使用线上用户内容。

These PNGs are screenshots of the working application, not mockups. All example files are synthetic. Captures use the local production build and contain no production user data.

| 文件 / File | 场景 / Scenario | 设置 / Settings |
| --- | --- | --- |
| `text-compare.png` | 配置和空格差异 / Configuration and whitespace changes | 1280 × 800, dark, Word diff |
| `excel-table.png` | 库存表格，包含增删和错误值 / Inventory table with additions, removals, and errors | 1280 × 800, dark, Table |
| `excel-csv.png` | 同一库存的 CSV 视图 / CSV view of the same inventory | 1280 × 800, light, CSV text |

## 重新生成 / Reproduce

1. 在仓库根目录运行 `npm ci`，再运行 `npm run preview`，打开 Wrangler 输出的本地 URL。

   From the repository root, run `npm ci`, then `npm run preview`, and open the local URL printed by Wrangler.
2. 文本页面分别粘贴 [`text-before.txt`](../examples/text-before.txt) 和 [`text-after.txt`](../examples/text-after.txt)，选择 **Word diff**。截图前将两个输入框滚回顶部。

   Paste the two text files into Text Compare and select **Word diff**. Scroll both editors to the top before capturing.
3. Excel 页面加载 [`inventory-before.xlsx`](../examples/inventory-before.xlsx) 和 [`inventory-after.xlsx`](../examples/inventory-after.xlsx)。两侧选择 **Inventory**，表头行 **1**，点击 **Find differences**。

   Load the two inventory workbooks in Excel Compare. Select **Inventory** and header line **1** on each side, then click **Find differences**.
4. 使用上表的视窗和主题设置，分别截图 Table 和 CSV text。保留真实界面，不修改截图中的结果。

   Use the viewport and theme settings above to capture Table and CSV text. Keep the actual interface and results intact.

工作簿由以下命令生成；其中 SKU `012` 的价格单元格是真正的 Excel 错误类型，原值为 `#DIV/0!`，修改值为 `#N/A`。

The command below regenerates the workbooks. The price cell for SKU `012` uses the actual Excel error type: `#DIV/0!` before and `#N/A` after.

```bash
node docs/examples/generate-workbooks.mjs
```

截图放在 `docs/` 下供 README 使用，不会作为 `public/` 资源发布到网站。捕获日期：2026-09-27。

Screenshots live under `docs/` for the README and are not published as website assets under `public/`. Captured on 2026-09-27.
