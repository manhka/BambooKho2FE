import React, { useState, useEffect } from "react";
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
  BarChartOutlined, // Sẽ dùng cho cả 2 biểu đồ
  DollarOutlined,
  ArrowUpOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { getInventorySummary } from "../../services/dashboardService";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

const defaultSummary = {
  kpi: { totalStock: 0, totalStockValue: 0 },
  monthlyTrend: [],
  topExport: [],
  dataType: "value",
};

const InventoryDashboard = () => {
  const defaultStart = moment().subtract(5, "months").startOf("month");
  const defaultEnd = moment().add(1, "day");

  const [summary, setSummary] = useState(defaultSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [dataType, setDataType] = useState("value");

  const fetchDashboardData = async (start, end, type) => {
    setIsLoading(true);
    try {
      const payload = { startDate: start, endDate: end, dataType: type };

      const res = await getInventorySummary(payload); // normalize data
      const normalize = (data) => {
        if (!data) return defaultSummary;

        const kpi = {
          totalStock: Number(data.kpi?.totalStock || 0),
          totalStockValue: Number(data.kpi?.totalStockValue || 0),
        };

        const monthlyTrend =
          Array.isArray(data.monthlyTrend) && data.monthlyTrend.length
            ? data.monthlyTrend.map((m) => ({
                month: m.month,
                inValue: Number(m.inValue || 0),
                outValue: Number(m.outValue || 0),
              }))
            : [];

        const topExport =
          Array.isArray(data.topExport) && data.topExport.length
            ? data.topExport.map((t) => ({
                name: t.name,
                quantity: Number(t.quantity || 0),
                salePrice: Number(t.salePrice || 0),
              }))
            : [];

        return {
          kpi,
          monthlyTrend,
          topExport,
          dataType: data.dataType || type || "value",
        };
      };

      const normalized = normalize(res);
      setSummary(normalized); // message.success("Đã tải dữ liệu dashboard thành công!");
    } catch (error) {
      console.error("Fetch Dashboard Error:", error);
      message.error(
        error?.message ||
          "Lỗi khi tải dữ liệu dashboard. Vui lòng kiểm tra API Backend."
      );
      setSummary(defaultSummary);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ chạy 1 lần khi mount để tải dữ liệu mặc định
    fetchDashboardData(
      startDate.format("YYYY-MM-DD"),
      endDate.format("YYYY-MM-DD"),
      dataType
    );
  }, []); // <-- Giữ nguyên [] để chỉ chạy 1 lần khi mount

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      return message.warning(
        "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc."
      );
    }
    if (startDate.isAfter(endDate)) {
      return message.warning("Ngày bắt đầu không được sau ngày kết thúc.");
    } // Gọi API khi người dùng bấm Áp dụng
    fetchDashboardData(
      startDate.format("YYYY-MM-DD"),
      endDate.format("YYYY-MM-DD"),
      dataType
    );
  };

  const formatValueForDisplay = (value) => {
    const v = Number(value || 0);
    if (summary.dataType === "value") {
      return v >= 1000000
        ? `${(v / 1000000).toLocaleString("vi-VN", {
            maximumFractionDigits: 2,
          })} Triệu VND`
        : `${v.toLocaleString("vi-VN")} VND`;
    }
    return `${v.toLocaleString("vi-VN")} Đơn vị`;
  }; // --- Charts ---

  const trendLabels = summary.monthlyTrend.map((item) =>
    item.month ? moment(item.month).format("MM/YYYY") : ""
  ); // Dữ liệu cho biểu đồ CỘT Nhập/Xuất

  const trendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: `Nhập (IN) ${summary.dataType === "value" ? "(VND)" : "(SL)"}`,
        data: summary.monthlyTrend.map((m) => m.inValue),
        backgroundColor: "rgba(53, 162, 235, 0.8)", // Màu cột Nhập
        borderColor: "rgb(53, 162, 235)",
        borderWidth: 1,
      },
      {
        label: `Xuất (OUT) ${summary.dataType === "value" ? "(VND)" : "(SL)"}`,
        data: summary.monthlyTrend.map((m) => m.outValue),
        backgroundColor: "rgba(255, 99, 132, 0.8)", // Màu cột Xuất
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  }; // Tùy chọn cho biểu đồ CỘT Nhập/Xuất (Grouped Bar Chart)

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const y = context.parsed.y;
            return `${context.dataset.label}: ${formatValueForDisplay(y)}`;
          },
        },
      },
    },
    // Thêm logic scales cho Bar Chart
    scales: {
      x: {
        stacked: false, // Không xếp chồng cột
      },
      y: {
        beginAtZero: true,
        stacked: false, // Không xếp chồng cột
        title: {
          display: true,
          text: summary.dataType === "value" ? "Giá trị (VND)" : "Số lượng",
        },
        ticks: {
          callback: (val) =>
            summary.dataType === "value"
              ? `${(val / 1000000).toLocaleString()} Tr`
              : val.toLocaleString(),
        },
      },
    },
  };

  const topExportChartData = {
    labels: summary.topExport.map((t) => t.name),
    datasets: [
      {
        label: "Số lượng",
        data: summary.topExport.map((t) => t.quantity),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const topExportChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Số lượng" } },
    },
  };

  const totalInValue = summary.monthlyTrend.reduce(
    (s, m) => s + Number(m.inValue || 0),
    0
  );

  return (
    <div
      style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}
    >
      {" "}
      <Title level={2} style={{ marginBottom: 20 }}>
        📊 Dashboard Quản lý Tồn kho{" "}
      </Title>
      {/* Filter */}{" "}
      <Card style={{ marginBottom: 20 }}>
        {" "}
        <Space size="middle" wrap>
          <Text strong>Ngày bắt đầu:</Text>{" "}
          <DatePicker
            value={startDate}
            format="DD/MM/YYYY"
            onChange={(val) => setStartDate(val || defaultStart)}
            style={{ width: 150 }}
            disabled={isLoading}
            disabledDate={(current) => current && current.isAfter(endDate)}
          />
          <Text strong>Ngày kết thúc:</Text>{" "}
          <DatePicker
            value={endDate}
            format="DD/MM/YYYY"
            onChange={(val) => setEndDate(val || defaultEnd)}
            style={{ width: 150 }}
            disabled={isLoading}
            disabledDate={(current) => current && current.isBefore(startDate)}
          />
          <Text strong>Hiển thị theo:</Text>{" "}
          <Select
            value={dataType}
            style={{ width: 180 }}
            onChange={setDataType}
            disabled={isLoading}
          >
            {" "}
            <Select.Option value="value">
              <DollarOutlined /> Giá trị (VND){" "}
            </Select.Option>{" "}
            <Select.Option value="quantity">
              <AreaChartOutlined /> Số lượng{" "}
            </Select.Option>{" "}
          </Select>{" "}
          <Button
            type="primary"
            onClick={handleApplyFilter}
            loading={isLoading}
            icon={<SearchOutlined />}
          >
            Áp dụng{" "}
          </Button>{" "}
        </Space>{" "}
      </Card>{" "}
      <Spin spinning={isLoading} tip="Đang tải dữ liệu...">
        {/* KPI */}{" "}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {" "}
          <Col xs={24} sm={12} lg={8}>
            {" "}
            <Card bordered hoverable>
              {" "}
              <Statistic
                title="Tổng Giá trị Tồn kho (WAC)"
                value={summary.kpi.totalStockValue}
                formatter={(v) =>
                  `${(Number(v) / 1000000).toLocaleString("vi-VN", {
                    maximumFractionDigits: 0,
                  })} Triệu`
                }
                valueStyle={{ color: "#3f8600", fontSize: 28 }}
                prefix={<DollarOutlined />}
                suffix="VND"
              />{" "}
            </Card>{" "}
          </Col>{" "}
          <Col xs={24} sm={12} lg={8}>
            {" "}
            <Card bordered hoverable>
              {" "}
              <Statistic
                title="Tổng Số lượng Tồn kho"
                value={summary.kpi.totalStock}
                precision={0}
                valueStyle={{ color: "#0057b7", fontSize: 28 }}
                prefix={<AreaChartOutlined />}
                suffix="sản phẩm"
              />{" "}
            </Card>{" "}
          </Col>{" "}
          <Col xs={24} sm={24} lg={8}>
            {" "}
            <Card bordered hoverable>
              {" "}
              <Statistic
                title="Tổng Giá trị Nhập (Trong kỳ)"
                value={totalInValue}
                formatter={() => formatValueForDisplay(totalInValue)}
                valueStyle={{ color: "#cf1322", fontSize: 28 }}
                prefix={<ArrowUpOutlined />}
              />{" "}
            </Card>{" "}
          </Col>{" "}
        </Row>
        {/* --- Charts Section (Tách thành 2 cột) --- */}{" "}
        <Row gutter={[16, 16]}>
          {" "}
          <Col xs={24} lg={16} style={{ marginBottom: 20 }}>
            {" "}
            {/* Cột 1: Biểu đồ Xu hướng Nhập/Xuất (Line Chart -> BAR CHART) */}{" "}
            <Card
              title={
                <Title level={4}>
                  <BarChartOutlined /> Xu hướng Nhập/Xuất theo tháng{" "}
                </Title>
              }
              bordered
              style={{ height: "100%" }}
              extra={
                <Text type="secondary">
                  Đơn vị:{" "}
                  {summary.dataType === "value" ? "Giá trị" : "Số lượng"}{" "}
                </Text>
              }
            >
              {" "}
              <div style={{ height: 350 }}>
                {/* Đã chuyển sang sử dụng Bar Chart */}{" "}
                <Bar options={trendChartOptions} data={trendChartData} />{" "}
                {summary.monthlyTrend.length === 0 && !isLoading && (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      position: "absolute",
                      top: "50%",
                      width: "100%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    Không có dữ liệu giao dịch trong kỳ được chọn.{" "}
                  </Text>
                )}{" "}
              </div>{" "}
            </Card>{" "}
          </Col>{" "}
          <Col xs={24} lg={8} style={{ marginBottom: 20 }}>
            {/* Cột 2: Biểu đồ Top Xuất Kho (Bar Chart) */}{" "}
            <Card
              title={
                <Title level={4}>
                  <BarChartOutlined /> Top {summary.topExport.length} Sản phẩm
                  Xuất Kho{" "}
                </Title>
              }
              bordered
              style={{ height: "100%" }}
              extra={<Text type="secondary">Đơn vị: Số lượng</Text>}
            >
              {" "}
              <div
                style={{
                  height: Math.max(200, summary.topExport.length * 40 + 50),
                }}
              >
                {" "}
                <Bar
                  options={topExportChartOptions}
                  data={topExportChartData}
                />{" "}
                {summary.topExport.length === 0 && !isLoading && (
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      position: "absolute",
                      top: "50%",
                      width: "100%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    Không có dữ liệu xuất kho trong kỳ.{" "}
                  </Text>
                )}{" "}
              </div>{" "}
            </Card>{" "}
          </Col>{" "}
        </Row>{" "}
      </Spin>{" "}
    </div>
  );
};

export default InventoryDashboard;
