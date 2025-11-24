import React, { useState, useEffect } from "react";
import { Table, Button, Input, Space, Tag, Modal, message, Form } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

import * as customerApi from "../../services/customerService";

/* ================================
   MODAL TẠO/CẬP NHẬT CUSTOMER
================================= */
const CustomerFormModal = ({ customer, onClose, onSave }) => {
  const isEdit = customer && customer.CustomerID;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      FullName: customer?.FullName || "",
      Phone: customer?.Phone || "",
      Email: customer?.Email || "",
      Address: customer?.Address || "",
      Status: customer?.Status || "active",
    });
  }, [customer, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const dataToSend = isEdit
          ? {
              FullName: values.FullName,
              Phone: values.Phone,
              Email: values.Email,
              Address: values.Address,
            }
          : values;
        onSave(dataToSend);
      })
      .catch(() => {});
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={isEdit ? "Cập nhật khách hàng" : "Tạo khách hàng mới"}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Họ tên"
          name="FullName"
          rules={[{ required: true, message: "Họ tên không được để trống" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="Phone"
          rules={[{ required: true, message: "Số điện thoại bắt buộc" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="Email"
          rules={[{ type: "email", message: "Email không hợp lệ" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Địa chỉ" name="Address">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ================================
   MAIN COMPONENT
================================= */
function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);

  const itemsPerPage = 6;

  const loadCustomers = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await customerApi.fetchCustomers(
        page,
        itemsPerPage,
        search
      );
      setCustomers(response.items || []);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách khách hàng");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadCustomers(1, value);
  };

  const handleSaveCustomer = async (data) => {
    try {
      if (modalCustomer && modalCustomer.CustomerID) {
        await customerApi.updateCustomer(modalCustomer.CustomerID, data);
        message.success("Cập nhật khách hàng thành công!");
      } else {
        await customerApi.createCustomer(data);
        message.success("Tạo khách hàng thành công!");
      }

      setModalCustomer(null);
      loadCustomers(1, searchTerm);
    } catch (error) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu khách hàng");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "CustomerID",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      title: "Họ tên",
      dataIndex: "FullName",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Số điện thoại", dataIndex: "Phone" },
    { title: "Email", dataIndex: "Email" },
    { title: "Địa chỉ", dataIndex: "Address" },
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
            onClick={() => setModalCustomer(record)}
          />
        </Space>
      ),
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
        <Space>
          <Input.Search
            placeholder="Tìm kiếm theo tên hoặc số điện thoại"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalCustomer({})}
        >
          Thêm khách hàng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="CustomerID"
        loading={isLoading}
        pagination={{
          current: currentPage,
          total: totalItems,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      {modalCustomer && (
        <CustomerFormModal
          customer={modalCustomer.CustomerID ? modalCustomer : null}
          onClose={() => setModalCustomer(null)}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
}

export default CustomerList;
