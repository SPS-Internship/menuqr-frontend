import { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import api from "../../services/api";
import { useAdminProfile } from "../../context/AdminProfileContext";

function DashboardPage() {
  const { profile } = useAdminProfile();

  // =========================
  // RESTORAN AKTIF
  // =========================

  const restaurantName =
    profile?.restaurant?.name || "Restaurant";

  const [dashboard, setDashboard] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    total_sales: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================
   * AMBIL DATA DASHBOARD
   * =========================
   */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard");

        setDashboard({
          total_orders: Number(response.data?.total_orders) || 0,
          pending_orders:
            Number(response.data?.pending_orders) || 0,
          completed_orders:
            Number(response.data?.completed_orders) || 0,
          cancelled_orders:
            Number(response.data?.cancelled_orders) || 0,
          total_sales:
            Number(response.data?.total_sales) || 0,
        });
      } catch (error) {
        console.error(
          "Gagal mengambil data dashboard:",
          error
        );

        setError(
          "Data dashboard gagal dimuat. Pastikan backend dan database aktif."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /*
   * =========================
   * FORMAT RUPIAH
   * =========================
   */
  const formatRupiah = (value) => {
    return `Rp ${Number(value || 0).toLocaleString(
      "id-ID"
    )}`;
  };

  /*
   * =========================
   * TOTAL STATUS PESANAN
   * =========================
   */
  const totalStatusOrders =
    dashboard.pending_orders +
    dashboard.completed_orders +
    dashboard.cancelled_orders;

  /*
   * =========================
   * PERSENTASE STATUS
   * =========================
   */
  const getPercentage = (value) => {
    if (totalStatusOrders === 0) {
      return 0;
    }

    return Math.round(
      (value / totalStatusOrders) * 100
    );
  };

  /*
   * =========================
   * LOADING
   * =========================
   */
  if (loading) {
    return (
      <div
        className="admin-layout"
        style={{
          minHeight: "100vh",
          display: "flex",
          backgroundColor: "#f7f5f6",
        }}
      >
        <AdminSidebar />

        <main
          style={{
            marginLeft: "240px",
            width: "calc(100% - 240px)",
            minHeight: "100vh",
            padding: "32px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              color: "#777",
            }}
          >
            Memuat data dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="admin-layout"
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#f7f5f6",
      }}
    >
      {/* =========================
          SIDEBAR
      ========================== */}

      <AdminSidebar />

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main
        style={{
          marginLeft: "240px",
          width: "calc(100% - 240px)",
          minHeight: "100vh",
          padding: "32px",
          boxSizing: "border-box",
        }}
      >
        {/* =========================
            HEADER
        ========================== */}

        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: "#211b1d",
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#777",
              fontSize: "14px",
            }}
          >
            Ringkasan data pesanan dan penjualan{" "}
            {restaurantName}.
          </p>
        </div>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <div
            style={{
              marginBottom: "24px",
              padding: "14px 16px",
              backgroundColor: "#fff0f0",
              border: "1px solid #f0cccc",
              borderRadius: "10px",
              color: "#a33a3a",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* =========================
            STATISTICS
        ========================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* TOTAL PESANAN */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "22px",
              border: "1px solid #eee",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "13px",
              }}
            >
              Total Pesanan
            </p>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "28px",
                color: "#211b1d",
              }}
            >
              {dashboard.total_orders.toLocaleString(
                "id-ID"
              )}
            </h2>

            <span
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "12px",
                color: "#777",
              }}
            >
              Total seluruh pesanan
            </span>
          </div>

          {/* PESANAN PENDING */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "22px",
              border: "1px solid #eee",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "13px",
              }}
            >
              Pesanan Pending
            </p>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "28px",
                color: "#211b1d",
              }}
            >
              {dashboard.pending_orders.toLocaleString(
                "id-ID"
              )}
            </h2>

            <span
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "12px",
                color: "#a36b13",
              }}
            >
              Menunggu proses
            </span>
          </div>

          {/* PESANAN SELESAI */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "22px",
              border: "1px solid #eee",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "13px",
              }}
            >
              Pesanan Selesai
            </p>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "28px",
                color: "#211b1d",
              }}
            >
              {dashboard.completed_orders.toLocaleString(
                "id-ID"
              )}
            </h2>

            <span
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "12px",
                color: "#4f8a62",
              }}
            >
              Pesanan berstatus completed
            </span>
          </div>

          {/* TOTAL PENJUALAN */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "22px",
              border: "1px solid #eee",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "13px",
              }}
            >
              Total Penjualan
            </p>

            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "24px",
                color: "#211b1d",
              }}
            >
              {formatRupiah(
                dashboard.total_sales
              )}
            </h2>

            <span
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "12px",
                color: "#777",
              }}
            >
              Dari pesanan yang selesai
            </span>
          </div>
        </div>

        {/* =========================
            STATUS PESANAN
        ========================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* STATUS PESANAN */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#211b1d",
                }}
              >
                Status Pesanan
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                Distribusi status pesanan dari database
              </p>
            </div>

            {/* PENDING */}

            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Pending
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#211b1d",
                  }}
                >
                  {dashboard.pending_orders} (
                  {getPercentage(
                    dashboard.pending_orders
                  )}
                  %)
                </strong>
              </div>

              <div
                style={{
                  height: "10px",
                  backgroundColor: "#f1eeee",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${getPercentage(
                      dashboard.pending_orders
                    )}%`,
                    height: "100%",
                    backgroundColor: "#d59b3f",
                    borderRadius: "10px",
                  }}
                ></div>
              </div>
            </div>

            {/* COMPLETED */}

            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Selesai
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#211b1d",
                  }}
                >
                  {dashboard.completed_orders} (
                  {getPercentage(
                    dashboard.completed_orders
                  )}
                  %)
                </strong>
              </div>

              <div
                style={{
                  height: "10px",
                  backgroundColor: "#f1eeee",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${getPercentage(
                      dashboard.completed_orders
                    )}%`,
                    height: "100%",
                    backgroundColor: "#4f8a62",
                    borderRadius: "10px",
                  }}
                ></div>
              </div>
            </div>

            {/* CANCELLED */}

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Dibatalkan
                </span>

                <strong
                  style={{
                    fontSize: "13px",
                    color: "#211b1d",
                  }}
                >
                  {dashboard.cancelled_orders} (
                  {getPercentage(
                    dashboard.cancelled_orders
                  )}
                  %)
                </strong>
              </div>

              <div
                style={{
                  height: "10px",
                  backgroundColor: "#f1eeee",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${getPercentage(
                      dashboard.cancelled_orders
                    )}%`,
                    height: "100%",
                    backgroundColor: "#8f2638",
                    borderRadius: "10px",
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* RINGKASAN */}

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#211b1d",
                }}
              >
                Ringkasan Pesanan
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                Data dari sistem
              </p>
            </div>

            {/* TOTAL */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                Total pesanan
              </span>

              <strong
                style={{
                  fontSize: "16px",
                  color: "#211b1d",
                }}
              >
                {dashboard.total_orders}
              </strong>
            </div>

            {/* SELESAI */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                Selesai
              </span>

              <strong
                style={{
                  fontSize: "16px",
                  color: "#4f8a62",
                }}
              >
                {dashboard.completed_orders}
              </strong>
            </div>

            {/* PENDING */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                Pending
              </span>

              <strong
                style={{
                  fontSize: "16px",
                  color: "#a36b13",
                }}
              >
                {dashboard.pending_orders}
              </strong>
            </div>

            {/* CANCELLED */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                Dibatalkan
              </span>

              <strong
                style={{
                  fontSize: "16px",
                  color: "#8f2638",
                }}
              >
                {dashboard.cancelled_orders}
              </strong>
            </div>

            {/* TOTAL SALES */}

            <div
              style={{
                marginTop: "12px",
                padding: "16px",
                backgroundColor: "#f7f5f6",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                Total penjualan
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "20px",
                  color: "#211b1d",
                }}
              >
                {formatRupiah(
                  dashboard.total_sales
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* =========================
            INFORMASI DATA
        ========================== */}

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#211b1d",
                }}
              >
                Informasi Dashboard
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                Data yang tersedia dari API Dashboard
              </p>
            </div>

            <span
              style={{
                fontSize: "12px",
                padding: "7px 12px",
                borderRadius: "8px",
                backgroundColor: "#e9f5ec",
                color: "#4f8a62",
                fontWeight: "600",
              }}
            >
              Data Asli
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "18px",
                backgroundColor: "#f7f5f6",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                Total Status Terhitung
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "22px",
                  color: "#211b1d",
                }}
              >
                {totalStatusOrders}
              </strong>
            </div>

            <div
              style={{
                padding: "18px",
                backgroundColor: "#f7f5f6",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                Pesanan Selesai
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "22px",
                  color: "#4f8a62",
                }}
              >
                {getPercentage(
                  dashboard.completed_orders
                )}
                %
              </strong>
            </div>

            <div
              style={{
                padding: "18px",
                backgroundColor: "#f7f5f6",
                borderRadius: "10px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                Penjualan
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "18px",
                  color: "#211b1d",
                }}
              >
                {formatRupiah(
                  dashboard.total_sales
                )}
              </strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;