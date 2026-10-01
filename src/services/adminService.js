import api from "./api";

export const loginAdmin = async (loginData) => {
  const response = await api.post("/login", loginData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/me");
  return response.data;
};

export const logoutAdmin = async () => {
  const response = await api.post("/logout");
  return response.data;
};

// =========================
// ADMIN SETTINGS
// =========================

export const getAdminSettingsProfile = async () => {
  const response = await api.get("/admin/settings/profile");
  return response.data;
};

export const updateAdminProfile = async (profileData) => {
  const response = await api.put("/admin/settings/profile", profileData);
  return response.data;
};

export const updateAdminPassword = async (passwordData) => {
  const response = await api.put("/admin/settings/password", passwordData);
  return response.data;
};

// =========================
// RESTAURANT UNTUK ADMIN LOGIN
// =========================

export const getRestaurantForAdminLogin = async (slug) => {
  const response = await api.get(`/restaurants/${slug}/admin-login`);
  return response.data;
};