// components/InventoryDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  message,
} from "antd";
import {
  AreaChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { getInventorySummary } from "../../services/dashboardService";
// Import thư viện biểu đồ
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// --- Dữ liệu Dashboard mặc định ---
const defaultSummary = {
  kpi: { totalStock: 0, totalStockValue: 0 },
  monthlyTrend: [],
  topExport: [],
  dataType: "value",
};

const InventoryDashboard = () => {
  const defaultStart = moment().subtract(5, "months").startOf("month");
  const defaultEnd = moment();

  const [summary, setSummary] = useState(defaultSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState([defaultStart, defaultEnd]);
  const [dataType, setDataType] = useState("value");
  const [filterTrigger, setFilterTrigger] = useState(0);

  // --- Hàm gọi API thực tế ---
  const fetchDashboardData = async (start, end, type) => {
    setIsLoading(true);
    try {
      const res = await getInventorySummary({
        startDate: start,
        endDate: end,
        dataType: type,
      });
      setSummary(res); // Giả định service trả về object đã chứa data
      message.success("Đã tải dữ liệu dashboard thành công!");
    } catch (error) {
      console.error("Fetch Dashboard Error:", error);
      message.error(
        error.message ||
          "Lỗi khi tải dữ liệu dashboard. Vui lòng kiểm tra API Backend."
      );
      setSummary(defaultSummary);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. Tải Dữ liệu (Chỉ chạy khi mount và khi filter được áp dụng) ---
  useEffect(() => {
    fetchDashboardData(
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
      dataType
    );
  }, [filterTrigger]);

  // --- 2. Xử lý Áp dụng Bộ lọc ---
  const handleApplyFilter = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return message.warning("Vui lòng chọn phạm vi thời gian.");
    }
    setFilterTrigger((prev) => prev + 1);
  };

  // --- Hàm định dạng giá trị (VND hoặc Số lượng) ---
  const formatValue = (value) => {
    if (summary.dataType === "value") {
      if (value > 1000000) {
        // Hiển thị Triệu (Tr) cho UX tốt hơn
        return `${(value / 1000000).toLocaleString("vi-VN", {
          maximumFractionDigits: 2,
        })} Triệu VND`;
      }
      return `${value.toLocaleString("vi-VN")} VND`;
    }
    return `${value.toLocaleString("vi-VN")} Đơn vị`;
  };

  // --- Cấu hình Biểu đồ Đường (Xu hướng Nhập/Xuất) ---
  const trendChartData = {
    labels: summary.monthlyTrend.map((item) =>
      moment(item.monthYear, "YYYY-MM").format("MM/YYYY")
    ),
    datasets: [
      {
        label: `Giá trị Nhập (IN) (${
          summary.dataType === "value" ? "VND" : "SL"
        })`,
        data: summary.monthlyTrend.map((item) => item.inValue),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y",
        tension: 0.4,
        fill: false,
      },
      {
        label: `Giá trị Xuất (OUT) (${
          summary.dataType === "value" ? "VND" : "SL"
        })`,
        data: summary.monthlyTrend.map((item) => item.outValue),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatValue(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: summary.dataType === "value" ? "Giá trị (VND)" : "Số lượng",
        },
        ticks: {
          callback: (value) => {
            return summary.dataType === "value"
              ? (value / 1000000).toLocaleString() + " Tr" // Định dạng trục Y thành Triệu
              : value.toLocaleString();
          },
        },
      },
    },
  };

  // --- Cấu hình Biểu đồ Cột (Top Xuất Kho) ---
  const topExportChartData = {
    labels: summary.topExport.map((item) => item.name),
    datasets: [
      {
        label: "Số lượng Xuất (Đơn vị)",
        data: summary.topExport.map((item) => item.quantity),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const topExportChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y", // Biểu đồ cột ngang
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: "Số lượng bán ra" },
      },
    },
  };

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}
    >
      <Title level={2} style={{ marginBottom: 20 }}>
        📊 Dashboard Quản lý Tồn kho
      </Title>

      {/* --- Thanh Bộ lọc Dữ liệu --- */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" wrap>
          <Text strong>Chọn Phạm vi:</Text>
          <RangePicker
            defaultValue={[defaultStart, defaultEnd]}
            format="DD/MM/YYYY"
            onChange={setDateRange}
            style={{ width: 250 }}
            disabled={isLoading}
          />
          <Text strong>Hiển thị theo:</Text>
          <Select
            defaultValue="value"
            value={dataType}
            style={{ width: 150 }}
            onChange={setDataType}
            disabled={isLoading}
          >
            <Select.Option value="value">
              <DollarOutlined /> Giá trị (VND)
            </Select.Option>
            <Select.Option value="quantity">
              <AreaChartOutlined /> Số lượng
            </Select.Option>
          </Select>
          <Button
            type="primary"
            onClick={handleApplyFilter}
            loading={isLoading}
            icon={<SearchOutlined />}
          >
            Áp dụng
          </Button>
        </Space>
      </Card>

      <Spin spinning={isLoading} tip="Đang tải dữ liệu...">
        {/* --- 1. Khu vực KPI Tổng quan --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered hoverable>
              <Statistic
                title="Tổng Giá trị Tồn kho (WAC)"
                value={summary.kpi.totalStockValue}
                formatter={(value) =>
                  `${(value / 1000000).toLocaleString("vi-VN", {
                    maximumFractionDigits: 0,
                  })} Triệu`
                }
                valueStyle={{ color: "#3f8600", fontSize: 28 }}
                prefix={<DollarOutlined />}
                suffix="VND"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered hoverable>
              <Statistic
                title="Tổng Số lượng Tồn kho"
                value={summary.kpi.totalStock}
                precision={0}
                valueStyle={{ color: "#0057b7", fontSize: 28 }}
                prefix={<AreaChartOutlined />}
                suffix="sản phẩm"
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} lg={8}>
            <Card bordered hoverable>
              {/* Đã FIX: Sử dụng hàm formatValue để hiển thị VND/Triệu chính xác */}
              <Statistic
                title={`Tổng Giá trị Nhập (Trong kỳ)`}
                value={summary.monthlyTrend.reduce(
                  (sum, item) => sum + item.inValue,
                  0
                )}
                formatter={formatValue}
                valueStyle={{ color: "#cf1322", fontSize: 28 }}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* --- 2. Biểu đồ Xu hướng Nhập/Xuất --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Card
              title={
                <Title level={4}>
                  <LineChartOutlined /> Xu hướng Nhập/Xuất theo tháng
                </Title>
              }
              bordered
              extra={
                <Text type="secondary">
                  Đơn vị:{" "}
                  {summary.dataType === "value" ? "Giá trị" : "Số lượng"}
                </Text>
              }
            >
              <div style={{ height: 350 }}>
                {summary.monthlyTrend.length > 0 ? (
                  <Line options={trendChartOptions} data={trendChartData} />
                ) : (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      paddingTop: 100,
                    }}
                  >
                    Không có dữ liệu giao dịch trong kỳ.
                  </Text>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- 3. Biểu đồ Top Xuất Kho --- */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <Title level={4}>
                  <BarChartOutlined /> Top {summary.topExport.length} Sản phẩm
                  Xuất Kho nhiều nhất
                </Title>
              }
              bordered
              extra={<Text type="secondary">Đơn vị: Số lượng bán ra</Text>}
            >
              <div
                style={{
                  height: Math.max(200, summary.topExport.length * 50 + 50),
                }}
              >
                {summary.topExport.length > 0 ? (
                  <Bar
                    options={topExportChartOptions}
                    data={topExportChartData}
                  />
                ) : (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      paddingTop: 50,
                    }}
                  >
                    Không có dữ liệu xuất kho trong kỳ.
                  </Text>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default InventoryDashboard;
