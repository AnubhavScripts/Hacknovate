import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useOnboardingStore } from "../store/onboardingStore";
import { signupApi } from "../services/api";
import SignUpImage from "../assets/signup.png";

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { setUserInfo } = useOnboardingStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlesignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await signupApi({ name, email, password });
      setUser(data.user);
      setUserInfo({ name, email });
      navigate(data.redirectTo || "/onboarding");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <form className="login-box" onSubmit={handlesignup}>
          <h2>Create Account</h2>
          <p className="subtitle">Please signup to get started</p>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: 8, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Enter your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Enter your Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
          <p className="link-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </form>
      </div>
      <div
        className="login-image"
        style={{ backgroundImage: `url(${SignUpImage})` }}
      >
        <div className="overlay"></div>
      </div>
    </div>
  );
}

export default Signup;
