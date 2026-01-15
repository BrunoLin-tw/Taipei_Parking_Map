# 使用 Docker 來執行 Taipei_Parking_Map

下面說明如何用 Docker 建置與在開發環境中執行此 Vite + React TypeScript 專案。專案包含兩種常見用法：生產（build → nginx 提供靜態）與開發（容器內跑 Vite dev server 支援 hot-reload）。

## 新增的檔案
- Dockerfile （已提交至 main）
- nginx.conf
- docker-compose.dev.yml
- .dockerignore

## 生產環境（建置靜態網站並用 nginx 提供）
1. 如果你想在 build 時傳入金鑰（不把金鑰放入 repo）：
   - 建置映像檔：
     ```
     docker build --build-arg GEMINI_API_KEY=your_key -t taipei-parking-map:prod .
     ```
   - 執行容器（將容器 80 對應到主機 8080）：
     ```
     docker run -p 8080:80 taipei-parking-map:prod
     ```
   - 開啟瀏覽器： http://localhost:8080

2. 或者你可以在專案根目錄建立 `.env.local`（範例）：
   ```
   GEMINI_API_KEY=your_key
   ```
   然後直接建置：
   ```
   docker build -t taipei-parking-map:prod .
   docker run -p 8080:80 taipei-parking-map:prod
   ```

注意：
- 若你的程式在 client-side（瀏覽器）透過 Vite 的 `import.meta.env.VITE_...` 讀取 env 變數，請改用 `VITE_` 前綴（例如 `VITE_GEMINI_API_KEY`），並於建置時提供該變數，因為 Vite 會在 build 階段將其內嵌。
- 建置時若需要把金鑰內嵌到 client，必須在 build 階段提供（或在 CI 的 build 步驟中注入）。
- nginx 設定包含 SPA 路由（try_files ... /index.html），以支援前端路由。

## 開發環境（hot-reload）
在專案根目錄執行（先在 host 設定環境變數）：
```bash
export GEMINI_API_KEY=your_key
docker compose -f docker-compose.dev.yml up --build
```
開啟瀏覽器： http://localhost:5173

docker-compose 會在容器內執行 `npm install`，並用 Vite 運行 dev server（`--host 0.0.0.0`），以便主機能存取。

## 檔案提交指令（在本機 git repo 操作）
請在本機執行以下指令來建立分支並提交（假設你已在專案根目錄）：

```bash
# 更新本機 main
git fetch origin
git checkout origin/main -b docker_dev

# 新增檔案（如果已在檔案系統建立這些檔案）
git add nginx.conf docker-compose.dev.yml .dockerignore DOCKER_READMD.md

# 提交（使用上方建議的 commit 訊息）
git commit -m "新增 Docker 開發與部署設定：加入 nginx.conf、docker-compose.dev.yml、.dockerignore 與 DOCKER_READMD.md"

# 推到遠端分支 docker_dev
git push -u origin docker_dev
```

備註
- 你先前授權我時我已提交 Dockerfile 到 main；若你要在 docker_dev 分支也包含該變更，請從 main 建分支（上述指令的第一行���從 origin/main 建立分支）。
- 若你希望我直接為你提交到遠端（建立 docker_dev 並推送），請回覆「請代為提交」，我會在取得可用權限時為你執行（目前我無法直接在倉庫執行提交）。