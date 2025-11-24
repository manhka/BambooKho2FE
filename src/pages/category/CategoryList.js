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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import * as categoryApi from "../../services/categoryService";

const { Option } = Select;
const { confirm } = Modal;

/* ================================
   MODAL TẠO/CẬP NHẬT CATEGORY
================================= */
const CategoryFormModal = ({ category, onClose, onSave }) => {
  const isEdit = category && category.CategoryID;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      Name: category?.Name || "",
      Description: category?.Description || "",
      Status: category?.Status || "active", // Chỉ dùng khi tạo mới
    });
  }, [category, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const dataToSend = isEdit
          ? { Name: values.Name, Description: values.Description }
          : values; // tạo mới: gửi cả Status
        onSave(dataToSend);
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={isEdit ? "Cập nhật danh mục" : "Tạo danh mục mới"}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên danh mục"
          name="Name"
          rules={[
            { required: true, message: "Tên danh mục không được để trống" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Mô tả" name="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isLoading, setIsLoading] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);

  const itemsPerPage = 6;

  const loadCategories = async (page, search, status) => {
    setIsLoading(true);
    try {
      const response = await categoryApi.fetchCategories(
        page,
        itemsPerPage,
        search,
        status
      );
      setCategories(response.items || []);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách Category");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadCategories(1, value, statusFilter);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    loadCategories(1, searchTerm, value);
  };

  /* ========== ARCHIVE / RESTORE ========== */
  const confirmAction = (category, action) => {
    const actionText = action === "archive" ? "Lưu trữ" : "Khôi phục";

    confirm({
      title: `${actionText} Category`,
      content: `Bạn có chắc muốn ${actionText.toLowerCase()} Category "${
        category.Name
      }"?`,
      okText: actionText,
      okType: action === "archive" ? "danger" : "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          if (action === "archive")
            await categoryApi.archiveCategory(category.CategoryID);
          else await categoryApi.restoreCategory(category.CategoryID);

          message.success(`${actionText} thành công!`);
          loadCategories(currentPage, searchTerm, statusFilter);
        } catch (err) {
          message.error("Đã xảy ra lỗi");
        }
      },
    });
  };

  /* ========== SAVE CATEGORY ========== */
  const handleSaveCategory = async (data) => {
    try {
      if (modalCategory && modalCategory.CategoryID) {
        await categoryApi.updateCategory(modalCategory.CategoryID, data);
        message.success("Cập nhật Category thành công!");
      } else {
        await categoryApi.createCategory(data);
        message.success("Tạo Category thành công!");
      }

      setModalCategory(null);
      loadCategories(1, searchTerm, statusFilter);
    } catch (error) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu Category");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "CategoryID",
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
            onClick={() => setModalCategory(record)}
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
            placeholder="Tìm kiếm danh mục theo tên"
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
          onClick={() => setModalCategory({})}
        >
          Thêm danh mục
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="CategoryID"
        loading={isLoading}
        pagination={{
          current: currentPage,
          total: totalItems,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      {/* MODAL CREATE/UPDATE */}
      {modalCategory && (
        <CategoryFormModal
          category={modalCategory.CategoryID ? modalCategory : null}
          onClose={() => setModalCategory(null)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}

export default CategoryList;
