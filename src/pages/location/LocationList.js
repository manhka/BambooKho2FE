import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Tag, Modal, message, Input } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  fetchLocations,
  removeLocation,
  restoreLocation,
} from "../../services/locationService";
import LocationFormModal from "./LocationFormModal";

const { confirm } = Modal;
const { Search } = Input;

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  const fetchLocationsList = useCallback(async () => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      const data = await fetchLocations(current, pageSize, searchText, "all");

      setLocations(data.items || []);
      setPagination((prev) => ({
        ...prev,
        total: data.totalItems || 0,
      }));
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách vị trí.");
    } finally {
      setLoading(false);
    }
  }, [searchText, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchLocationsList();
  }, [fetchLocationsList]);

  const handleAdd = () => {
    setEditingLocation(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingLocation(record);
    setIsModalVisible(true);
  };

  const handleArchive = (id, code) => {
    confirm({
      title: `Bạn có chắc muốn chuyển vị trí "${code}" sang trạng thái Lưu trữ?`,
      okText: "Lưu trữ",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await removeLocation(id);
          message.success(`Vị trí "${code}" đã được lưu trữ.`);
          fetchLocationsList();
        } catch (err) {
          message.error(err.message || "Lỗi khi lưu trữ vị trí.");
        }
      },
    });
  };

  const handleRestore = (id, code) => {
    confirm({
      title: `Bạn có chắc muốn khôi phục vị trí "${code}" sang trạng thái Hoạt động?`,
      okText: "Khôi phục",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await restoreLocation(id);
          message.success(
            `Vị trí "${code}" đã được khôi phục sang trạng thái Hoạt động.`
          );
          fetchLocationsList();
        } catch (err) {
          message.error(err.message || "Lỗi khi khôi phục vị trí.");
        }
      },
    });
  };

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    fetchLocationsList();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const columns = [
    {
      title: "Mã Vị trí",
      dataIndex: "Code",
      key: "Code",
      width: 150,
      sorter: (a, b) => a.Code.localeCompare(b.Code),
    },
    {
      title: "Tên/Mô tả",
      dataIndex: "Name",
      key: "Name",
    },
    {
      title: "Trạng thái",
      dataIndex: "Status",
      key: "Status",
      width: 120,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "volcano"}>
          {status === "active" ? "HOẠT ĐỘNG" : "LƯU TRỮ"}
        </Tag>
      ),
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Lưu trữ", value: "archive" },
      ],
      onFilter: (value, record) => record.Status === value,
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.Status !== "active"}
          />
          {record.Status === "active" ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleArchive(record.id, record.Code)}
            />
          ) : (
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record.id, record.Code)}
            />
          )}
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
          <Search
            placeholder="Tìm theo Mã hoặc Tên vị trí"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchLocationsList}>
            Làm mới
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Vị trí
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={locations}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total) => `Tổng ${total} vị trí`,
        }}
        onChange={handleTableChange}
      />

      {isModalVisible && (
        <LocationFormModal
          visible={isModalVisible}
          initialData={editingLocation}
          onClose={() => setIsModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default LocationList;
