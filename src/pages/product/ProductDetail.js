import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Spin,
  Alert,
  Button,
  Space,
  Tag,
  Typography,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

import * as productService from "../../services/productService";

const { Title, Text } = Typography;

// Chuyển trạng thái sang tiếng Việt
const getStatusVietnamese = (status) => {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "archived":
      return "Lưu trữ";
    default:
      return "Không xác định";
  }
};

const ProductDetail = () => {
  const { barcode } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy chi tiết sản phẩm
  const fetchProductDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProductDetail(barcode);
      setProduct(response.product);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  // Format tiền
  const formatCurrency = (amount) => {
    if (amount == null) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
      "vi-VN"
    )}`;
  };

  // Render thuộc tính Attributes (JSON)
  const renderAttributes = (attributes) => {
    if (!attributes) return <Text type="secondary">Không có</Text>;

    let data;
    try {
      data =
        typeof attributes === "string" ? JSON.parse(attributes) : attributes;
      if (typeof data !== "object" || Array.isArray(data))
        return <Text type="danger">Dữ liệu không hợp lệ.</Text>;
    } catch {
      return (
        <Text type="danger">Dữ liệu Attributes không phải JSON hợp lệ.</Text>
      );
    }

    return (
      <Descriptions column={1} size="small" bordered>
        {Object.entries(data).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  if (loading) return <Spin tip="Đang tải dữ liệu..." style={{ margin: 50 }} />;
  if (error)
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    );
  if (!product)
    return (
      <Alert
        message="Không tìm thấy"
        description={`Sản phẩm với mã ${barcode} không tồn tại.`}
        type="warning"
        showIcon
        style={{ margin: 24 }}
      />
    );

  return (
    <div style={{ padding: 24 }}>
      <Space
        style={{
          marginBottom: 20,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {product.Name}
        </Title>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/products")}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/edit/${product.Barcode}`)}
          >
            Chỉnh sửa
          </Button>
        </Space>
      </Space>

      <Card bordered style={{ maxWidth: 1200 }}>
        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
        >
          {/* Thông tin cơ bản */}
          <Descriptions.Item label="Mã sản phẩm">
            {product.Barcode}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={product.Status === "active" ? "green" : "volcano"}>
              {getStatusVietnamese(product.Status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hình ảnh">
            <Image
              src={product.ImageUrl}
              width={200}
              fallback="/placeholder.png"
            />
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục">
            {product.Category?.Name || <Text type="danger">Chưa gán</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Thương hiệu">
            {product.Brand?.Name || <Text type="danger">Chưa gán</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Vị trí">
            {product.Location ? (
              <>
                <EnvironmentOutlined /> {product.Location.Name} (
                {product.Location.Code})
              </>
            ) : (
              <Text type="secondary">Chưa xác định</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Quản lý Serial">
            <Tag
              icon={<SafetyOutlined />}
              color={product.IsSerial ? "blue" : "gray"}
            >
              {product.IsSerial ? "CÓ" : "KHÔNG"}
            </Tag>
          </Descriptions.Item>

          {/* Thời gian */}
          <Descriptions.Item label="Ngày tạo">
            {formatDate(product.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật cuối" span={2}>
            {formatDate(product.updatedAt)}
          </Descriptions.Item>

          {/* Giá cả */}
          <Descriptions.Item label="Giá bán">
            <Text strong type="success">
              {formatCurrency(product.SalePrice)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Giá vốn">
            {formatCurrency(product.CostPrice)}
          </Descriptions.Item>
          <Descriptions.Item label="Giá vốn TB">
            {formatCurrency(product.AverageCost)}
          </Descriptions.Item>

          {/* Tồn kho */}
          <Descriptions.Item label="Tồn kho hiện tại">
            <Text
              strong
              type={
                product.StockQuantity <= product.MinStockLevel
                  ? "danger"
                  : "success"
              }
            >
              {product.StockQuantity}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Định mức tối thiểu">
            {product.MinStockLevel}
          </Descriptions.Item>
          <Descriptions.Item label="Định mức tối đa">
            {product.MaxStockLevel}
          </Descriptions.Item>

          {/* Mô tả & Attributes */}
          <Descriptions.Item label="Mô tả" span={3}>
            {product.Description || (
              <Text type="secondary">Không có mô tả</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Thuộc tính (Attributes)" span={3}>
            {renderAttributes(product.Attributes)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProductDetail;
