# DeepTech Intelligence Hub

繁體中文深科技研究週報。網站由 GitHub Pages 發布，來源為 `main` 分支的 `/docs`。前端使用原生 HTML、CSS 和 JavaScript，歷史資料按期保存。

## 出刊

沿用既有 ChatGPT 排程，每週一至週四台灣時間 09:00。排程先產出原本的 ChatGPT 週報，再以公開來源另外整理網站版本。GitHub Pages 收到儲存庫更新後重新發布，網站上架時間視研究與建置時間而定。

| 星期 | 系列代碼 | 內容 |
| --- | --- | --- |
| 一 | venture | DeepTech 產業與創投情報 |
| 二 | semiconductor | 半導體先進製程與競品專利 |
| 三 | policy | 科研補助、政策與醫材法規 |
| 四 | dd | DeepTech 技術學習與 DD 實務 |

## 發布約定

1. 從台灣日期與系列得出唯一 ID，例如 `2026-11-10-semiconductor`。歷史補刊用原刊期。
2. 在 `docs/reports/<ID>.json` 寫入有效 UTF-8 JSON。根物件包含 `sections`、`glossary`、`sources` 三個陣列。文章段落欄位為 `kind`（`main`、`technology` 或 `dd`）、`title`、`body`。正文支援基本 Markdown 小標題、粗體、清單與表格。名詞欄位為 `term`、`definition`。來源欄位為 `title`、`url`，使用可驗證的公開 HTTPS 原始連結。
3. 先確認正文檔已存在，再把一筆 `id`、`date`、`stream`、`title`、`summary`、`tags` 加入 `docs/reports/index.json` 的陣列。標題可使用當期主題，摘要用一至兩句，標籤使用字串陣列。索引更新使用當前 blob SHA，遇到衝突就重新讀取並合併。重試沿用相同 ID。已存在的正文不可靜默覆寫，索引已有同一 ID 時跳過。
4. 網站內容只取公開來源，保留日期、證據限制及待查核項。公司文件、研究案件、非公開身份、私人連結、信件、行事曆和工作待辦均留在原報告。官方來源優先，分析與機構宣稱分開。社群線索需查證，專利閱讀列明公開號與法律狀態的查核限制。
5. 查驗索引和正文都存在，再確認公開站的期刊連結 `/#issue=<ID>`。部署若仍在排隊，回報已提交與上架待確認。寫入失敗時保留 ChatGPT 週報並回報錯誤。

## 本機預覽

在儲存庫根目錄啟動 `python -m http.server 8000 --directory docs`，開啟 `http://localhost:8000/`。
