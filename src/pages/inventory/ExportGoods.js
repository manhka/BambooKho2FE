// components/ExportGoods.js

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
  CheckCircleOutlined,
  EyeOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { createGoodsExport } from "../../services/inventoryService";
import { fetchCustomers, createCustomer } from "../../services/customerService";
import {
  fetchProductsAndInventory,
  fetchBatchesByProduct,
  fetchSerialsByProduct,
  getProductDetail,
} from "../../services/productService";

const { Option } = Select;
const { Text } = Typography;

const ExportGoods = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [batchesData, setBatchesData] = useState({});
  const [serialsData, setSerialsData] = useState({});

  const [selectedProductData, setSelectedProductData] = useState({});

  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [productDetailData, setProductDetailData] = useState(null);

  // --- Hàm tiện ích ---
  const getCustomerName = (id) => {
    const customer = customers.find((c) => c.CustomerID === id);
    return customer ? customer.FullName : `ID: ${id} (Không tìm thấy)`;
  };

  // --- 1. Fetch Dữ liệu Ban đầu (Khách hàng & Sản phẩm) ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsFetchingData(true);
      try {
        const customersRes = await fetchCustomers();
        setCustomers(customersRes.items || []);

        const productsRes = await fetchProductsAndInventory("");
        setProductOptions(productsRes || []);
      } catch (error) {
        message.error("Không thể tải dữ liệu ban đầu.");
      } finally {
        setIsFetchingData(false);
      }
    };
    loadInitialData();
  }, []);

  // --- 2. Hàm Tìm kiếm Sản phẩm ---
  const handleProductSearch = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) return;
    try {
      const res = await fetchProductsAndInventory(searchText);
      setProductOptions(res || []);
    } catch (error) {
      message.error("Lỗi tìm kiếm sản phẩm.");
    }
  }, []);

  // --- 3. Hàm Xử lý khi chọn Sản phẩm ---
  const handleProductChange = async (value, formDetailIndex, formInstance) => {
    let product =
      productOptions.find((p) => p.Barcode === value) ||
      productOptions.find((p) => p.isSerialResult && p.serialNumber === value);

    if (!product) return;

    const currentDetails = formInstance.getFieldValue("details");

    setSelectedProductData((prev) => ({ ...prev, [product.Barcode]: product }));

    const isSerialProduct = product.IsSerial;
    const newQuantity = product.isSerialResult ? 1 : 0;
    const newSerialIdentifiers = product.isSerialResult
      ? [product.serialNumber]
      : null;

    formInstance.setFieldsValue({
      details: currentDetails.map((item, index) => {
        if (index === formDetailIndex) {
          return {
            ...item,
            barcode: product.Barcode,
            unitPrice: product.SalePrice,
            quantity: newQuantity,
            serialIds: newSerialIdentifiers,
            batchId: null,
            warrantyMonths: product.DefaultWarranty || 0,
          };
        }
        return item;
      }),
    });

    // Fetch Lô/Serial còn tồn từ Backend
    if (!product.isSerialResult) {
      try {
        if (isSerialProduct) {
          const serialsRes = await fetchSerialsByProduct(product.Barcode);
          setSerialsData((prev) => ({
            ...prev,
            [product.Barcode]: serialsRes.data || [],
          }));
        } else {
          const batchesRes = await fetchBatchesByProduct(product.Barcode);
          setBatchesData((prev) => ({
            ...prev,
            [product.Barcode]: batchesRes.data || [],
          }));
        }
      } catch (error) {
        message.warning("Không thể tải tồn kho chi tiết.");
      }
    }
  };

  // --- 4. Hàm đồng bộ SL khi chọn Serial ---
  const handleSerialChange = (serials, index, formInstance) => {
    formInstance.setFieldsValue({
      details: formInstance.getFieldValue("details").map((item, i) => {
        if (i === index) {
          return { ...item, serialIds: serials, quantity: serials.length };
        }
        return item;
      }),
    });
  };

  // --- 5. Hàm Tạo Khách hàng ---
  const handleCreateCustomer = async (values) => {
    setIsLoading(true);
    try {
      const newCustomer = await createCustomer(values);
      setCustomers((prev) => [...prev, newCustomer]);
      form.setFieldsValue({ customerId: newCustomer.CustomerID });
      message.success(`Đã tạo Khách hàng ${newCustomer.FullName} thành công.`);
      setIsCustomerModalVisible(false);
    } catch (error) {
      message.error(error.message || "Lỗi tạo khách hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. Hàm Xem Chi Tiết Sản phẩm ---
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

  // --- 7. Chuẩn bị Dữ liệu & Submit ---
  const prepareDataForExport = (values) => {
    const { customerId, description, details } = values;

    const exportDetails = details.map((item) => {
      const product = selectedProductData[item.barcode];
      const isSerialProduct = product?.IsSerial;

      const finalSerialIdentifiers = isSerialProduct ? item.serialIds : null;

      return {
        barcode: item.barcode,
        quantity:
          item.quantity ||
          (isSerialProduct ? finalSerialIdentifiers?.length : 0),
        unitPrice: item.unitPrice,
        batchId: !isSerialProduct ? item.batchId : null,
        serialIdentifiers: finalSerialIdentifiers,
        warrantyMonths: item.warrantyMonths,
      };
    });

    return { customerId, description, details: exportDetails };
  };

  const confirmExport = async () => {
    try {
      const values = await form.validateFields();
      const exportData = prepareDataForExport(values);

      setIsLoading(true);
      const result = await createGoodsExport(exportData);

      message.success(
        `Xuất kho thành công! Mã chứng từ: ${result.voucherCode}`
      );

      form.resetFields();
      setSelectedProductData({});
      setPreviewData(null);
      setIsPreviewModalVisible(false);
    } catch (error) {
      message.error(error.message || "Lỗi xử lý xuất kho.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const data = prepareDataForExport(values);
      setPreviewData(data);
      setIsPreviewModalVisible(true);
    } catch (errorInfo) {
      message.error("Vui lòng điền đầy đủ và chính xác các trường bắt buộc.");
    }
  };

  // --- 8. Định nghĩa cột Bảng Chi tiết ---
  const columns = (formInstance) => [
    {
      title: "Sản phẩm",
      dataIndex: "barcode",
      width: "25%",
      render: (text, record, index) => (
        <Form.Item
          name={[index, "barcode"]}
          rules={[{ required: true, message: "Chọn SP" }]}
          initialValue={text}
        >
          <Select
            showSearch
            placeholder="Tìm theo Tên/Barcode/Serial"
            onChange={(value) =>
              handleProductChange(value, index, formInstance)
            }
            onSearch={handleProductSearch}
            filterOption={false}
            disabled={isLoading}
          >
            {productOptions.map((p) => (
              <Option
                key={p.Barcode || p.serialNumber}
                value={p.Barcode || p.serialNumber}
              >
                {p.isSerialResult
                  ? `[Serial] ${p.serialNumber}`
                  : `${p.Name} (${p.Barcode})`}
              </Option>
            ))}
          </Select>
        </Form.Item>
      ),
    },
    {
      title: "Lô/Serial",
      dataIndex: "batchId",
      width: "20%",
      render: (text, record, index) => {
        const barcode = formInstance.getFieldValue([
          "details",
          index,
          "barcode",
        ]);
        const product = selectedProductData[barcode];

        if (!product)
          return <Input disabled placeholder="Chọn sản phẩm trước" />;

        if (product.IsSerial) {
          const availableSerials = serialsData[barcode] || [];
          const currentSerialNumber = formInstance.getFieldValue([
            "details",
            index,
            "serialIds",
          ]);

          if (product.isSerialResult) {
            return <Text strong>{product.serialNumber}</Text>;
          }

          return (
            <Form.Item
              name={[index, "serialIds"]}
              rules={[{ required: true, message: "Chọn Serial" }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn các Serial cần xuất"
                disabled={isLoading}
                value={currentSerialNumber}
                onChange={(serials) =>
                  handleSerialChange(serials, index, formInstance)
                }
              >
                {availableSerials.map((s) => (
                  <Option key={s.SerialNumber} value={s.SerialNumber}>
                    {s.SerialNumber}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        } else {
          const availableBatches = batchesData[barcode] || [];
          return (
            <Form.Item
              name={[index, "batchId"]}
              rules={[{ required: true, message: "Chọn Lô" }]}
            >
              <Select placeholder="Chọn Lô" disabled={isLoading}>
                {availableBatches.map((b) => (
                  <Option key={b.BatchID} value={b.BatchID}>
                    Lô #{b.BatchID} (Tồn: {b.Quantity})
                  </Option>
                ))}
              </Select>
            </Form.Item>
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

        const serials =
          formInstance.getFieldValue(["details", index, "serialIds"]) || [];
        const currentQuantity = serials.length;

        return (
          <Form.Item
            name={[index, "quantity"]}
            initialValue={isSerial ? currentQuantity : 0}
            rules={isSerial ? [] : [{ required: true, message: "Nhập SL" }]}
          >
            <InputNumber
              value={isSerial ? currentQuantity : undefined}
              min={1}
              style={{ width: "100%" }}
              disabled={isSerial || isLoading}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Giá bán",
      dataIndex: "unitPrice",
      width: "12%",
      render: (text, record, index) => (
        <Form.Item
          name={[index, "unitPrice"]}
          rules={[{ required: true, message: "Nhập Giá" }]}
        >
          <InputNumber
            min={0}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            style={{ width: "100%" }}
            disabled={isLoading}
          />
        </Form.Item>
      ),
    },
    {
      title: "Bảo hành (tháng)",
      dataIndex: "warrantyMonths",
      width: "15%",
      render: (text, record, index) => {
        const barcode = formInstance.getFieldValue([
          "details",
          index,
          "barcode",
        ]);
        const product = selectedProductData[barcode];

        if (!product || !product.IsSerial) return <span>-</span>;

        return (
          <Form.Item name={[index, "warrantyMonths"]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              disabled={isLoading}
            />
          </Form.Item>
        );
      },
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
                  details: details.filter((_, i) => i !== index),
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
          <CheckCircleOutlined /> Tạo Đơn Xuất Kho
        </h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={confirmExport}
          initialValues={{ details: [{}] }}
          disabled={isLoading}
        >
          {/* Phần Khách hàng */}
          <Row gutter={16}>
            <Col span={20}>
              <Form.Item
                name="customerId"
                label="Khách hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn khách hàng" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn Khách hàng"
                  disabled={isLoading}
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {customers.map((c) => (
                    <Option key={c.CustomerID} value={c.CustomerID}>
                      {c.FullName} {c.Phone ? `(${c.Phone})` : ""}
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
                  onClick={() => setIsCustomerModalVisible(true)}
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
              placeholder="Mô tả cho chứng từ xuất kho"
              disabled={isLoading}
            />
          </Form.Item>

          {/* Chi tiết Sản phẩm */}
          <h3 style={{ marginTop: 20 }}>Chi tiết Sản phẩm</h3>
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

          {/* Nút Submit & Preview */}
          <Form.Item style={{ marginTop: 30 }}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                onClick={confirmExport}
                loading={isLoading}
              >
                <CheckCircleOutlined /> Xác nhận Xuất Kho
              </Button>
              <Button
                type="default"
                size="large"
                onClick={handlePreview}
                disabled={isLoading}
              >
                <EyeOutlined /> Xem trước
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Modal: Tạo Khách hàng */}
        <Modal
          title="Tạo Khách hàng mới"
          open={isCustomerModalVisible}
          onCancel={() => setIsCustomerModalVisible(false)}
          footer={null}
        >
          <Form layout="vertical" onFinish={handleCreateCustomer}>
            <Form.Item
              name="fullName"
              label="Tên Khách hàng"
              rules={[{ required: true, message: "Nhập tên khách hàng" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: "Nhập SĐT" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isLoading}
              >
                Tạo Khách hàng
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal: Preview Chứng từ */}
        <Modal
          title="Xem trước Chứng từ Xuất Kho"
          open={isPreviewModalVisible}
          onCancel={() => setIsPreviewModalVisible(false)}
          onOk={confirmExport}
          okText="Xác nhận Xuất Kho"
          cancelText="Quay lại chỉnh sửa"
          width={800}
          confirmLoading={isLoading}
        >
          {previewData && (
            <>
              <p>
                <strong>Khách hàng:</strong>{" "}
                {getCustomerName(previewData.customerId)}
              </p>
              <p>
                <strong>Ghi chú:</strong>{" "}
                {previewData.description || "Không có"}
              </p>
              <Table
                dataSource={previewData.details}
                columns={[
                  { title: "Barcode", dataIndex: "barcode" },
                  { title: "SL", dataIndex: "quantity" },
                  {
                    title: "Giá bán",
                    dataIndex: "unitPrice",
                    render: (text) => `${Number(text).toLocaleString()} VND`,
                  },
                  {
                    title: "Lô/Serial",
                    dataIndex: "serialIdentifiers",
                    render: (serialIdentifiers, record) => {
                      if (serialIdentifiers && serialIdentifiers.length > 0) {
                        const tooltipContent = (
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: 20,
                              listStyleType: "decimal",
                            }}
                          >
                            {serialIdentifiers.map((sn, i) => (
                              <li key={i}>{sn}</li>
                            ))}
                          </ul>
                        );
                        return (
                          <Text strong style={{ whiteSpace: "nowrap" }}>
                            {serialIdentifiers.length} mã Serial
                            <Tooltip title={tooltipContent}>
                              <EyeOutlined
                                style={{
                                  marginLeft: 6,
                                  cursor: "pointer",
                                  color: "#1890ff",
                                }}
                              />
                            </Tooltip>
                          </Text>
                        );
                      }
                      return `Batch ID: ${record.batchId || "[N/A]"}`;
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
          )}
        </Modal>
      </div>

      {/* --- MODAL XEM CHI TIẾT SẢN PHẨM (VIEW DETAIL) --- */}
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
            {productDetailData.ImageUrl && (
              <Descriptions.Item label="Hình ảnh">
                <img
                  src={productDetailData.ImageUrl}
                  alt="Hình ảnh sản phẩm"
                  style={{ maxWidth: 200 }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <Spin tip="Đang tải..." />
        )}
      </Modal>
    </Spin>
  );
};

export default ExportGoods;
