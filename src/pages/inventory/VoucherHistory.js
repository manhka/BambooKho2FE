// components/VoucherHistory.js

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Select,
  Space,
  Tag,
  message,
  Typography,
} from "antd";
import { SearchOutlined, FilterOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { fetchInventoryVouchers } from "../../services/inventoryService"; // Service FE

const { Title, Text } = Typography;
const { Option } = Select;

// Các tùy chọn lọc theo loại chứng từ
const VOUCHER_TYPE_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Nhập kho (IN)", value: "IN" },
  { label: "Xuất kho (OUT)", value: "OUT" },
  { label: "Trả hàng (RETURN)", value: "RETURN" },
];

const VoucherHistory = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  // State filters chứa các tham số truy vấn (sẽ được truyền trực tiếp vào service)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 8,
    search: "",
    type: "",
  });

  // --- 1. Fetch Dữ liệu Chứng từ ---
  const loadVouchers = async () => {
    setLoading(true);
    try {
      // Gọi service, truyền đối tượng filters trực tiếp
      const res = await fetchInventoryVouchers(filters);

      // Backend trả về { data: [...], total: N }
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error(error.message || "Lỗi khi tải lịch sử giao dịch.");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu mỗi khi filters thay đổi
  useEffect(() => {
    loadVouchers();
  }, [filters]);

  // --- 2. Xử lý Thay đổi Bộ lọc và Phân trang ---

  // Xử lý thay đổi Phân trang và Kích thước trang
  const handleTableChange = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  // Xử lý tìm kiếm (chỉ cần cập nhật state search)
  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // Xử lý lọc theo loại chứng từ
  const handleTypeChange = (value) => {
    setFilters((prev) => ({ ...prev, type: value, page: 1 }));
  };

  // --- 3. Định nghĩa Cột Bảng ---
  const columns = [
    {
      title: "Mã Phiếu",
      dataIndex: "VoucherCode",
      key: "VoucherCode",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "VoucherType",
      key: "VoucherType",
      render: (type) => {
        const color =
          type === "IN" ? "green" : type === "OUT" ? "volcano" : "blue";
        const label =
          VOUCHER_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
        return <Tag color={color}>{label.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Đối tác",
      dataIndex: "PartnerName",
      key: "PartnerName",
    },
    {
      title: "Ngày",
      dataIndex: "VoucherDate",
      key: "VoucherDate",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "SL Tổng",
      dataIndex: "TotalQuantity",
      key: "TotalQuantity",
      align: "right",
      render: (text) => text?.toLocaleString() || 0,
    },
    {
      title: "Giá trị",
      dataIndex: "TotalAmount",
      key: "TotalAmount",
      align: "right",
      render: (text) => (
        <Text type="success">{Number(text)?.toLocaleString() || 0} VND</Text>
      ),
    },
    {
      title: "Người lập",
      dataIndex: "Creator",
      key: "Creator",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          // Chuyển hướng đến trang chi tiết chứng từ (sử dụng ID)
          onClick={() => navigate(`/inventory/vouchers/${record.VoucherID}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          <FilterOutlined /> Lịch sử Giao dịch Kho
        </Title>
      }
    >
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        {/* Thanh Lọc và Tìm kiếm */}
        <Space>
          <Select
            value={filters.type}
            onChange={handleTypeChange}
            style={{ width: 180 }}
            options={VOUCHER_TYPE_OPTIONS}
            placeholder="Lọc theo Loại"
          />
        </Space>
        <Input.Search
          placeholder="Tìm kiếm Mã Phiếu..."
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="VoucherID"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total) => `Tổng ${total} phiếu`,
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />
    </Card>
  );
};

export default VoucherHistory;
