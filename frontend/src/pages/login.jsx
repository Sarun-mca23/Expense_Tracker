import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./styles/login.module.css";
import { useAuth } from "../Context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  // 🚫 If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("https://expense-tracker-backend-0h9t.onrender.com/api/auth/login", {
        email,
        password,
      });

      const token = response.data.token;
      if (token) {
        localStorage.setItem("UserToken", token);

        const profileResponse = await axios.get("https://expense-tracker-backend-0h9t.onrender.com/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = profileResponse.data;

        // ✅ Use AuthContext login function
        login(userData);

        toast.success("Login successful!");
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Login failed. Try again.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Log In</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              pattern="^[^@]+@[^@]+\.[^@]+$"
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p className={styles.linkText}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className={styles.link}>Sign up here</Link>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default LoginPage;
