import React, { useState, useEffect } from "react";
import { Table, Button, Input, Space, Tag, Modal, message, Form } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import * as userApi from "../../services/authService";

const UserFormModal = ({ user, onClose, onSave }) => {
  const isEdit = user && user.id;
  const [form] = Form.useForm();
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    form.setFieldsValue({
      Username: user?.Username || "",
    });
    setBackendError(null); // reset lỗi khi mở modal
  }, [user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setBackendError(null);
      await onSave(values, setBackendError); // truyền setBackendError để show lỗi
    } catch (err) {
      // validation client
    }
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={isEdit ? "Cập nhật người dùng" : "Tạo người dùng mới"}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên đăng nhập"
          name="Username"
          rules={[
            { required: true, message: "Tên đăng nhập không được để trống" },
            { min: 3, message: "Tên đăng nhập phải ít nhất 3 ký tự" },
          ]}
          validateStatus={backendError ? "error" : ""}
          help={backendError || ""}
        >
          <Input disabled={isEdit} />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Mật khẩu không được để trống" },
            ]}
          >
            <Input.Password />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

function UserList() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  const itemsPerPage = 6;
  const token = localStorage.getItem("token");

  const loadUsers = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await userApi.getUsers({
        page,
        limit: itemsPerPage,
        search,
      });
      setUsers(response.items || []);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách người dùng");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadUsers(1, value);
  };

  const handleSaveUser = async (data, setBackendError) => {
    try {
      if (modalUser && modalUser.id) {
        // Nếu có API update, thêm ở đây
        message.success("Cập nhật người dùng thành công!");
      } else {
        // Tạo mới luôn là role: staff
        await userApi.register(
          data.Username,
          data.password,
          "",
          "staff",
          token
        );
        message.success("Tạo người dùng thành công!");
      }
      setModalUser(null);
      loadUsers(1, searchTerm);
    } catch (error) {
      console.error(error);
      const errMsg = error.message || "Đã xảy ra lỗi khi lưu người dùng";
      setBackendError(errMsg);
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "id",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "Username",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Vai trò",
      dataIndex: "Role",
      render: (role) => (
        <Tag color={role === "admin" ? "blue" : "green"}>{role}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Input.Search
          placeholder="Tìm kiếm theo tên đăng nhập"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalUser({})}
        >
          Thêm người dùng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: currentPage,
          total: totalItems,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      {modalUser && (
        <UserFormModal
          user={modalUser.id ? modalUser : null}
          onClose={() => setModalUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

export default UserList;
