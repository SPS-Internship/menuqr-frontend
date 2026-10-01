import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  loginAdmin,
  getMe,
  getRestaurantForAdminLogin,
} from "../../services/adminService";

import { useAdminProfile } from "../../context/AdminProfileContext";

function LoginPage() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const { updateProfile } = useAdminProfile();

  const [restaurant, setRestaurant] = useState(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!slug) {
        setError("Slug restoran tidak ditemukan.");
        setRestaurantLoading(false);
        return;
      }

      try {
        setRestaurantLoading(true);
        setError("");

        const result =
          await getRestaurantForAdminLogin(slug);

        console.log(
          "Response restoran:",
          result
        );

        const restaurantData =
          result?.data;

        if (!restaurantData) {
          throw new Error(
            "Data restoran tidak ditemukan."
          );
        }

        setRestaurant(
          restaurantData
        );
      } catch (err) {
        console.error(
          "Gagal mengambil data restoran:",
          err
        );

        const backendMessage =
          err?.response?.data?.message;

        setError(
          backendMessage ||
            "Restoran tidak ditemukan atau tidak aktif."
        );
      } finally {
        setRestaurantLoading(false);
      }
    };

    loadRestaurant();
  }, [slug]);

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    if (
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        "Email dan password wajib diisi."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      // ==========================================
      // LOGIN
      // ==========================================

      const result =
        await loginAdmin({
          email: email.trim(),
          password,
        });

      console.log(
        "Response login:",
        result
      );

      if (!result?.token) {
        throw new Error(
          "Token login tidak ditemukan."
        );
      }

      // ==========================================
      // BERSIHKAN DATA LOGIN LAMA
      // ==========================================

      localStorage.removeItem(
        "adminUser"
      );

      localStorage.removeItem(
        "adminProfile"
      );

      localStorage.removeItem(
        "adminRestaurant"
      );

      // ==========================================
      // SIMPAN TOKEN BARU
      // ==========================================

      localStorage.setItem(
        "adminToken",
        result.token
      );

      // ==========================================
      // AMBIL DATA ADMIN
      // ==========================================

      const meResult =
        await getMe();

      console.log(
        "Response /me:",
        meResult
      );

      const adminUser =
        meResult?.data;

      if (!adminUser) {
        throw new Error(
          "Data admin tidak ditemukan."
        );
      }

      console.log(
        "Admin yang login:",
        adminUser
      );

      // ==========================================
      // CEK ADMIN TERHUBUNG KE RESTORAN
      // ==========================================

      if (!adminUser.restaurant_id) {
        setError(
          "Akun admin belum terhubung ke restoran. Silakan hubungkan akun admin dengan restoran terlebih dahulu."
        );

        localStorage.removeItem(
          "adminToken"
        );

        localStorage.removeItem(
          "adminUser"
        );

        localStorage.removeItem(
          "adminProfile"
        );

        localStorage.removeItem(
          "adminRestaurant"
        );

        return;
      }

      // ==========================================
      // CEK RESTORAN SESUAI URL
      // ==========================================

      if (
        restaurant?.id &&
        Number(
          adminUser.restaurant_id
        ) !==
          Number(
            restaurant.id
          )
      ) {
        setError(
          `Akun admin ini tidak terhubung dengan restoran ${restaurant.name}.`
        );

        localStorage.removeItem(
          "adminToken"
        );

        localStorage.removeItem(
          "adminUser"
        );

        localStorage.removeItem(
          "adminProfile"
        );

        localStorage.removeItem(
          "adminRestaurant"
        );

        return;
      }

      // ==========================================
      // SIMPAN DATA ADMIN
      // ==========================================

      localStorage.setItem(
        "adminUser",
        JSON.stringify(
          adminUser
        )
      );

      // ==========================================
      // SIMPAN RESTORAN AKTIF
      // ==========================================

      if (restaurant) {
        localStorage.setItem(
          "adminRestaurant",
          JSON.stringify(
            restaurant
          )
        );
      }

      // ==========================================
      // AMBIL FOTO PROFIL YANG PERNAH DISIMPAN
      // ==========================================

      const adminEmail =
        (
          adminUser?.email ||
          email
        )
          .trim()
          .toLowerCase();

      const photoStorageKey =
        `adminProfilePhoto_${adminEmail}`;

      const savedProfilePhoto =
        localStorage.getItem(
          photoStorageKey
        );

      console.log(
        "Key foto profil:",
        photoStorageKey
      );

      console.log(
        "Foto profil tersimpan:",
        savedProfilePhoto
          ? "Ada"
          : "Tidak ada"
      );

      // ==========================================
      // UPDATE ADMIN PROFILE CONTEXT
      // ==========================================

      const updatedProfile = {
        name:
          adminUser?.name ||
          "Admin",

        email:
          adminUser?.email ||
          "",

        role:
          adminUser?.role ||
          "Administrator",

        photo:
          savedProfilePhoto ||
          adminUser?.photo ||
          null,

        restaurant:
          restaurant ||
          adminUser?.restaurant ||
          null,
      };

      updateProfile(
        updatedProfile
      );

      console.log(
        "Restaurant ID:",
        adminUser.restaurant_id
      );

      console.log(
        "Restaurant aktif:",
        restaurant
      );

      console.log(
        "Foto profil aktif:",
        savedProfilePhoto
          ? "Foto dari localStorage"
          : "Belum ada foto"
      );

      console.log(
        "Profile Context diperbarui:",
        updatedProfile
      );

      // ==========================================
      // MASUK DASHBOARD
      // ==========================================

      navigate(
        "/admin/dashboard"
      );
    } catch (err) {
      console.error(
        "Gagal login:",
        err
      );

      const backendMessage =
        err?.response?.data?.message;

      if (backendMessage) {
        setError(
          backendMessage
        );

        return;
      }

      setError(
        err?.message ||
          "Email atau password salah."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOADING RESTAURANT
  // =========================================================

  if (restaurantLoading) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-card">
            <div className="admin-login-header">
              <div className="admin-login-logo">
                R
              </div>

              <h1>
                Memuat...
              </h1>

              <p>
                Sedang mengambil informasi restoran.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // TAMPILAN LOGIN
  // =========================================================

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div
              className="admin-login-logo"
              style={{
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {restaurant?.logo ? (
                <img
                  src={
                    restaurant.logo
                  }
                  alt={
                    restaurant?.name ||
                    "Restaurant"
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span>
                  {restaurant?.name
                    ? restaurant.name
                        .split(" ")
                        .map(
                          (word) =>
                            word[0]
                        )
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "R"}
                </span>
              )}
            </div>

            <p className="admin-login-label">
              {restaurant?.name ||
                "RESTAURANT"}
            </p>

            <h1>
              Admin Login
            </h1>

            <p>
              Masuk untuk mengelola restoran.
            </p>
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <form
            className="admin-login-form"
            onSubmit={
              handleLogin
            }
          >
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target
                      .value
                  );

                  setError("");
                }}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(
                  event
                ) => {
                  setPassword(
                    event.target
                      .value
                  );

                  setError("");
                }}
              />
            </div>

            <button
              type="submit"
              className="admin-login-button"
              disabled={
                loading ||
                !restaurant
              }
            >
              {loading
                ? "Memproses..."
                : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
