import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

function ReportPage() {
  const [period, setPeriod] = useState("7");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // AMBIL DATA REPORT
  // =========================
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/reports/sales");

      // Backend mengembalikan:
      // {
      //   total_orders: 7,
      //   total_sales: 363000,
      //   data: [...]
      // }
      setReport(response.data);
    } catch (err) {
      console.error("Gagal mengambil laporan:", err);

      setError(
        "Data laporan belum dapat dimuat. Pastikan backend sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // =========================
  // DATA ORDER DARI BACKEND
  // =========================
  const allOrders = useMemo(() => {
    if (!report?.data || !Array.isArray(report.data)) {
      return [];
    }

    return report.data;
  }, [report]);

  // =========================
  // FILTER PERIODE
  // =========================
  const filteredOrders = useMemo(() => {
    if (!allOrders.length) {
      return [];
    }

    const now = new Date();

    const startDate = new Date(now);

    if (period === "7") {
      startDate.setDate(now.getDate() - 6);
    }

    if (period === "30") {
      startDate.setDate(now.getDate() - 29);
    }

    if (period === "month") {
      startDate.setDate(1);
    }

    if (period === "year") {
      startDate.setMonth(0);
      startDate.setDate(1);
    }

    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return allOrders.filter((order) => {
      if (!order.created_at) {
        return false;
      }

      const orderDate = new Date(order.created_at);

      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [allOrders, period]);

  // =========================
  // SUMMARY
  // =========================
  const totalOrders = filteredOrders.length;

  const totalSales = filteredOrders.reduce((total, order) => {
    return total + Number(order.total || 0);
  }, 0);

  const averageOrder =
    totalOrders > 0
      ? Math.round(totalSales / totalOrders)
      : 0;

  // =========================
  // FORMAT RUPIAH
  // =========================
  const formatRupiah = (value) => {
    return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  };

  // =========================
  // FORMAT ANGKA
  // =========================
  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("id-ID");
  };

  // =========================
  // FORMAT TANGGAL
  // =========================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // DATA PENJUALAN HARIAN
  // =========================
  const dailySales = useMemo(() => {
    const grouped = {};

    filteredOrders.forEach((order) => {
      if (!order.created_at) {
        return;
      }

      const date = new Date(order.created_at);

      const key = date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          label: date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          }),
          total: 0,
          orders: 0,
          menu_sold: 0,
        };
      }

      grouped[key].total += Number(order.total || 0);
      grouped[key].orders += 1;

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          grouped[key].menu_sold += Number(item.quantity || 0);
        });
      }
    });

    return Object.values(grouped).sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );
  }, [filteredOrders]);

  // =========================
  // MENU TERLARIS
  // =========================
  const topMenus = useMemo(() => {
    const menuMap = {};

    filteredOrders.forEach((order) => {
      if (!Array.isArray(order.items)) {
        return;
      }

      order.items.forEach((item) => {
        const menu = item.menu;

        if (!menu) {
          return;
        }

        const menuId = menu.id;

        if (!menuMap[menuId]) {
          menuMap[menuId] = {
            id: menu.id,
            name: menu.name,
            total_sold: 0,
            total_sales: 0,
          };
        }

        const quantity = Number(item.quantity || 0);
        const subtotal = Number(
          item.subtotal || 0
        );

        menuMap[menuId].total_sold += quantity;
        menuMap[menuId].total_sales += subtotal;
      });
    });

    return Object.values(menuMap).sort(
      (a, b) =>
        b.total_sold - a.total_sold
    );
  }, [filteredOrders]);

  // =========================
  // NILAI MAKSIMAL GRAFIK
  // =========================
  const maxSale = useMemo(() => {
    if (!dailySales.length) {
      return 1;
    }

    return Math.max(
      ...dailySales.map((item) =>
        Number(item.total || 0)
      ),
      1
    );
  }, [dailySales]);

  // =========================
  // EXPORT EXCEL / PDF
  // =========================
  const handleExport = async (type) => {
    try {
      const response = await api.get(
        `/reports/sales/${type}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        type === "excel"
          ? "laporan-penjualan.xlsx"
          : "laporan-penjualan.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Gagal export laporan:",
        err
      );

      alert("Laporan belum dapat diekspor.");
    }
  };

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
      ========================= */}

      <AdminSidebar />

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main
        className="admin-report-page"
        style={{
          marginLeft: "240px",
          width: "calc(100% - 240px)",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div className="admin-report-container">

          {/* =========================
              HEADER
          ========================= */}

          <div className="admin-report-header">

            <div>
              <div className="admin-breadcrumb">
                LAPORAN
                <span>•</span>
                ANALISIS PENJUALAN
              </div>

              <h1>
                Laporan Penjualan
              </h1>

              <p>
                Pantau performa penjualan dan
                aktivitas pesanan restoran.
              </p>
            </div>

            <div className="admin-report-actions">

              <button
                type="button"
                className="report-export-button"
                onClick={() =>
                  handleExport("excel")
                }
              >
                ↓
                Export Excel
              </button>

              <button
                type="button"
                className="report-export-primary"
                onClick={() =>
                  handleExport("pdf")
                }
              >
                ↓
                Export PDF
              </button>

            </div>

          </div>

          {/* =========================
              FILTER
          ========================= */}

          <section className="report-filter-card">

            <div className="report-filter-title">
              <span>
                Periode Laporan
              </span>

              <strong>
                Pilih rentang waktu
              </strong>
            </div>

            <div className="report-period-buttons">

              <button
                type="button"
                className={
                  period === "7"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("7")
                }
              >
                7 Hari
              </button>

              <button
                type="button"
                className={
                  period === "30"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("30")
                }
              >
                30 Hari
              </button>

              <button
                type="button"
                className={
                  period === "month"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("month")
                }
              >
                Bulan Ini
              </button>

              <button
                type="button"
                className={
                  period === "year"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("year")
                }
              >
                Tahun Ini
              </button>

            </div>

            <button
              type="button"
              className="report-refresh-button"
              onClick={fetchReport}
            >
              ↻
              Refresh
            </button>

          </section>

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <div className="report-error">

              <strong>
                Data belum tersedia
              </strong>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* =========================
              SUMMARY CARDS
          ========================= */}

          <section className="report-summary-grid">

            <article className="report-summary-card">

              <div className="report-summary-icon">
                Rp
              </div>

              <div>
                <span>
                  TOTAL PENJUALAN
                </span>

                <strong>
                  {loading
                    ? "..."
                    : formatRupiah(
                        totalSales
                      )}
                </strong>

                <small>
                  Pendapatan dari pesanan
                </small>
              </div>

            </article>

            <article className="report-summary-card">

              <div className="report-summary-icon">
                #
              </div>

              <div>
                <span>
                  JUMLAH PESANAN
                </span>

                <strong>
                  {loading
                    ? "..."
                    : formatNumber(
                        totalOrders
                      )}
                </strong>

                <small>
                  Pesanan pada periode terpilih
                </small>
              </div>

            </article>

            <article className="report-summary-card">

              <div className="report-summary-icon">
                ↗
              </div>

              <div>
                <span>
                  RATA-RATA PESANAN
                </span>

                <strong>
                  {loading
                    ? "..."
                    : formatRupiah(
                        averageOrder
                      )}
                </strong>

                <small>
                  Nilai rata-rata setiap pesanan
                </small>
              </div>

            </article>

            <article className="report-summary-card">

              <div className="report-summary-icon">
                ★
              </div>

              <div>
                <span>
                  MENU TERLARIS
                </span>

                <strong className="report-best-menu">
                  {topMenus.length > 0
                    ? topMenus[0].name
                    : "-"}
                </strong>

                <small>
                  Berdasarkan jumlah terjual
                </small>
              </div>

            </article>

          </section>

          {/* =========================
              CHART
          ========================= */}

          <section className="report-main-grid">

            <div className="report-chart-card">

              <div className="report-card-header">

                <div>
                  <span>
                    PERFORMANCE
                  </span>

                  <h2>
                    Penjualan
                    {period === "7"
                      ? " 7 Hari Terakhir"
                      : period === "30"
                      ? " 30 Hari Terakhir"
                      : period === "month"
                      ? " Bulan Ini"
                      : " Tahun Ini"}
                  </h2>
                </div>

                <div className="report-chart-legend">
                  <span />
                  Penjualan
                </div>

              </div>

              <div className="report-chart">

                <div className="report-y-axis">

                  <span>
                    {formatRupiah(
                      maxSale
                    )}
                  </span>

                  <span>
                    {formatRupiah(
                      maxSale / 2
                    )}
                  </span>

                  <span>
                    Rp 0
                  </span>

                </div>

                <div className="report-chart-area">

                  <div className="report-grid-line top" />

                  <div className="report-grid-line middle" />

                  <div className="report-grid-line bottom" />

                  <div className="report-bars">

                    {dailySales.length > 0 ? (
                      dailySales.map(
                        (item, index) => {

                          const value =
                            Number(
                              item.total || 0
                            );

                          const height =
                            Math.max(
                              (value /
                                maxSale) *
                                100,
                              3
                            );

                          return (
                            <div
                              className="report-bar-column"
                              key={
                                item.date ||
                                index
                              }
                            >

                              <div className="report-bar-value">
                                {formatRupiah(
                                  value
                                )}
                              </div>

                              <div
                                className="report-bar"
                                style={{
                                  height: `${height}%`,
                                }}
                              />

                              <span>
                                {item.label ||
                                  item.date ||
                                  `Hari ${
                                    index + 1
                                  }`}
                              </span>

                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="report-no-chart">
                        Belum ada data penjualan
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* =========================
                TOP MENU
            ========================= */}

            <div className="report-top-menu-card">

              <div className="report-card-header">

                <div>
                  <span>
                    PERFORMANCE MENU
                  </span>

                  <h2>
                    Menu Terlaris
                  </h2>
                </div>

                <span className="report-today-label">
                  TOP
                </span>

              </div>

              <div className="report-top-menu-list">

                {topMenus.length > 0 ? (
                  topMenus
                    .slice(0, 5)
                    .map(
                      (menu, index) => {

                        const sold =
                          Number(
                            menu.total_sold ||
                              0
                          );

                        return (
                          <div
                            className="report-top-menu-item"
                            key={
                              menu.id ||
                              index
                            }
                          >

                            <div className="report-ranking">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </div>

                            <div className="report-menu-info">

                              <strong>
                                {menu.name ||
                                  "Menu"}
                              </strong>

                              <span>
                                {formatNumber(
                                  sold
                                )}{" "}
                                terjual
                              </span>

                            </div>

                            <div className="report-menu-sales">
                              {formatRupiah(
                                menu.total_sales
                              )}
                            </div>

                          </div>
                        );
                      }
                    )
                ) : (
                  <div className="report-empty-list">
                    Belum ada data menu.
                  </div>
                )}

              </div>

            </div>

          </section>

          {/* =========================
              DETAIL TABLE
          ========================= */}

          <section className="report-table-card">

            <div className="report-card-header">

              <div>
                <span>
                  DETAIL LAPORAN
                </span>

                <h2>
                  Ringkasan Penjualan
                </h2>
              </div>

              <span className="report-period-label">
                {period === "7"
                  ? "7 Hari"
                  : period === "30"
                  ? "30 Hari"
                  : period === "month"
                  ? "Bulan Ini"
                  : "Tahun Ini"}
              </span>

            </div>

            <div className="report-table-wrapper">

              <table className="report-table">

                <thead>

                  <tr>

                    <th>
                      TANGGAL
                    </th>

                    <th>
                      PESANAN
                    </th>

                    <th>
                      MENU TERJUAL
                    </th>

                    <th>
                      TOTAL PENJUALAN
                    </th>

                    <th>
                      RATA-RATA
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {dailySales.length > 0 ? (
                    dailySales.map(
                      (item, index) => {

                        const sales =
                          Number(
                            item.total ||
                              0
                          );

                        const orders =
                          Number(
                            item.orders ||
                              0
                          );

                        const menuSold =
                          Number(
                            item.menu_sold ||
                              0
                          );

                        const average =
                          orders > 0
                            ? sales /
                              orders
                            : 0;

                        return (
                          <tr
                            key={
                              item.date ||
                              index
                            }
                          >

                            <td>
                              {formatDate(
                                item.date
                              )}
                            </td>

                            <td>
                              {formatNumber(
                                orders
                              )}
                            </td>

                            <td>
                              {formatNumber(
                                menuSold
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatRupiah(
                                  sales
                                )}
                              </strong>
                            </td>

                            <td>
                              {formatRupiah(
                                average
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>

                      <td
                        colSpan="5"
                        className="report-table-empty"
                      >
                        Belum ada data laporan
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>

          {/* =========================
              FOOTER INFO
          ========================= */}

          <div className="report-footer-info">

            <span>
              Data laporan mengikuti transaksi
              yang tercatat pada sistem.
            </span>

            <span>
              Terakhir diperbarui secara manual
              melalui tombol Refresh.
            </span>

          </div>

        </div>
      </main>
    </div>
  );
}

export default ReportPage;