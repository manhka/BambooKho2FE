import React, { useState } from "react";
import { login } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { jwtDecode } from "jwt-decode";
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Validate username
  const validateUsername = (value) => {
    if (!value) return "Tên đăng nhập không được để trống";
    if (value.length < 3) return "Tên đăng nhập phải ít nhất 3 ký tự";
    if (value.length > 20) return "Tên đăng nhập tối đa 20 ký tự";
    return "";
  };

  // Validate password mạnh
  const validatePassword = (value) => {
    if (!value) return "Mật khẩu không được để trống";
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
    if (!passwordRegex.test(value)) {
      return "Mật khẩu phải ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    }
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);
    setUsernameError(usernameErr);
    setPasswordError(passwordErr);

    if (usernameErr || passwordErr) return;

    try {
      const res = await login(username, password);

      localStorage.setItem("token", res.token);
      // decode token
      const userDataDecode = jwtDecode(res.token);
      localStorage.setItem("user", JSON.stringify(userDataDecode));
      const userData = localStorage.getItem("user");
      let user;
      try {
        user = JSON.parse(userData);
      } catch (err) {
        console.error(
          "Dữ liệu người dùng trong localStorage không hợp lệ:",
          err
        );
        return;
      }

      const role = user?.role;

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/staff/dashboard");
      }
    } catch (err) {
      setError(
        err?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    }
  };

  return (
    <div
      style={{
        fontFamily: "Times New Roman",
        backgroundImage: "url('assets/bamboo-forest.jpg')",
        backgroundSize: "cover",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          width: "1000px",
          maxWidth: "95%",
        }}
      >
        <div style={{ flex: 1, padding: "40px" }}>
          <h2
            style={{
              marginBottom: "20px",
              fontSize: "40px",
              textAlign: "center",
              color: "green",
            }}
          >
            BambooKho
          </h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(validateUsername(e.target.value));
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: usernameError ? "1px solid red" : "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
              {usernameError && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {usernameError}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px", position: "relative" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Mật khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 10px",
                  paddingRight: "40px",
                  borderRadius: "6px",
                  border: passwordError ? "1px solid red" : "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "33px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {passwordError && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {passwordError}
                </p>
              )}
            </div>

            {error && (
              <p
                style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Đăng nhập
            </button>
          </form>
        </div>

        <div style={{ flex: 1 }}>
          <img
            src="/assets/panda.webp"
            alt="Panda"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
