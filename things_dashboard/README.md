# Dashboard Thông Tin Tổng Hợp

Một dashboard hiện đại và đẹp mắt hiển thị thông tin từ nhiều nguồn API khác nhau, được xây dựng bằng HTML, CSS và JavaScript thuần.

## 🌟 Tính năng

### 1. Thời Tiết (Weather)
- **API**: OpenWeatherMap, WeatherAPI.com, Open-Meteo (fallback chain)
- **Dữ liệu**: Nhiệt độ, mô tả thời tiết, độ ẩm, gió, áp suất
- **Tính năng**: Tìm kiếm theo thành phố, cập nhật vị trí
- **Độ tin cậy**: Sử dụng nhiều API để đảm bảo luôn có dữ liệu

### 2. Tin Tức (News)
- **API**: NewsAPI.org, GNews, NewsData.io (fallback chain)
- **Dữ liệu**: Tin tức Việt Nam mới nhất (6 tin)
- **Tính năng**: Tin tức có thể click để đọc chi tiết
- **Độ tin cậy**: Fallback chain với demo data

### 3. Tỷ Giá Hối Đoái (Currency Exchange)
- **API**: ExchangeRate.host, CurrencyAPI.net, Fixer.io (fallback chain)
- **Dữ liệu**: Tỷ giá USD/VND, EUR, JPY, GBP, CNY, KRW
- **Tính năng**: Cập nhật theo thời gian thực
- **Độ tin cậy**: Fallback chain với demo data

### 4. Địa Lý (Geography)
- **API**: GeoDB Cities, OpenCage, Nominatim (fallback chain)
- **Dữ liệu**: Thông tin thành phố, dân số, tọa độ
- **Tính năng**: Tìm kiếm theo thành phố, cập nhật vị trí
- **Độ tin cậy**: Fallback chain với demo data

### 5. Dịch Thuật (Translation)
- **API**: Google Translate (primary), MyMemory (fallback)
- **Dữ liệu**: Dịch thuật đa ngôn ngữ
- **Tính năng**: Dịch văn bản, đổi ngôn ngữ
- **Độ tin cậy**: Fallback API khi Google Translate lỗi

### 6. Từ Điển (Dictionary)
- **API**: DuckDuckGo Instant Answer API
- **Dữ liệu**: Định nghĩa từ vựng tiếng Anh
- **Tính năng**: Tìm kiếm từ, dịch định nghĩa sang tiếng Việt
- **Độ tin cậy**: API miễn phí và ổn định

### 7. Thời Gian (Time)
- **API**: WorldTimeAPI, TimeAPI.io, TimeZoneDB (fallback chain)
- **Dữ liệu**: Thời gian hiện tại, múi giờ, ngày tháng
- **Múi giờ**: Asia/Ho_Chi_Minh
- **Độ tin cậy**: Sử dụng nhiều API để đảm bảo luôn có dữ liệu

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd things_dashboard

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 🔧 Cấu hình API Keys

### Lưu ý quan trọng
Hiện tại ứng dụng đang sử dụng các API keys demo và fallback mechanisms để đảm bảo hoạt động. Để có dữ liệu thực, bạn cần đăng ký và cấu hình các API keys sau:

### 1. OpenWeatherMap API
- Đăng ký tại: https://openweathermap.org/api
- Thay thế `8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c` trong `script.js`

### 2. NewsAPI.org
- Đăng ký tại: https://newsapi.org/
- Thay thế `8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c` trong `script.js`

### 3. RapidAPI (GeoDB Cities)
- Đăng ký tại: https://rapidapi.com/
- Thay thế `8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c` trong `script.js`

### 4. OpenCage Geocoding
- Đăng ký tại: https://opencagedata.com/
- Thay thế `8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c` trong `script.js`

## 🎨 Giao diện

- **Thiết kế hiện đại**: Glassmorphism, gradient, responsive
- **Layout linh hoạt**: Grid system với các widget có kích thước tối thiểu 350px
- **Tương tác tốt**: Hover effects, loading states, progress indicators
- **Thông báo**: Push notifications cho tiến độ và trạng thái

## 🔄 Fallback Mechanisms

Ứng dụng được thiết kế với hệ thống fallback mạnh mẽ:

1. **API Fallback Chain**: Mỗi widget sử dụng nhiều API, nếu API chính lỗi sẽ thử API phụ
2. **Demo Data**: Khi tất cả API đều lỗi, hiển thị dữ liệu mẫu
3. **Error Handling**: Xử lý lỗi gracefully với thông báo rõ ràng
4. **Loading States**: Hiển thị trạng thái loading trong quá trình tải dữ liệu

## 📱 Responsive Design

- **Desktop**: Layout grid 3 cột
- **Tablet**: Layout grid 2 cột
- **Mobile**: Layout 1 cột với scroll

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **APIs**: Multiple free APIs với fallback mechanisms
- **Development**: Live Server cho development
- **Styling**: CSS Grid, Flexbox, CSS Variables

## 🔍 Debugging

Ứng dụng có console logging chi tiết để debug:
- API calls và responses
- Error handling
- Fallback usage
- Performance metrics

## 📝 Changelog

### v1.2.0
- ✅ Fix API key issues (401, 426, 403 errors)
- ✅ Implement comprehensive fallback mechanisms
- ✅ Add multiple API providers for each widget
- ✅ Improve error handling and user feedback
- ✅ Add API source indicators

### v1.1.0
- ✅ Fix translation widget CORS issues
- ✅ Implement dictionary translation with progress
- ✅ Add location permission handling
- ✅ Improve UI/UX with notifications

### v1.0.0
- ✅ Initial release with basic functionality
- ✅ Weather, News, Currency, Geography widgets
- ✅ Translation and Dictionary features
- ✅ Time widget with multiple APIs

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết. 