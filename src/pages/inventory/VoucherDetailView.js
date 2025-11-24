// components/VoucherDetailView.js

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Giả định dùng React Router
import {
  Card,
  Descriptions,
  Divider,
  Typography,
  Table,
  Spin,
  Tag,
  message,
  Space,
  Button,
} from "antd";
import {
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { getVoucherDetails } from "../../services/inventoryService"; // Import service để fetch chi tiết

const { Title, Text } = Typography;

// Mặc định tên đối tác cho các loại chứng từ
const VOUCHER_TYPE_MAP = {
  IN: { name: "Phiếu Nhập Kho", color: "success", icon: <ArrowDownOutlined /> },
  OUT: { name: "Phiếu Xuất Kho", color: "error", icon: <ArrowUpOutlined /> },
  RETURN: {
    name: "Hàng Bán Trả Lại",
    color: "warning",
    icon: <RollbackOutlined />,
  },
};

const VoucherDetailView = () => {
  // Lấy ID chứng từ từ URL
  const { id } = useParams();

  const [voucherData, setVoucherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. Fetch Dữ liệu Chứng từ ---
  useEffect(() => {
    console.log("voucherID:", id);
    if (!id) {
      message.error("Thiếu ID chứng từ.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        // Gọi service Backend (Giả định service trả về {data: voucherObject})
        const response = await getVoucherDetails(id);

        // Giả định Backend trả về:
        // { ..., VoucherType, Partner: {Name, Phone}, User: {Username}, Details: [...] }
        setVoucherData(response.data);
      } catch (error) {
        message.error(`Không thể tải chi tiết chứng từ ID: ${id}`);
        console.error("Fetch Voucher Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <Spin
        tip="Đang tải chi tiết chứng từ..."
        style={{ margin: "50px auto", display: "block" }}
      />
    );
  }

  if (!voucherData) {
    return (
      <Card style={{ margin: 20 }}>
        <Text type="danger">Không tìm thấy chứng từ này.</Text>
      </Card>
    );
  }

  const typeInfo = VOUCHER_TYPE_MAP[voucherData.VoucherType] || {
    name: "Không xác định",
    color: "default",
  };

  // --- 2. Định nghĩa cột Bảng Chi tiết Sản phẩm ---
  const detailColumns = [
    {
      title: "Sản phẩm",
      dataIndex: ["Product", "Name"], // Giả định có include Product
      key: "productName",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "0.85em" }}>
            {record.Barcode}
          </Text>
        </Space>
      ),
    },
    {
      title: typeInfo.VoucherType === "IN" ? "Giá Nhập" : "Giá Bán",
      dataIndex: "UnitPrice",
      key: "unitPrice",
      render: (text) => `${Number(text).toLocaleString()} VND`,
    },
    {
      title: "Số lượng",
      dataIndex: "Quantity",
      key: "quantity",
    },
    {
      title: "Lô/Serial",
      dataIndex: "SerialID",
      key: "batchOrSerial",
      render: (serialId, record) => {
        if (serialId) {
          // Giả định Backend trả về SerialNumber qua Serial model include
          return (
            <Tag color="blue">
              {record.Serial?.SerialNumber || `Serial ID: ${serialId}`}
            </Tag>
          );
        }
        if (record.BatchID) {
          return <Tag color="geekblue">{`Lô ID: ${record.BatchID}`}</Tag>;
        }
        return "N/A";
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "TotalLineAmount",
      key: "totalAmount",
      render: (text) => <Text strong>{Number(text).toLocaleString()} VND</Text>,
    },
  ];

  return (
    <Card style={{ margin: 20 }}>
      <Title level={3}>
        <Tag
          color={typeInfo.color}
          icon={typeInfo.icon}
          style={{ fontSize: "1.2em", marginRight: 10 }}
        >
          {typeInfo.name}
        </Tag>
        {voucherData.VoucherCode}
      </Title>
      <Divider />

      {/* --- THÔNG TIN CHUNG VOUCHER --- */}
      <Descriptions
        title="Thông tin Chung"
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Ngày tạo">
          {new Date(voucherData.VoucherDate).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item
          label={typeInfo.VoucherType === "IN" ? "Nhà cung cấp" : "Khách hàng"}
        >
          <Text strong>
            {voucherData.Partner?.Name || "Khách/NCC không xác định"}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Người lập">
          {voucherData.User?.Username || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng số lượng">
          {voucherData.TotalQuantity?.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng giá trị">
          <Text strong type="success">
            {voucherData.TotalAmount?.toLocaleString()} VND
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={voucherData.Status === "COMPLETED" ? "green" : "orange"}>
            {voucherData.Status}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Mô tả">
          {voucherData.Description || "Không có mô tả"}
        </Descriptions.Item>
        {voucherData.ReferenceID && (
          <Descriptions.Item label="Chứng từ gốc">
            <Text underline>{voucherData.ReferenceID}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider orientation="left">Chi tiết Sản phẩm</Divider>

      {/* --- BẢNG CHI TIẾT SẢN PHẨM --- */}
      <Table
        dataSource={voucherData.VoucherDetail} // Giả định Backend trả về trường Details
        columns={detailColumns}
        pagination={false}
        rowKey="VoucherDetailID"
        size="middle"
      />
    </Card>
  );
};

export default VoucherDetailView;
