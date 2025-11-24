import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  message,
  Image,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
} from "@ant-design/icons";

import * as productService from "../../services/productService";
import * as locationService from "../../services/locationService";

const { Option } = Select;
const { confirm } = Modal;

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

const ProductList = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // STATES CHO IMPORT/MODAL
  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    locationId: "",
  });

  // Lấy danh sách vị trí
  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationService.fetchLocations(1, 1000, "", "active");
      setLocations(data.items || []);
    } catch (err) {
      console.error("Lỗi tải vị trí:", err);
      setLocations([]);
    }
  }, []);

  // Lấy danh sách sản phẩm
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      const { search, status, locationId } = filters;
      const data = await productService.fetchProducts(
        current,
        pageSize,
        search,
        status,
        locationId
      );
      setProducts(data.items || []);
      setPagination((prev) => ({ ...prev, total: data.totalItems || 0 }));
    } catch (err) {
      message.error(err.message || "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // Xử lý Import Excel (Giai đoạn 1: Đọc và Xác thực)
  const handleImportExcel = async (file) => {
    if (!file) return message.error("Chưa chọn file Excel");
    setImporting(true);
    try {
      const result = await productService.importProducts(file);

      if (result.results.failed > 0) {
        let errorMessages = `Lỗi khi import ${result.results.failed} sản phẩm:`;
        if (result.results.errors && result.results.errors.length > 0) {
          errorMessages += ` ${result.results.errors[0].message}`;
          if (result.results.failed > 1) {
            errorMessages += ` (và ${result.results.failed - 1} lỗi khác)`;
          }
          console.error("Chi tiết lỗi Import:", result.results.errors);
        }
        message.error(errorMessages);
      } else if (result.results.success > 0 && result.results.items) {
        console.log("abc:", result.results.items);
        setUploadedProducts(result.results.items);
        setIsModalVisible(true);
        message.info(
          `Đã đọc thành công ${result.results.success} sản phẩm từ file. Vui lòng xác nhận lưu.`
        );
      } else {
        message.warning("File Excel không chứa dữ liệu sản phẩm hợp lệ.");
      }
    } catch (err) {
      message.error(err.message || err.message || "Lỗi khi import Excel");
    } finally {
      setImporting(false);
    }
  };

  // Xử lý Lưu trữ (Giai đoạn 2: Xác nhận và Lưu)
  const handleSaveImport = async () => {
    setLoading(true);
    try {
      // **ĐIỀU CHỈNH QUAN TRỌNG:** Lọc dữ liệu để chỉ gửi các trường cần thiết (bao gồm IDs)
      const productsToSave = uploadedProducts.map((p) => {
        const { Category, Brand, Location, ...rest } = p;

        return {
          ...rest,
          CategoryID: Category?.CategoryID || null,
          BrandID: Brand?.BrandID || null,
          LocationID: Location?.LocationID || null,
        };
      });
      console.log("product to save:", productsToSave);
      await productService.saveImportedProducts(productsToSave);

      message.success(`Đã lưu thành công ${uploadedProducts.length} sản phẩm.`);
      setIsModalVisible(false);
      setUploadedProducts([]);
      fetchProducts(); // Tải lại danh sách
    } catch (err) {
      message.error(err.message || "Lỗi khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setUploadedProducts([]);
    message.warning("Đã hủy lưu trữ các sản phẩm vừa import.");
  };

  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, [fetchLocations, fetchProducts]);

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Lưu trữ sản phẩm
  const handleArchive = (barcode) => {
    confirm({
      title: "Bạn có chắc muốn lưu trữ sản phẩm này?",
      content: `Mã sản phẩm: ${barcode}`,
      okText: "Đồng ý",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await productService.archiveProduct(barcode);
          message.success("Đã lưu trữ sản phẩm thành công");
          fetchProducts();
        } catch (err) {
          message.error(err.message || "Lỗi khi lưu trữ sản phẩm");
        }
      },
    });
  };

  // Khôi phục sản phẩm
  const handleRestore = (barcode) => {
    confirm({
      title: "Bạn có chắc muốn khôi phục sản phẩm này?",
      content: `Mã sản phẩm: ${barcode}`,
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await productService.restoreProduct(barcode);
          message.success("Đã khôi phục sản phẩm thành công");
          fetchProducts();
        } catch (err) {
          message.error(err.message || "Lỗi khi khôi phục sản phẩm");
        }
      },
    });
  };

  // ------------------------------------------------------------------
  // 1. CỘT CHO BẢNG CHÍNH
  // ------------------------------------------------------------------
  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "ImageUrl",
      key: "ImageUrl",
      width: 100,
      render: (url) => (
        <Tooltip
          title={
            <Image
              src={url}
              width={200}
              fallback="placeholder.png"
              preview={false}
            />
          }
          placement="right"
        >
          <Image
            src={url}
            width={60}
            height={60}
            preview={{ mask: "Xem" }}
            fallback="placeholder.png"
          />
        </Tooltip>
      ),
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "Barcode",
      key: "Barcode",
      render: (text, record) => (
        <Link to={`/products/${record.Barcode}`}>{text}</Link>
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "Name", key: "Name" },
    {
      title: "Danh mục",
      dataIndex: ["Category", "Name"],
      key: "Category",
      render: (text) => text || "N/A",
    },
    {
      title: "Thương hiệu",
      dataIndex: ["Brand", "Name"],
      key: "Brand",
      render: (text) => text || "N/A",
    },
    {
      title: "Vị trí",
      dataIndex: ["Location", "Name"],
      key: "Location",
      render: (text) => text || "Chưa xác định",
    },
    {
      title: "Tồn kho",
      dataIndex: "StockQuantity",
      key: "StockQuantity",
      align: "right",
    },
    {
      title: "Giá bán",
      dataIndex: "SalePrice",
      key: "SalePrice",
      align: "right",
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Giá nhập",
      dataIndex: "CostPrice",
      key: "CostPrice",
      align: "right",
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {getStatusVietnamese(status)}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/edit/${record.Barcode}`)}
            disabled={record.Status === "archived"}
          />
          {record.Status === "active" ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleArchive(record.Barcode)}
            />
          ) : (
            <Button
              type="text"
              style={{ color: "green" }}
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record.Barcode)}
            />
          )}
        </Space>
      ),
    },
  ];

  // ------------------------------------------------------------------
  // 2. CỘT CHO MODAL (CHI TIẾT VÀ BỎ HÀNH ĐỘNG/TRẠNG THÁI)
  // ------------------------------------------------------------------
  const modalColumns = [
    // Lấy các cột chính, loại bỏ 'action' và 'Status'
    ...columns.filter((col) => col.key !== "action" && col.key !== "Status"),
    {
      title: "Mô tả",
      dataIndex: "Description",
      key: "Description",
      width: 250,
      render: (text) => (
        <Tooltip title={text || "Không có"}>
          <div
            style={{
              maxWidth: 250,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {text || "N/A"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Serial?",
      dataIndex: "IsSerial",
      key: "IsSerial",
      width: 80,
      render: (isSerial) =>
        isSerial ? <Tag color="blue">Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: "Giá vốn TB",
      dataIndex: "AverageCost",
      key: "AverageCost",
      width: 150,
      align: "right",
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Tồn kho tối thiểu",
      dataIndex: "MinStockLevel",
      key: "MinStockLevel",
      align: "right",
      width: 150,
    },
    {
      title: "Tồn kho tối đa",
      dataIndex: "MaxStockLevel",
      key: "MaxStockLevel",
      align: "right",
      width: 150,
    },
  ];
  // ------------------------------------------------------------------

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Input.Search
            placeholder="Tìm theo Tên hoặc Mã sản phẩm"
            allowClear
            onSearch={(value) => handleFilterChange("search", value)}
            style={{ width: 300 }}
          />
          <Select
            defaultValue=""
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Option value="">Tất cả trạng thái</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="archived">Lưu trữ</Option>
          </Select>
          <Select
            defaultValue=""
            style={{ width: 180 }}
            placeholder="Lọc theo Vị trí"
            allowClear
            onChange={(value) => handleFilterChange("locationId", value)}
          >
            <Option value="">Tất cả Vị trí</Option>
            {locations.map((loc) => (
              <Option
                key={loc.id}
                value={loc.id}
                title={`${loc.Name} (${loc.Code})`}
              >
                <EnvironmentOutlined /> {loc.Name} ({loc.Code})
              </Option>
            ))}
          </Select>
        </Space>

        <Space>
          <>
            <Button
              type="default"
              loading={importing}
              onClick={() => document.getElementById("excelFileInput").click()}
            >
              Import sản phẩm bằng file Excel
            </Button>

            <input
              id="excelFileInput"
              type="file"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleImportExcel(file);
                e.target.value = null; // reset input
              }}
              disabled={importing}
            />
          </>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/products/create")}
          >
            Thêm sản phẩm
          </Button>
        </Space>
      </div>

      {/* Bảng danh sách sản phẩm chính */}
      <Table
        columns={columns}
        dataSource={products}
        rowKey="Barcode"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* MODAL XÁC NHẬN IMPORT */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        title="Xác nhận Lưu trữ Sản phẩm từ Excel"
        open={isModalVisible}
        onOk={handleSaveImport}
        onCancel={handleCancelModal}
        okText="Lưu trữ (Save)"
        cancelText="Hủy bỏ"
        confirmLoading={loading}
        width={1500} // Chiều rộng lớn
        style={{ maxWidth: "95vw" }}
      >
        <p>
          **{uploadedProducts.length} sản phẩm** đã được đọc thành công từ file
          Excel. Vui lòng kiểm tra lại thông tin trước khi nhấn **Lưu trữ**.
        </p>
        <Table
          columns={modalColumns} // Sử dụng bộ cột chi tiết
          dataSource={uploadedProducts}
          rowKey="Barcode"
          pagination={false}
          size="small"
          scroll={{ x: 2200, y: 500 }} // Cho phép cuộn ngang (x) và cố định chiều cao (y)
        />
      </Modal>
      {/* ------------------------------------------------------------------ */}
    </div>
  );
};

export default ProductList;
