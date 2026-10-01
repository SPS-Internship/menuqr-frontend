import { NavLink, useNavigate } from "react-router-dom";
import { useAdminProfile } from "../../context/AdminProfileContext";
import api from "../../services/api";

function AdminSidebar() {
  const { profile } = useAdminProfile();
  const navigate = useNavigate();

  // Data restoran dari AdminProfileContext
  const restaurant = profile?.restaurant;

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "⌂" },
    { label: "Menu", path: "/admin/menu", icon: "▦" },
    { label: "Kategori", path: "/admin/category", icon: "☷" },
    { label: "Variant", path: "/admin/variant", icon: "◈" },
    { label: "Add-on", path: "/admin/addon", icon: "+" },
    { label: "Pesanan", path: "/admin/orders", icon: "▤" },
    { label: "Meja & QR", path: "/admin/tables", icon: "▣" },
    { label: "Promo", path: "/admin/promo", icon: "%" },
    { label: "Report", path: "/admin/report", icon: "↗" },
  ];

  const handleLogout = async () => {
    // ==========================================
    // AMBIL RESTORAN AKTIF SEBELUM LOGOUT
    // ==========================================

    let restaurantSlug = null;

    const savedRestaurant =
      localStorage.getItem("adminRestaurant");

    if (savedRestaurant) {
      try {
        const parsedRestaurant =
          JSON.parse(savedRestaurant);

        restaurantSlug =
          parsedRestaurant?.slug || null;
      } catch (error) {
        console.error(
          "Gagal membaca adminRestaurant:",
          error
        );
      }
    }

    // Kalau adminRestaurant tidak tersedia,
    // coba ambil dari profile sebagai cadangan
    if (!restaurantSlug) {
      restaurantSlug = restaurant?.slug || null;
    }

    try {
      await api.post("/logout");
    } catch (error) {
      console.error(
        "Logout backend gagal:",
        error
      );
    } finally {
      // ==========================================
      // HAPUS DATA LOGIN ADMIN
      // ==========================================

      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminProfile");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminRestaurant");

      // ==========================================
      // KEMBALI KE LOGIN RESTORAN YANG AKTIF
      // ==========================================

      if (restaurantSlug) {
        navigate(
          `/admin/login/${restaurantSlug}`,
          {
            replace: true,
          }
        );
      } else {
        // Fallback jika slug restoran tidak tersedia
        navigate(
          "/admin/login/hoshi-ramen",
          {
            replace: true,
          }
        );
      }
    }
  };

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: "240px",
        height: "100vh",
        backgroundColor: "#211b1d",
        color: "#ffffff",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999,
        padding: "24px 16px",
        boxSizing: "border-box",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* LOGO RESTAURANT */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "38px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: "#9f2740",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {restaurant?.logo ? (
            <img
              src={restaurant.logo}
              alt={restaurant?.name || "Restaurant"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              {restaurant?.name
                ? restaurant.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "R"}
            </span>
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              marginBottom: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "145px",
            }}
          >
            {restaurant?.name || "Restaurant"}
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#a7a1a3",
              letterSpacing: "1px",
            }}
          >
            ADMIN PANEL
          </div>
        </div>
      </div>

      {/* MAIN MENU */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: "#858082",
          letterSpacing: "1.5px",
          marginBottom: "12px",
        }}
      >
        MAIN MENU
      </div>

      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "16px 18px",
              marginBottom: "4px",
              borderRadius: "9px",
              textDecoration: "none",
              color: isActive ? "#ffffff" : "#c5c0c2",
              backgroundColor: isActive
                ? "#9f2740"
                : "transparent",
              fontSize: "14px",
              fontWeight: isActive ? "600" : "400",
              transition: "0.2s",
            })}
          >
            <span
              style={{
                width: "18px",
                textAlign: "center",
                fontSize: "17px",
              }}
            >
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* SYSTEM */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: "700",
          color: "#858082",
          letterSpacing: "1.5px",
          marginTop: "28px",
          marginBottom: "10px",
        }}
      >
        SYSTEM
      </div>

      {/* SETTINGS */}
      <NavLink
        to="/admin/settings"
        style={({ isActive }) => ({
          display: "flex",
          alignItems: "center",
          gap: "18px",
          padding: "14px 18px",
          borderRadius: "9px",
          textDecoration: "none",
          color: isActive ? "#ffffff" : "#c5c0c2",
          backgroundColor: isActive
            ? "#9f2740"
            : "transparent",
          fontSize: "14px",
          marginBottom: "16px",
        })}
      >
        <span
          style={{
            width: "18px",
            textAlign: "center",
            fontSize: "17px",
          }}
        >
          ⚙
        </span>

        <span>Settings</span>
      </NavLink>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* PROFILE + LOGOUT */}
      <div
        style={{
          paddingTop: "16px",
          borderTop:
            "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* PROFILE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <img
            src={
              profile?.photo ||
              "https://ui-avatars.com/api/?name=Admin&background=9f2740&color=fff"
            }
            alt="Admin"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#ffffff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profile?.name || "Admin"}
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#9f999b",
                marginTop: "2px",
              }}
            >
              {profile?.role || "Administrator"}
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            border: "none",
            backgroundColor: "transparent",
            color: "#c5c0c2",
            padding: "12px 18px",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "14px",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              "#9f2740";
            e.currentTarget.style.color =
              "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "transparent";
            e.currentTarget.style.color =
              "#c5c0c2";
          }}
        >
          <span
            style={{
              width: "18px",
              textAlign: "center",
              fontSize: "17px",
            }}
          >
            ↪
          </span>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;

