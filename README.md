# MƯA TỪ VỰNG — Vocabulary Rain

Game luyện nhớ từ tiếng Anh: nghĩa tiếng Việt rơi xuống, người chơi gõ từ tiếng Anh để bắn hạ. Bản này dùng GitHub Pages (frontend), Cloudflare Worker (API/xác thực/GitHub commit) và Cloudflare D1 (bảng xếp hạng chung).

## Có sẵn trong gói

- `index.html`, `style.css`, `app.js`: giao diện game responsive cho desktop/mobile.
- `data/vocabulary.json`: kho từ vựng 4 trường, đã chuyển từ bản English Vocabulary Quiz gần nhất trong Library (331 mục hợp lệ, loại mục trùng theo từ tiếng Anh).
- `worker/worker.js`: API đọc kho chung, đăng nhập admin, ghi JSON vào GitHub, nhận điểm và trả leaderboard.
- `worker/schema.sql`: schema D1.
- `worker/wrangler.toml`: cấu hình deploy Worker.

## Luật game mặc định

- Không giới hạn mạng; nhập sai hoặc bỏ lỡ mục tiêu không kết thúc lượt, từ được đưa vào danh sách ôn tập.
- Mỗi mục tiêu đúng: 100 × hệ số combo điểm.
- Lần đúng đầu tiên bắt đầu combo ×1; mỗi lần đúng tiếp theo trong 10 giây tăng hệ số thêm 1 và đặt lại đồng hồ 10 giây.
- Từ đúng được phát âm bằng Web Speech API tiếng Anh. Âm thanh phụ thuộc giọng đọc có sẵn trên trình duyệt/thiết bị.
- Bảng xếp hạng lưu điểm cao nhất theo mã người chơi được tạo trên trình duyệt; số lượt được đếm ở máy chủ.

## 1. Tạo GitHub repository và bật Pages

1. Tạo repository GitHub mới, ví dụ `vocabulary-rain` (Public nếu muốn ai cũng truy cập).
2. Upload toàn bộ nội dung thư mục này lên root repository, giữ nguyên cấu trúc.
3. Vào **Settings → Pages → Build and deployment**.
4. Chọn **Deploy from a branch**, branch `main`, folder `/ (root)`, bấm Save.
5. URL thường có dạng `https://<username>.github.io/<repository>/`.

## 2. Tạo Cloudflare D1

Cài Wrangler và đăng nhập Cloudflare:

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler d1 create vocabulary-rain
```

Lệnh tạo D1 trả về `database_id`. Thay `REPLACE_WITH_D1_DATABASE_ID` trong `worker/wrangler.toml` bằng ID đó.

Tạo bảng:

```bash
wrangler d1 execute vocabulary-rain --remote --file=schema.sql
```

Nếu Wrangler báo cú pháp file, chạy chính xác:

```bash
wrangler d1 execute vocabulary-rain --remote --file=schema.sql
```

## 3. Cấu hình GitHub và secrets cho Worker

Trong `worker/wrangler.toml`, sửa:

- `GITHUB_OWNER`: username hoặc organization GitHub.
- `GITHUB_REPO`: tên repository vừa tạo.
- `GITHUB_BRANCH`: `main` (hoặc branch mặc định thực tế).
- `GITHUB_FILE_PATH`: `data/vocabulary.json`.

Tạo GitHub fine-grained Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Chỉ chọn repository `vocabulary-rain`.
3. Repository permissions: **Contents: Read and write**.
4. Tạo token và lưu lại an toàn. Không commit token vào Git.

Thiết lập secrets:

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SESSION_SECRET
```

- `GITHUB_TOKEN`: token vừa tạo.
- `ADMIN_PASSWORD`: mật khẩu mạnh riêng của quản trị viên.
- `ADMIN_SESSION_SECRET`: chuỗi ngẫu nhiên dài tối thiểu 32 ký tự, khác mật khẩu admin.

Deploy Worker:

```bash
wrangler deploy
```

