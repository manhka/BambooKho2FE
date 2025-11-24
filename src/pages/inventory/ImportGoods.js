// components/ImportGoods.js

import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Table,
  Space,
  message,
  Modal,
  Row,
  Col,
  Typography,
  Spin,
  Descriptions,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  TruckOutlined,
  UserAddOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
// Import Services
import { createGoodsImport } from "../../services/inventoryService";
import { fetchSuppliers, createSupplier } from "../../services/supplierService";
import {
  fetchProductsAndInventory,
  fetchBatchesByProduct,
  getProductDetail,
} from "../../services/productService";

const { Option } = Select;
const { Text } = Typography;

const ImportGoods = () => {
  const [form] = Form.useForm();
  const [supplierForm] = Form.useForm(); // <--- KHAI BÁO FORM CHO MODAL TẠO NCC

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [batchesData, setBatchesData] = useState({});

  const [selectedProductData, setSelectedProductData] = useState({});

  const [isSupplierModalVisible, setIsSupplierModalVisible] = useState(false);

  // States cho Modal và Preview
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [productDetailData, setProductDetailData] = useState(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [lastVoucher, setLastVoucher] = useState(null);

  const getSupplierName = (id) => {
    const supplier = suppliers.find((s) => s.SupplierID === id);
    return supplier ? supplier.Name : `ID: ${id} (Không tìm thấy)`;
  };

  // --- 1. Fetch Dữ liệu Ban đầu (Suppliers và Product List) ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsFetchingData(true);
      try {
        const suppliersRes = await fetchSuppliers();
        setSuppliers(suppliersRes.items || suppliersRes.data || []);

        const productsRes = await fetchProductsAndInventory("");
        // Lọc bỏ Serial Result vì nhập kho phải chọn sản phẩm gốc
        setProductOptions(
          (productsRes || []).filter((p) => !p.isSerialResult) || []
        );
      } catch (error) {
        message.error("Không thể tải dữ liệu ban đầu.");
      } finally {
        setIsFetchingData(false);
      }
    };
    loadInitialData();
  }, []);

  // --- 2. Hàm Tự động Hoàn thành/Tìm kiếm Sản phẩm ---
  const handleProductSearch = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      const productsRes = await fetchProductsAndInventory("");
      setProductOptions(
        (productsRes || []).filter((p) => !p.isSerialResult) || []
      );
      return;
    }
    try {
      const res = await fetchProductsAndInventory(searchText);
      setProductOptions((res || []).filter((p) => !p.isSerialResult) || []);
    } catch (error) {
      message.error("Lỗi tìm kiếm sản phẩm.");
    }
  }, []);

  // --- 3. Hàm Xử lý khi chọn Sản phẩm ---
  const handleProductChange = async (value, formDetailIndex, formInstance) => {
    let product = productOptions.find((p) => p.Barcode === value);
    if (!product) return;

    const currentDetails = formInstance.getFieldValue("details");
    setSelectedProductData((prev) => ({ ...prev, [product.Barcode]: product }));

    // Lấy giá trị hiện tại của sản phẩm
    const newUnitPrice = product.CostPrice || 0;
    const newWarrantyMonths = product.DefaultWarranty || 0;
    const currentSalePrice = product.SalePrice;
    const isSerialProduct = product.IsSerial;

    // Cập nhật các trường mặc định
    const updatedDetail = {
      ...currentDetails[formDetailIndex],
      barcode: product.Barcode,
      quantity: isSerialProduct ? 0 : 1, // SL mặc định 1 cho lô, 0 cho serial
      unitPrice: newUnitPrice,
      newSalePrice: currentSalePrice,
      warrantyMonths: newWarrantyMonths,
      batchId: null,
      serialInput: null,
    };

    formInstance.setFieldsValue({
      details: currentDetails.map((item, index) =>
        index === formDetailIndex ? updatedDetail : item
      ),
    });

    // Fetch Lô còn tồn nếu KHÔNG phải Serial
    if (!isSerialProduct) {
      try {
        const batchesRes = await fetchBatchesByProduct(product.Barcode);
        setBatchesData((prev) => ({
          ...prev,
          [product.Barcode]: batchesRes.data,
        }));
      } catch (error) {
        message.warning("Không thể tải các lô hiện có.");
      }
    }
  };

  // --- 4. Hàm Xem Chi Tiết Sản phẩm ---
  const handleViewDetail = async (barcode) => {
    if (!barcode) return;
    setIsLoading(true);
    try {
      const detailRes = await getProductDetail(barcode);
      setProductDetailData(detailRes.product);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error("Lỗi khi tải chi tiết sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. Hàm Tạo Nhà cung cấp (ĐÃ SỬA) ---
  const handleCreateSupplier = async (values) => {
    setIsLoading(true);
    try {
      // Đảm bảo tên trường khớp với Sequelize Model: Name, Phone, Email, Address
      const newSupplier = await createSupplier(values);

      setSuppliers((prev) => [...prev, newSupplier]);
      // Cập nhật giá trị vào Select của form nhập kho
      form.setFieldsValue({ supplierId: newSupplier.SupplierID });

      // Reset form NCC và đóng Modal
      supplierForm.resetFields();
      message.success(`Đã tạo Nhà cung cấp ${newSupplier.Name} thành công.`);
      setIsSupplierModalVisible(false);
    } catch (error) {
      message.error(error.message || "Lỗi tạo nhà cung cấp.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. Chuẩn bị Dữ liệu & Submit ---
  const prepareDataForImport = (values) => {
    const { supplierId, description, details } = values;

    const importDetails = details.map((item) => {
      const product = selectedProductData[item.barcode];
      const isSerialProduct = product?.IsSerial;

      let serialNumbers = null;
      let quantity = item.quantity;

      if (isSerialProduct) {
        serialNumbers = item.serialInput
          ? item.serialInput
              .split(/[\n,]+/)
              .map((s) => s.trim())
              .filter((s) => s)
          : [];
        quantity = serialNumbers.length;
      }

      return {
        barcode: item.barcode,
        quantity: quantity,
        unitPrice: item.unitPrice,
        newSalePrice: item.newSalePrice,
        serialNumbers: isSerialProduct ? serialNumbers : null,
        batchDetails: !isSerialProduct
          ? {
              // batchId = null sẽ tạo lô mới
              batchId: item.batchId,
              warrantyMonths: item.warrantyMonths,
            }
          : null,
        warrantyMonths: item.warrantyMonths,
      };
    });

    return { supplierId, description, details: importDetails };
  };

  const confirmImport = async () => {
    try {
      const values = await form.validateFields();
      const importData = prepareDataForImport(values);

      setIsLoading(true);
      const result = await createGoodsImport(importData);

      const totalQuantity = importData.details.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalAmount = importData.details.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      setLastVoucher({
        voucherCode: result.voucherCode, // Giả định service trả về voucherCode
        voucherId: result.voucherId,
        totalQuantity: totalQuantity,
        totalAmount: totalAmount,
      });
      setIsSuccessModalVisible(true);

      form.resetFields();
      setSelectedProductData({});
      setIsPreviewModalVisible(false);
    } catch (error) {
      message.error(error.message || "Lỗi xử lý nhập kho.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const data = prepareDataForImport(values);
      setPreviewData(data);
      setIsPreviewModalVisible(true);
    } catch (errorInfo) {
      message.error("Vui lòng điền đầy đủ và chính xác các trường bắt buộc.");
    }
  };

  // --- 7. Định nghĩa cột Bảng Chi tiết ---
  const columns = (formInstance) => [
    {
      title: "Sản phẩm",
      dataIndex: "barcode",
      width: "18%",
      render: (text, record, index) => (
        <Form.Item
          name={[index, "barcode"]}
          rules={[{ required: true, message: "Chọn SP" }]}
        >
          <Select
            showSearch
            placeholder="Tìm theo Tên/Barcode"
            onChange={(value) =>
              handleProductChange(value, index, formInstance)
            }
            onSearch={handleProductSearch}
            filterOption={false}
            disabled={isLoading}
          >
            {productOptions.map((p) => (
              <Option key={p.Barcode} value={p.Barcode}>
                {p.Name} ({p.Barcode})
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: "Giá Nhập",
      dataIndex: "unitPrice",
      width: "10%",
      render: (text, record, index) => (
        <Form.Item
          name={[index, "unitPrice"]}
          rules={[{ required: true, message: "Nhập Giá" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            disabled={isLoading}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>
      ),
    },
    {
      title: "Giá Bán",
      dataIndex: "newSalePrice",
      width: "10%",
      render: (text, record, index) => (
        <Form.Item
          name={[index, "newSalePrice"]}
          rules={[{ required: true, message: "Nhập Giá Bán" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            disabled={isLoading}
            placeholder="Giá bán hiện tại"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>
      ),
    },
    {
      title: "Lô/Serial & SL",
      dataIndex: "batchId",
      width: "25%",
      render: (text, record, index) => {
        const barcode = formInstance.getFieldValue([
          "details",
          index,
          "barcode",
        ]);
        const product = selectedProductData[barcode];

        if (!product)
          return <Input disabled placeholder="Chọn sản phẩm trước" />;

        const isSerial = product.IsSerial;

        if (isSerial) {
          return (
            <Form.Item
              name={[index, "serialInput"]}
              rules={[{ required: true, message: "Nhập Serial" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập từng Serial (cách nhau bởi Enter hoặc phẩy)"
                onChange={(e) => {
                  const serials = e.target.value
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter((s) => s);
                  // Đồng bộ số lượng hiển thị vào form field
                  formInstance.setFieldsValue({
                    details: formInstance
                      .getFieldValue("details")
                      .map((item, i) => {
                        if (i === index) {
                          return { ...item, quantity: serials.length };
                        }
                        return item;
                      }),
                  });
                }}
              />
            </Form.Item>
          );
        } else {
          const availableBatches = batchesData[barcode] || [];
          return (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Form.Item name={[index, "batchId"]}>
                <Select
                  placeholder="Chọn Lô cũ (hoặc để trống)"
                  disabled={isLoading}
                  allowClear
                >
                  {availableBatches.map((b) => (
                    <Option key={b.BatchID} value={b.BatchID}>
                      Lô #{b.BatchID} (Tồn: {b.Quantity} - Giá nhập:{" "}
                      {b.CostPrice?.toLocaleString() || "N/A"})
                    </Option>
                  ))}
                  <Option value={null}>[Tạo Lô mới]</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name={[index, "quantity"]}
                rules={[{ required: true, message: "Nhập SL" }]}
                initialValue={1}
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="Số lượng nhập"
                  disabled={isLoading}
                />
              </Form.Item>
            </Space>
          );
        }
      },
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: "8%",
      render: (text, record, index) => {
        const barcode = formInstance.getFieldValue([
          "details",
          index,
          "barcode",
        ]);
        const product = selectedProductData[barcode];
        const isSerial = product?.IsSerial;

        // Hiển thị SL
        const quantityValue = formInstance.getFieldValue([
          "details",
          index,
          "quantity",
        ]);

        return (
          <Form.Item
            name={[index, "quantity"]}
            rules={isSerial ? [] : [{ required: true, message: "Nhập SL" }]}
            initialValue={1}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              disabled={isSerial || isLoading}
              // Nếu là serial, giá trị được tính từ serialInput, chỉ hiển thị
              value={isSerial ? quantityValue : undefined}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Bảo hành (tháng)",
      dataIndex: "warrantyMonths",
      width: "15%",
      render: (text, record, index) => (
        <Form.Item name={[index, "warrantyMonths"]}>
          <InputNumber min={0} style={{ width: "100%" }} disabled={isLoading} />
        </Form.Item>
      ),
    },
    {
      title: "Hành động",
      width: "10%",
      render: (text, record, index) => {
        const barcode = formInstance.getFieldValue([
          "details",
          index,
          "barcode",
        ]);
        return (
          <Space size="small">
            <Button
              icon={<EyeOutlined />}
              size="small"
              disabled={!barcode || isLoading}
              onClick={() => handleViewDetail(barcode)}
              title="Xem chi tiết sản phẩm"
            />
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => {
                const details = formInstance.getFieldValue("details");
                formInstance.setFieldsValue({
                  details: details?.filter((_, i) => i !== index),
                });
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <Spin spinning={isFetchingData} tip="Đang tải dữ liệu...">
      <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
        <h2>
          <TruckOutlined /> Tạo Đơn Nhập Kho
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={confirmImport}
          initialValues={{ details: [{}] }}
          disabled={isLoading}
        >
          {/* Phần Nhà cung cấp */}
          <Row gutter={16}>
            <Col span={20}>
              <Form.Item
                name="supplierId"
                label="Nhà cung cấp"
                rules={[
                  { required: true, message: "Vui lòng chọn nhà cung cấp" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn Nhà cung cấp"
                  disabled={isLoading}
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {suppliers.map((s) => (
                    <Option key={s.SupplierID} value={s.SupplierID}>
                      {s.Name} {s.Phone ? `(${s.Phone})` : ""}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="&nbsp;">
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsSupplierModalVisible(true)}
                  block
                >
                  Tạo mới
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Ghi chú">
            <Input.TextArea
              rows={2}
              placeholder="Mô tả cho chứng từ nhập kho"
              disabled={isLoading}
            />
          </Form.Item>

          {/* Chi tiết Sản phẩm */}
          <h3 style={{ marginTop: 20 }}>Chi tiết Sản phẩm nhập</h3>
          <Form.List name="details">
            {(fields, { add }) => (
              <>
                <Table
                  dataSource={fields}
                  columns={[...columns(form)]}
                  pagination={false}
                  rowKey="key"
                />
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{ marginTop: 16 }}
                    disabled={isLoading}
                  >
                    Thêm Sản phẩm
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* --- Nút Submit & Preview --- */}
          <Form.Item style={{ marginTop: 30 }}>
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoading}
                icon={<SaveOutlined />}
              >
                Xác nhận Nhập Kho
              </Button>
              <Button
                type="default"
                size="large"
                onClick={handlePreview}
                disabled={isLoading}
                icon={<EyeOutlined />}
              >
                Xem trước
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Modal: Tạo Nhà cung cấp (ĐÃ SỬA) */}
        <Modal
          title="Tạo Nhà cung cấp mới"
          open={isSupplierModalVisible}
          onCancel={() => {
            setIsSupplierModalVisible(false);
            supplierForm.resetFields(); // Reset form khi hủy
          }}
          footer={null}
        >
          <Form
            layout="vertical"
            onFinish={handleCreateSupplier}
            form={supplierForm} // <--- GẮN supplierForm
          >
            {/* Tên NCC: BẮT BUỘC theo Sequelize Model */}
            <Form.Item
              name="Name"
              label="Tên Nhà cung cấp"
              rules={[
                { required: true, message: "Vui lòng nhập tên nhà cung cấp" },
              ]}
            >
              <Input />
            </Form.Item>
            {/* Số điện thoại: KHÔNG BẮT BUỘC theo Sequelize Model */}
            <Form.Item name="Phone" label="Số điện thoại">
              <Input />
            </Form.Item>
            {/* Email: KHÔNG BẮT BUỘC theo Sequelize Model */}
            <Form.Item
              name="Email"
              label="Email"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input />
            </Form.Item>
            {/* Địa chỉ: KHÔNG BẮT BUỘC theo Sequelize Model */}
            <Form.Item name="Address" label="Địa chỉ">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isLoading}
              >
                Tạo Nhà cung cấp
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>

      {/* --- MODAL XEM CHI TIẾT SẢN PHẨM --- */}
      <Modal
        title="Chi tiết Sản phẩm"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setProductDetailData(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        {productDetailData ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Barcode">
              {productDetailData.Barcode}
            </Descriptions.Item>
            <Descriptions.Item label="Tên sản phẩm">
              {productDetailData.Name}
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục">
              {productDetailData.Category?.Name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Thương hiệu">
              {productDetailData.Brand?.Name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại quản lý">
              {productDetailData.IsSerial ? (
                <Text strong type="danger">
                  Theo Serial Number
                </Text>
              ) : (
                <Text strong type="success">
                  Theo Lô/Số lượng
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí lưu trữ">
              {productDetailData.Location?.Name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá bán">
              {productDetailData.SalePrice?.toLocaleString()} VND
            </Descriptions.Item>
            <Descriptions.Item label="Giá vốn TB">
              {productDetailData.AverageCost?.toLocaleString() || "N/A"} VND
            </Descriptions.Item>
            <Descriptions.Item label="Tồn kho hiện tại">
              {productDetailData.StockQuantity}
            </Descriptions.Item>
            <Descriptions.Item label="Tồn kho tối thiểu">
              <Text type="danger">{productDetailData.MinStockLevel}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tồn kho tối đa">
              <Text type="success">{productDetailData.MaxStockLevel}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {productDetailData.Description || "Không có"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Spin tip="Đang tải..." />
        )}
      </Modal>

      {/* --- MODAL XEM TRƯỚC (PREVIEW) --- */}
      <Modal
        title="Xem trước Chứng từ Nhập Kho"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        onOk={confirmImport}
        okText="Xác nhận Nhập Kho"
        cancelText="Quay lại chỉnh sửa"
        width={900}
        confirmLoading={isLoading}
      >
        {previewData ? (
          <>
            <p>
              <p>
                <strong>Nhà cung cấp:</strong>{" "}
                {getSupplierName(previewData.supplierId)}
              </p>{" "}
            </p>
            <p>
              <strong>Ghi chú:</strong> {previewData.description || "Không có"}
            </p>
            <Table
              dataSource={previewData.details}
              columns={[
                { title: "Barcode", dataIndex: "barcode" },
                { title: "SL", dataIndex: "quantity" },
                {
                  title: "Giá Nhập",
                  dataIndex: "unitPrice",
                  render: (text) => `${Number(text).toLocaleString()} VND`,
                },
                {
                  title: "Giá Bán",
                  dataIndex: "newSalePrice",
                  render: (text) => `${Number(text).toLocaleString()} VND`,
                },
                {
                  title: "Lô/Serial",
                  dataIndex: "serialNumbers",
                  render: (serialNumbers, record) => {
                    if (serialNumbers && serialNumbers.length > 0) {
                      return (
                        <Text strong>
                          {serialNumbers.length} mã Serial
                          <Tooltip
                            title={
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {serialNumbers.map((sn, i) => (
                                  <li key={i}>{sn}</li>
                                ))}
                              </ul>
                            }
                          >
                            <EyeOutlined
                              style={{ marginLeft: 5, cursor: "pointer" }}
                            />
                          </Tooltip>
                        </Text>
                      );
                    }
                    return `Batch ID: ${
                      record.batchDetails?.batchId || "[Mới]"
                    }`;
                  },
                },
                { title: "BH (tháng)", dataIndex: "warrantyMonths" },
              ]}
              pagination={false}
              rowKey={(record, index) => record.barcode + index}
              style={{ marginTop: 15 }}
            />
            <Text strong style={{ marginTop: 20, display: "block" }}>
              Tổng số lượng:{" "}
              {previewData.details.reduce(
                (sum, item) => sum + item.quantity,
                0
              )}{" "}
              sản phẩm
            </Text>
          </>
        ) : (
          <Text type="secondary">Chưa có dữ liệu để xem trước.</Text>
        )}
      </Modal>

      {/* --- MODAL THÔNG BÁO THÀNH CÔNG --- */}
      <Modal
        title={
          <Text type="success" strong>
            <CheckCircleOutlined /> NHẬP KHO THÀNH CÔNG
          </Text>
        }
        open={isSuccessModalVisible}
        onCancel={() => setIsSuccessModalVisible(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setIsSuccessModalVisible(false)}
          >
            Đóng
          </Button>,
          <Button
            key="view"
            type="default"
            // Sử dụng Link bên trong Button để giữ nguyên Ant Design look
            style={{ padding: 0, border: "none" }}
            disabled={!lastVoucher?.voucherId}
          >
            <Link
              to={`/inventory/vouchers/${lastVoucher?.voucherId}`}
              style={{
                display: "block",
                padding: "0 15px",
                height: "32px",
                lineHeight: "30px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
              }}
              onClick={() => setIsSuccessModalVisible(false)}
            >
              Xem Chứng từ
            </Link>
          </Button>,
        ]}
      >
        {lastVoucher && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Mã Chứng từ">
              <Text copyable strong type="success">
                {lastVoucher.voucherCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {new Date().toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng SL nhập">
              {lastVoucher.totalQuantity?.toLocaleString() || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng giá trị">
              {lastVoucher.totalAmount
                ? `${Number(lastVoucher.totalAmount).toLocaleString()} VND`
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Spin>
  );
};

export default ImportGoods;
