import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Input as AntInput,
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import * as brandApi from "../../services/brandService";

const { Option } = Select;
const { confirm } = Modal;

/* ================================
   BRAND FORM MODAL (CREATE & UPDATE)
================================== */
const BrandFormModal = ({ brand, onClose, onSave }) => {
  const isEdit = brand && brand.BrandID;

  const [form] = Form.useForm();

  // Set default values
  useEffect(() => {
    form.setFieldsValue({
      Name: brand?.Name || "",
      Description: brand?.Description || "",
      Status: brand?.Status || "active",
    });
  }, [brand, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const dataToSend = isEdit
          ? { Name: values.Name, Description: values.Description }
          : values;

        onSave(dataToSend);
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={isEdit ? "Cập nhật thương hiệu" : "Tạo thương hiệu mới"}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên thương hiệu"
          name="Name"
          rules={[
            { required: true, message: "Tên thương hiệu không được để trống" },
          ]}
        >
          <AntInput />
        </Form.Item>

        <Form.Item label="Mô tả" name="Description">
          <AntInput.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ================================
   MAIN BRAND LIST COMPONENT
================================== */
function BrandList() {
  const [brands, setBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isLoading, setIsLoading] = useState(false);
  const [modalBrand, setModalBrand] = useState(null);

  const itemsPerPage = 6;

  // Load brands
  const loadBrands = async (page, search, status) => {
    setIsLoading(true);
    try {
      const response = await brandApi.fetchBrands(
        page,
        itemsPerPage,
        search,
        status
      );

      setBrands(response.items || []);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách Brand");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands(currentPage, searchTerm, statusFilter);
  }, [currentPage, statusFilter, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadBrands(1, value, statusFilter);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    loadBrands(1, searchTerm, value);
  };

  /* ========== ARCHIVE / RESTORE ========== */
  const confirmAction = (brand, action) => {
    const actionText = action === "archive" ? "Lưu trữ" : "Khôi phục";

    confirm({
      title: `${actionText} Brand`,
      content: `Bạn có chắc muốn ${actionText.toLowerCase()} thương hiệu "${
        brand.Name
      }"?`,
      okText: actionText,
      okType: action === "archive" ? "danger" : "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          if (action === "archive") {
            await brandApi.archiveBrand(brand.BrandID);
          } else {
            await brandApi.restoreBrand(brand.BrandID);
          }
          message.success(`${actionText} thành công!`);
          loadBrands(currentPage, searchTerm, statusFilter);
        } catch (err) {
          message.error("Đã xảy ra lỗi");
        }
      },
    });
  };

  /* ========== SAVE BRAND ========== */
  const handleSaveBrand = async (data) => {
    try {
      if (modalBrand && modalBrand.BrandID) {
        await brandApi.updateBrand(modalBrand.BrandID, data);
        message.success("Cập nhật thương hiệu thành công!");
      } else {
        await brandApi.createBrand(data);
        message.success("Tạo thương hiệu thành công!");
      }

      setModalBrand(null);
      loadBrands(1, searchTerm, statusFilter);
    } catch (error) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu Brand");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "BrandID",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      title: "Tên",
      dataIndex: "Name",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Mô tả", dataIndex: "Description" },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      render: (status) =>
        status === "active" ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="volcano">Đã lưu trữ</Tag>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => setModalBrand(record)}
          />

          {record.Status === "active" ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmAction(record, "archive")}
            />
          ) : (
            <Button
              type="text"
              style={{ color: "green" }}
              icon={<UndoOutlined />}
              onClick={() => confirmAction(record, "restore")}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* FILTER & TOP BAR */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Input.Search
            placeholder="Tìm kiếm thương hiệu theo tên"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />

          <Select
            value={statusFilter}
            style={{ width: 180 }}
            onChange={handleStatusFilterChange}
          >
            <Option value="active">Trạng thái: Hoạt động</Option>
            <Option value="archived">Trạng thái: Đã lưu trữ</Option>
          </Select>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalBrand({})}
        >
          Thêm thương hiệu
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={brands}
        rowKey="BrandID"
        loading={isLoading}
        pagination={{
          current: currentPage,
          total: totalItems,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      {modalBrand && (
        <BrandFormModal
          brand={modalBrand.BrandID ? modalBrand : null}
          onClose={() => setModalBrand(null)}
          onSave={handleSaveBrand}
        />
      )}
    </div>
  );
}

export default BrandList;
