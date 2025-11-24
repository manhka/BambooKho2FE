import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  message,
  Switch,
  Row,
  Col,
  Space,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

import * as productService from "../../services/productService";
import * as categoryService from "../../services/categoryService";
import * as brandService from "../../services/brandService";
import * as locationService from "../../services/locationService";

import LocationFormModal from "../location/LocationFormModal"; // Giả định Modal này tồn tại

const { Option } = Select;
const { TextArea } = Input;

const EditProduct = () => {
  const navigate = useNavigate();
  const { barcode } = useParams();
  const [form] = Form.useForm();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [imageUrlPreview, setImageUrlPreview] = useState("");

  // --- Load data categories, brands, locations ---
  const fetchAllLocations = async () => {
    try {
      const data = await locationService.fetchLocations(1, 1000, "", "active");
      setLocations(data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách vị trí:", error);
      message.error("Không thể tải danh sách vị trí.");
      setLocations([]);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [categoryRes, brandRes] = await Promise.all([
        categoryService
          .fetchCategories(1, 1000, "", "active")
          .catch(() => ({ items: [] })),
        brandService
          .fetchBrands(1, 1000, "", "active")
          .catch(() => ({ items: [] })),
      ]);
      setCategories(categoryRes.items || []);
      setBrands(brandRes.items || []);
      await fetchAllLocations();
    } catch (error) {
      message.error("Không thể tải dữ liệu danh mục, thương hiệu hoặc vị trí.");
    }
  };

  const fetchProductData = async () => {
    try {
      const data = await productService.getProductDetail(barcode);
      const dynamicAttributes = data.product.Attributes
        ? Object.entries(data.product.Attributes).map(([key, value]) => ({
            key,
            value,
          }))
        : [];

      form.setFieldsValue({
        ...data.product,
        Status: data.product.Status === "active",
        dynamicAttributes:
          dynamicAttributes.length > 0
            ? dynamicAttributes
            : [{ key: "", value: "" }],
      });
      setImageUrlPreview(data.product.ImageUrl || "");
    } catch (error) {
      console.error(error);
      message.error("Không thể tải thông tin sản phẩm.");
      navigate("/products/list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchProductData();
  }, [barcode]);

  const handleLocationModalSuccess = async (newLocation) => {
    setIsLocationModalVisible(false);
    await fetchAllLocations();
    if (newLocation?.id) {
      form.setFieldsValue({ LocationID: newLocation.id });
      message.success(`Vị trí "${newLocation.Name}" đã được tạo và chọn.`);
    }
  };

  // --- Handlers (onFinish) ---
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const attributesObject = {};
      (values.dynamicAttributes || []).forEach((attr) => {
        if (attr.key && attr.value)
          attributesObject[attr.key.trim()] = attr.value.trim();
      });

      const productData = {
        ...values,
        Status: values.Status ? "active" : "archived",
        Attributes: Object.keys(attributesObject).length
          ? attributesObject
          : null,
        LocationID: values.LocationID,

        // ⭐️ CẬP NHẬT TRƯỜNG TỒN KHO VÀ GIÁ
        CostPrice: parseFloat(values.CostPrice),
        SalePrice: parseFloat(values.SalePrice),
        StockQuantity: parseInt(values.StockQuantity), // <-- Tồn kho vật lý (chú ý nghiệp vụ)
        AverageCost: parseFloat(values.AverageCost), // Dữ liệu này có thể bị bỏ qua ở BE nếu không cần chỉnh
        MinStockLevel: parseInt(values.MinStockLevel || 0),
        MaxStockLevel: parseInt(values.MaxStockLevel || 0),
      };

      delete productData.dynamicAttributes;

      await productService.updateProduct(barcode, productData);

      message.success("Cập nhật sản phẩm thành công!");
      navigate("/products/list");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi cập nhật sản phẩm.";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = () => {
    message.error("Vui lòng kiểm tra lại các trường dữ liệu bắt buộc.");
  };

  if (loading) return <div>Đang tải dữ liệu sản phẩm...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/products/list")}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card title={`Cập nhật sản phẩm: ${barcode}`} variant="contained">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          onValuesChange={(changedValues) => {
            if (changedValues.ImageUrl !== undefined)
              setImageUrlPreview(changedValues.ImageUrl);
          }}
        >
          <Row gutter={24}>
            {/* ======================================================== */}
            {/* Cột 1: Thông tin cơ bản và Phân loại */}
            {/* ======================================================== */}
            <Col span={12}>
              <Form.Item
                label="Barcode (Mã vạch)"
                name="Barcode"
                rules={[{ required: true, message: "Vui lòng nhập Barcode!" }]}
              >
                <Input placeholder="Mã vạch" disabled />{" "}
                {/* Barcode KHÔNG được sửa sau khi tạo */}
              </Form.Item>

              <Form.Item
                label="Tên sản phẩm"
                name="Name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên sản phẩm!" },
                ]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Danh mục"
                    name="CategoryID"
                    rules={[{ required: true, message: "Chọn danh mục!" }]}
                  >
                    <Select
                      placeholder="Chọn danh mục"
                      showSearch
                      optionFilterProp="children"
                    >
                      {categories.map((cat) => (
                        <Option key={cat.CategoryID} value={cat.CategoryID}>
                          {cat.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Thương hiệu"
                    name="BrandID"
                    rules={[{ required: true, message: "Chọn thương hiệu!" }]}
                  >
                    <Select
                      placeholder="Chọn thương hiệu"
                      showSearch
                      optionFilterProp="children"
                    >
                      {brands.map((brand) => (
                        <Option key={brand.BrandID} value={brand.BrandID}>
                          {brand.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="URL Hình ảnh" name="ImageUrl">
                <Input placeholder="Dán link ảnh sản phẩm (Tùy chọn)" />
              </Form.Item>

              {imageUrlPreview && (
                <div
                  style={{
                    marginBottom: 16,
                    marginTop: -10,
                    textAlign: "center",
                  }}
                >
                  <img
                    src={imageUrlPreview}
                    alt="Xem trước ảnh sản phẩm"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      border: "1px solid #d9d9d9",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}

              <Form.Item label="Mô tả" name="Description">
                <TextArea rows={3} placeholder="Mô tả chi tiết về sản phẩm" />
              </Form.Item>
            </Col>

            {/* ======================================================== */}
            {/* Cột 2: Giá, Tồn kho, Vị trí và Attributes */}
            {/* ======================================================== */}
            <Col span={12}>
              {/* --- Giá cả --- */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Giá nhập"
                    name="CostPrice"
                    rules={[
                      { required: true, message: "Nhập giá nhập!" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const numValue = parseFloat(value);
                          if (!value || numValue > 0) return Promise.resolve();
                          return Promise.reject(
                            new Error("Giá nhập phải lớn hơn 0!")
                          );
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giá bán"
                    name="SalePrice"
                    rules={[
                      { required: true, message: "Nhập giá bán!" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const cost = parseFloat(getFieldValue("CostPrice"));
                          const salePrice = parseFloat(value);
                          if (!value || salePrice > 0) {
                            if (salePrice >= cost) return Promise.resolve();
                            return Promise.reject(
                              new Error(
                                "Giá bán phải lớn hơn hoặc bằng Giá nhập!"
                              )
                            );
                          }
                          return Promise.reject(
                            new Error("Giá bán phải lớn hơn 0!")
                          );
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* --- Tồn kho Vật lý & Giá vốn TB --- */}
              <Row gutter={16} style={{ marginTop: 10 }}>
                <Col span={12}>
                  <Tooltip
                    title={
                      "Chỉ điều chỉnh trực tiếp số lượng tồn kho này trong trường hợp khắc phục lỗi kiểm kê."
                    }
                  >
                    <Form.Item
                      label={
                        <Space>
                          Tồn kho Vật lý
                          <MinusCircleOutlined style={{ color: "red" }} />
                        </Space>
                      }
                      name="StockQuantity"
                      rules={[
                        { required: true, message: "Nhập số lượng tồn kho!" },
                        {
                          type: "number",
                          min: 0,
                          message: "Số lượng không được âm.",
                        },
                      ]}
                    >
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Tooltip>
                </Col>

                <Col span={12}>
                  <Form.Item label="Giá vốn trung bình" name="AverageCost">
                    {/* Giá vốn trung bình được tính toán tự động, Admin không được sửa trực tiếp */}
                    <InputNumber
                      style={{ width: "100%" }}
                      disabled
                      placeholder="Được tính toán tự động"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* --- Tồn kho Định mức (Min/Max) --- */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Định mức tồn tối thiểu"
                    name="MinStockLevel"
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Định mức tồn tối đa" name="MaxStockLevel">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
              </Row>

              {/* VỊ TRÍ LƯU TRỮ */}
              <Row>
                <Col span={24}>
                  <Form.Item
                    label="Vị trí lưu trữ"
                    name="LocationID"
                    rules={[
                      { required: true, message: "Vui lòng chọn vị trí!" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn vị trí"
                      showSearch
                      allowClear
                      dropdownRender={(menu) => (
                        <>
                          <Space style={{ padding: "4px 8px" }}>{menu}</Space>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setIsLocationModalVisible(true)}
                            style={{ width: "100%", marginTop: 5 }}
                          >
                            Tạo Vị trí mới
                          </Button>
                        </>
                      )}
                      optionFilterProp="children"
                    >
                      {locations.map((loc) => (
                        <Option key={loc.id} value={loc.id}>
                          <Space>
                            <EnvironmentOutlined /> {loc.Name} ({loc.Code})
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Space
                direction="horizontal"
                size="large"
                style={{ marginBottom: 15, marginTop: 5 }}
              >
                <Form.Item
                  label="Trạng thái"
                  name="Status"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Switch
                    checkedChildren="Active"
                    unCheckedChildren="Archived"
                  />
                </Form.Item>

                <Form.Item
                  label="Quản lý Serial/IMEI?"
                  name="IsSerial"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>
              </Space>

              {/* --- Thuộc tính động (Dynamic Attributes) --- */}
              <Card
                title="Thuộc tính sản phẩm (Tùy chọn)"
                size="small"
                style={{ marginTop: 20 }}
              >
                <Form.List
                  name="dynamicAttributes"
                  initialValue={[{ key: "", value: "" }]}
                >
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, fieldKey, ...restField }) => (
                        <Space
                          key={key}
                          style={{ display: "flex", marginBottom: 8 }}
                          align="baseline"
                        >
                          <Form.Item
                            {...restField}
                            name={[name, "key"]}
                            fieldKey={[fieldKey, "key"]}
                            rules={[
                              {
                                required: true,
                                message: "Nhập tên thuộc tính",
                              },
                            ]}
                          >
                            <Input
                              placeholder="Tên thuộc tính"
                              style={{ width: 150 }}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "value"]}
                            fieldKey={[fieldKey, "value"]}
                            rules={[
                              { required: true, message: "Nhập giá trị" },
                            ]}
                          >
                            <Input
                              placeholder="Giá trị"
                              style={{ width: 150 }}
                            />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Thêm Thuộc tính
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Card>
            </Col>
          </Row>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              style={{ width: "100%", height: "40px", marginTop: "20px" }}
              size="large"
            >
              Cập nhật sản phẩm
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* LocationFormModal */}
      {isLocationModalVisible && (
        <LocationFormModal
          visible={isLocationModalVisible}
          initialData={null}
          onClose={() => setIsLocationModalVisible(false)}
          onSuccess={handleLocationModalSuccess}
        />
      )}
    </div>
  );
};

export default EditProduct;
