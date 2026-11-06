# VN Weather HA

[![Add to Home Assistant Marketplace](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=khaisilk1910&repository=VN-Weather-HA&category=integration)

Tích hợp thời tiết đa nguồn cho **Home Assistant 2026.11+**, không cần API key, Docker hay máy chủ riêng.

## Tính năng

- **Open-Meteo** làm nguồn chính; **MET Norway** dự phòng khi nguồn chính lỗi; tùy chọn **ECMWF** qua Open-Meteo. Không ghép số liệu từ nhiều nguồn để tạo một bản tin giả.
- Gần **40 sensor**: nhiệt độ, độ ẩm, mưa, gió/giật, áp suất, tầm nhìn, UV, mây, bức xạ, bình minh/hoàng hôn… Trường thiếu dữ liệu hiển thị `unknown`.
- Weather entity và dự báo theo giờ/ngày; cache có đánh dấu dữ liệu cũ, timeout, log, Diagnostics, thiết lập bằng giao diện và múi giờ theo vị trí.
- Thẻ **VN Weather HA** hiện đại cho Lovelace: hai chế độ **Chi tiết / Thu gọn**, dự báo giờ/ngày, nguồn dữ liệu, hỗ trợ tiếng Việt, trình chỉnh sửa trực quan; tự đăng ký resource trong Lovelace storage mode.
- Không gọi mạng trong bước thiết lập integration; một coordinator phục vụ toàn bộ sensor/weather của một địa điểm.

## Cài đặt qua Marketplace / HACS

1. Nhấn **Add to Marketplace** ở trên, chọn máy Home Assistant, rồi thêm repository nếu chưa có (yêu cầu repository GitHub công khai). Trên Home Assistant 2026.11+, vào **Settings → Marketplace**. Trên bản cũ sử dụng HACS.
2. Cài **VN Weather HA** (loại **Integration**), khởi động lại Home Assistant.
3. Vào **Settings → Devices & services → Add integration → VN Weather HA**; chọn địa điểm và Configure nếu muốn thay đổi mô hình, chu kỳ cập nhật và dự phòng.

Nếu nút không mở được: **Settings → Marketplace → Add from link** và nhập `https://github.com/khaisilk1910/VN-Weather-HA` (Integration).

## Cài đặt thủ công

Giải nén gói **Manual**; chép thư mục `vn_weather_ha` vào `/config/custom_components/`, khởi động lại Home Assistant và thêm integration từ **Settings → Devices & services**.

## Thẻ Lovelace

Trên dashboard chọn **Edit → Add card → VN Weather HA** rồi chọn weather entity. Ví dụ YAML:

```yaml
type: custom:vn-weather-ha-card
entity: weather.my_home
mode: detailed             # detailed | compact
forecast_type: hourly     # hourly | daily
forecast_slots: 5
show_forecast: true
show_source: true
```

**Storage mode:** resource được đăng ký tự động; sau lần cài/cập nhật đầu tiên hãy tải lại trang dashboard. **YAML resources:** thêm thủ công và thay `0.2.0` theo phiên bản cài đặt:

```yaml
lovelace:
  resource_mode: yaml
  resources:
    - url: /vn_weather_ha/vn-weather-ha-card.js?v=0.2.0
      type: module
```

## Nhật ký, nguồn dữ liệu, giấy phép

```yaml
logger:
  logs:
    custom_components.vn_weather_ha: debug
```

Tải Diagnostics trong trang integration khi gặp lỗi; tọa độ địa điểm không được ghi vào Diagnostics. **Open-Meteo Free API** chỉ miễn phí cho mục đích phi thương mại, có hạn mức sử dụng. **Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0)**; dữ liệu từ MET Norway cũng phải ghi công theo điều khoản. Không sử dụng dự báo này làm nguồn cảnh báo an toàn duy nhất. **Chưa tích hợp API cảnh báo KTTV Việt Nam**.

**Mã nguồn:** [MIT](LICENSE) · **Báo lỗi:** [GitHub Issues](https://github.com/khaisilk1910/VN-Weather-HA/issues) · **Phát hành:** Actions → *Publish VN Weather HA release* → nhập phiên bản `X.Y.Z`; workflow cập nhật `manifest.json` và `const.py` **trước khi tạo tag/release**. Không tạo release thủ công bằng GitHub UI để tránh lệch phiên bản giữa tag và manifest.
