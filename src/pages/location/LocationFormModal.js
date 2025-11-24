import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Switch, message } from "antd";
import { createLocation, updateLocation } from "../../services/locationService";

const { TextArea } = Input;

const LocationFormModal = ({ visible, initialData, onClose, onSuccess }) => {
  // ⭐ Không dùng useForm()
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!initialData;

  // ⭐ Cập nhật formData khi initialData thay đổi (dùng cho Edit)
  useEffect(() => {
    if (visible) {
      // Reset state
      setFormData({});

      if (isEditing) {
        setFormData({
          ...initialData,
          IsActive: initialData.IsActive,
        });
      } else {
        // Giá trị mặc định cho tạo mới
        setFormData({ IsActive: true });
      }
    }
  }, [visible, isEditing, initialData]);

  // ⭐ Hàm xử lý thay đổi Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ⭐ Hàm xử lý thay đổi Switch
  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, IsActive: checked }));
  };

  const handleOk = () => {
    onFinish(formData); // Gọi hàm xử lý submit với formData hiện tại
  };

  // ⭐ Chức năng Validation cơ bản
  const validateForm = (data) => {
    if (!data.Code || data.Code.trim() === "") {
      message.error("Mã Vị trí là bắt buộc.");
      return false;
    }
    return true;
  };

  const onFinish = async (values) => {
    if (!validateForm(values)) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateLocation(initialData.id, values);
        message.success(`Cập nhật vị trí ${initialData.Code} thành công!`);
      } else {
        await createLocation(values);
        message.success("Tạo vị trí mới thành công!");
      }
      onSuccess();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Lỗi xử lý dữ liệu.";
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        isEditing ? `Chỉnh sửa Vị trí: ${initialData?.Code}` : "Tạo Vị trí mới"
      }
      open={visible} // ✔ AntD v5 dùng open
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={submitting}
      destroyOnHidden={true} // ✔ đúng chuẩn mới
    >
      {/* ⚠️ KHÔNG DÙNG onFinish trong Form nữa, chỉ dùng handleOk gọi onFinish bên ngoài */}
      <Form layout="vertical">
        <Form.Item
          label="Mã Vị trí (Code)"
          required // Dùng required của Form.Item để hiển thị dấu *
        >
          {/* ⭐ Sử dụng value và onChange thủ công */}
          <Input
            name="Code"
            placeholder="Ví dụ: A01-01"
            value={formData.Code || ""}
            onChange={handleChange}
            // Giữ disabled khi chỉnh sửa để tránh lỗi trùng lặp phức tạp
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item label="Tên Vị trí">
          <Input
            name="Name"
            placeholder="Ví dụ: Kệ trưng bày Tầng 1"
            value={formData.Name || ""}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.Item label="Mô tả">
          <TextArea
            name="Description"
            rows={2}
            value={formData.Description || ""}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái Hoạt động"
          tooltip="Chỉ các vị trí Hoạt động mới có thể được gán cho sản phẩm."
        >
          <Switch
            checked={formData.IsActive}
            onChange={handleSwitchChange} // Dùng onChange trực tiếp
            checkedChildren="Hoạt động"
            unCheckedChildren="Không hoạt động"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LocationFormModal;
