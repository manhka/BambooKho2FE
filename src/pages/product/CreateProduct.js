import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

import LocationFormModal from "../location/LocationFormModal";

const { Option } = Select;
const { TextArea } = Input;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // --- States ---
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [imageUrlPreview, setImageUrlPreview] = useState("");

  // --- Functions: Tải dữ liệu ban đầu ---
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

  useEffect(() => {
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

        // Giả định tên trường là Name và ID trong categories/brands
        setCategories(categoryRes.items || []);
        setBrands(brandRes.items || []);
        await fetchAllLocations();
      } catch (error) {
        message.error("Không thể tải dữ liệu ban đầu.");
      }
    };

    fetchInitialData();
  }, []);

  const handleLocationModalSuccess = async (newLocation) => {
    setIsLocationModalVisible(false);
    await fetchAllLocations();

    if (newLocation && newLocation.id) {
      form.setFieldsValue({
        LocationID: newLocation.id,
      });
      message.success(`Vị trí "${newLocation.Name}" đã được tạo và chọn.`);
    }
  };

  // --- Handlers (onFinish) ---
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const attributesObject = {};
      if (values.dynamicAttributes && values.dynamicAttributes.length > 0) {
        values.dynamicAttributes.forEach((attr) => {
          if (attr.key && attr.value) {
            attributesObject[attr.key.trim()] = attr.value.trim();
          }
        });
      }

      const productData = {
        ...values,
        Status: values.Status ? "active" : "archived",
        Attributes:
          Object.keys(attributesObject).length > 0 ? attributesObject : null,
        LocationID: values.LocationID, // LocationID bắt buộc phải có giá trị ở đây
        // Chuyển đổi giá trị InputNumber thành số
        CostPrice: parseFloat(values.CostPrice),
        SalePrice: parseFloat(values.SalePrice),
        StockQuantity: parseInt(values.StockQuantity || 0),
        MinStockLevel: parseInt(values.MinStockLevel || 0),
        MaxStockLevel: parseInt(values.MaxStockLevel || 0),
      };

      delete productData.dynamicAttributes;

      await productService.createProduct(productData);

      message.success("Tạo sản phẩm thành công!");
      navigate("/products/list");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi tạo sản phẩm.";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Validation Failed:", errorInfo);
    message.error("Vui lòng kiểm tra lại các trường dữ liệu bắt buộc.");
  };

  // --- Main Render ---
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

      <Card title="Tạo sản phẩm mới" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          onValuesChange={(changedValues) => {
            if (changedValues.ImageUrl !== undefined) {
              setImageUrlPreview(changedValues.ImageUrl);
            }
          }}
          initialValues={{
            IsSerial: true,
            Status: true,
            CostPrice: 0,
            SalePrice: 0,
            StockQuantity: 0,
            MinStockLevel: 0,
            MaxStockLevel: 0,
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
                rules={[
                  { required: true, message: "Vui lòng nhập Barcode!" },
                  { whitespace: true, message: "Barcode không được để trống!" },
                ]}
              >
                <Input placeholder="Nhập hoặc quét mã vạch" />
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

              {/* Form Item cho URL Hình ảnh */}
              <Form.Item label="URL Hình ảnh" name="ImageUrl">
                <Input placeholder="Dán link ảnh sản phẩm (Tùy chọn)" />
              </Form.Item>

              {/* Hiển thị ảnh xem trước */}
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
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    onLoad={(e) => {
                      e.currentTarget.style.display = "block";
                    }}
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
                    label="Giá nhập "
                    name="CostPrice"
                    rules={[
                      { required: true, message: "Nhập giá nhập!" },
                      // ⭐️ Validation: Giá nhập phải lớn hơn 0
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const numValue = parseFloat(value);
                          if (!value || numValue > 0) {
                            return Promise.resolve();
                          }
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
                    label="Giá bán "
                    name="SalePrice"
                    rules={[
                      { required: true, message: "Nhập giá bán!" },
                      // ⭐️ Validation: Giá bán phải lớn hơn 0
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const costPrice = parseFloat(
                            getFieldValue("CostPrice")
                          );
                          const salePrice = parseFloat(value);

                          if (!value || salePrice > 0) {
                            // ⭐️ Validation: Giá bán phải lớn hơn hoặc bằng Giá nhập
                            if (salePrice >= costPrice) {
                              return Promise.resolve();
                            }
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
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Form.Item
                    label="Số lượng Tồn kho ban đầu"
                    name="StockQuantity"
                    rules={[
                      {
                        required: true,
                        message: "Nhập số lượng tồn kho ban đầu!",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="Nhập số lượng tồn kho hiện tại"
                      // 💡 Ghi chú: Backend chấp nhận 0, nhưng bắt buộc nhập
                    />
                  </Form.Item>
                </Col>
                {/* Phần MinStockLevel và MaxStockLevel sẽ được đặt phía dưới */}
              </Row>
              {/* Tồn kho (Min/Max) */}
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

              {/* VỊ TRÍ LƯU TRỮ (Dòng riêng biệt) */}
              <Row>
                <Col span={24}>
                  <Form.Item
                    label="Vị trí lưu trữ"
                    name="LocationID"
                    // ⭐️ Validation: Bắt buộc chọn vị trí
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
                          {menu}
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
                        // Giả định loc.id và loc.Code/loc.Name
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
                              placeholder="Tên thuộc tính (Ví dụ: Màu sắc)"
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
                              placeholder="Giá trị (Ví dụ: Đỏ)"
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
              Tạo sản phẩm
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

export default CreateProduct;
