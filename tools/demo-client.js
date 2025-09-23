const io = require("socket.io-client");

const port = 8000;
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGQyZTI0ZWYwYWE3ZTljMzZmZTljZmQiLCJlbWFpbCI6ImFkbWluNkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1ODY1OTQzMywiZXhwIjoxNzU4NjYwMzMzfQ.y05fO3r7M0AoVOSgrCcxb-gUiaIiL-WHATQzfhuyCDE"; // login karke JWT copy karo

const socket = io(`http://localhost:${port}/realtime`, {
  auth: { token },
});

socket.on("connect", () => console.log("✅ Connected:", socket.id));

socket.on("new-feedback", (data) => {
  console.log("📢 New Feedback:", data);
});

socket.on("otp-verified", (data) => {
  console.log("🔑 OTP Verified:", data);
});

socket.on("message", (data) => {
  console.log("💬 Message received:", data);
});

socket.on("disconnect", () => {
  console.log("🔌 Disconnected");
});

// Test message after 2s
setTimeout(() => {
  socket.emit("message", { content: "Hello server" });
}, 2000);