## 4. Nối GitHub Pages với Worker

Sau khi deploy, Cloudflare cung cấp URL dạng `https://vocabulary-rain.<subdomain>.workers.dev`.

Mở `config.js`, thay URL mẫu:

```js
window.APP_CONFIG = {
  API_BASE: "https://vocabulary-rain.<subdomain>.workers.dev"
};
```

Commit file `config.js` lên GitHub. Đợi GitHub Pages deploy xong, truy cập web và kiểm tra:

- `https://<worker-url>/health` phải trả `{"ok":true,...}`.
- `https://<worker-url>/api/vocab` trả danh sách từ.
- Chơi một lượt để kiểm tra gửi điểm.
- Đăng nhập tab Quản trị, thêm từ thử; kiểm tra GitHub commit mới trong `data/vocabulary.json`.

## 5. Lưu ý bảo mật và vận hành

- Không đưa `GITHUB_TOKEN`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` vào frontend hoặc repository.
- Worker giữ GitHub Token ở server-side Secret. Mật khẩu admin không lưu ở localStorage; phiên đăng nhập chỉ nằm trong sessionStorage và hết hạn sau 8 giờ.
- Kho JSON là nguồn chung. Worker đọc trực tiếp từ GitHub API nên thấy dữ liệu mới ngay; trang GitHub Pages có thể cần reload để lấy bản JSON tĩnh mới nếu API tạm thời không sẵn sàng.
- D1 lưu bảng xếp hạng chung. Mỗi trình duyệt có mã người chơi riêng trong localStorage; người chơi có thể tự nhập tên hiển thị.
- **Chống gian lận điểm:** bản MVP nhận điểm từ trình duyệt và kiểm tra định dạng/giới hạn dữ liệu ở Worker, chưa phải hệ thống chống cheat tuyệt đối. Nếu cần bảng xếp hạng thi đấu có thưởng, cần bổ sung xác thực phiên chơi, giới hạn tần suất và kiểm chứng lượt chơi ở máy chủ.
- CORS hiện để `*` nhằm dễ triển khai GitHub Pages. Khi đã biết domain Pages chính thức, nên giới hạn `Access-Control-Allow-Origin` trong `worker.js` về đúng domain.
- Offline: game có thể dùng JSON đã cache sau lần mở online đầu tiên; gửi điểm và thêm từ mới cần Internet. Phát âm phụ thuộc Web Speech API của thiết bị.

## API

- `GET /health`
- `GET /api/vocab`
- `GET /api/leaderboard?limit=50`
- `POST /api/score`
- `POST /api/admin/login`
- `POST /api/admin/vocab` (Bearer token)


## Cơ chế chơi phiên bản cập nhật
- Chọn tốc độ rơi trước khi bắt đầu: Chậm, Bình thường, Nhanh hoặc Rất nhanh.
- Mỗi khối hiển thị các ô chữ tiếng Anh ở phía trên và nghĩa tiếng Việt ở phía dưới.
- Click khối để chọn mục tiêu, sau đó gõ từng chữ cái. Chữ đúng bay lên ô tương ứng; chữ sai báo đỏ và không làm tăng tiến độ.
- Khi hoàn thành chính xác toàn bộ từ, khối phát nổ, cộng điểm và đọc từ tiếng Anh.

## Luật chơi cập nhật (v4)

- Mỗi lượt bắt đầu với một từ; từ kế tiếp xuất hiện khi từ đang rơi đi qua khoảng 2/3 chiều cao khu vực chơi.
- Không còn giới hạn 3 mạng. Nhập sai hoặc bỏ lỡ từ không kết thúc lượt chơi; các từ đó được đưa vào danh sách ôn tập.
- Điểm cơ bản mỗi từ đúng là 100, nhân với combo và hệ số tốc độ: Chậm ×1, Bình thường ×2, Nhanh ×3, Rất nhanh ×5.
- Dùng nút **KẾT THÚC LƯỢT** ở thanh trên của màn chơi để chốt điểm và xem lại từ sai.
