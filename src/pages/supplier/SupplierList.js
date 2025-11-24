import React, { useState, useEffect } from "react";
import { Table, Button, Input, Space, Tag, Modal, message, Form } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

import * as supplierApi from "../../services/supplierService";

/* ================================
   MODAL TẠO/CẬP NHẬT SUPPLIER
================================= */
const SupplierFormModal = ({ supplier, onClose, onSave }) => {
  const isEdit = supplier && supplier.SupplierID;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      Name: supplier?.Name || "",
      Phone: supplier?.Phone || "",
      Email: supplier?.Email || "",
      Address: supplier?.Address || "",
      Status: supplier?.Status || "active",
    });
  }, [supplier, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const dataToSend = isEdit
          ? {
              Name: values.Name,
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
      title={isEdit ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp mới"}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên nhà cung cấp"
          name="Name"
          rules={[
            { required: true, message: "Tên nhà cung cấp không được để trống" },
          ]}
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
function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalSupplier, setModalSupplier] = useState(null);

  const itemsPerPage = 6;

  const loadSuppliers = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await supplierApi.fetchSuppliers(
        page,
        itemsPerPage,
        search
      );
      setSuppliers(response.items || []);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách nhà cung cấp");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    loadSuppliers(1, value);
  };

  const handleSaveSupplier = async (data) => {
    try {
      if (modalSupplier && modalSupplier.SupplierID) {
        await supplierApi.updateSupplier(modalSupplier.SupplierID, data);
        message.success("Cập nhật nhà cung cấp thành công!");
      } else {
        await supplierApi.createSupplier(data);
        message.success("Tạo nhà cung cấp thành công!");
      }

      setModalSupplier(null);
      loadSuppliers(1, searchTerm);
    } catch (error) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu nhà cung cấp");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "SupplierID",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      title: "Tên nhà cung cấp",
      dataIndex: "Name",
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
            onClick={() => setModalSupplier(record)}
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
        <Input.Search
          placeholder="Tìm kiếm theo tên hoặc số điện thoại"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalSupplier({})}
        >
          Thêm nhà cung cấp
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="SupplierID"
        loading={isLoading}
        pagination={{
          current: currentPage,
          total: totalItems,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      {modalSupplier && (
        <SupplierFormModal
          supplier={modalSupplier.SupplierID ? modalSupplier : null}
          onClose={() => setModalSupplier(null)}
          onSave={handleSaveSupplier}
        />
      )}
    </div>
  );
}

export default SupplierList;
