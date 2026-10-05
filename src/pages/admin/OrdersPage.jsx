import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  getOrders,
  getOrderByCode,
  updateOrderStatus,
  updatePaymentStatus,
} from "../../services/ordersService";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");

  // =========================
  // LOAD ORDERS
  // =========================
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOrders();

      const orderData =
        result?.data ||
        result?.orders ||
        result ||
        [];

      setOrders(
        Array.isArray(orderData)
          ? orderData
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data pesanan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================
  // HELPER
  // =========================

  const getOrderCode = (order) => {
    return (
      order?.order_code ||
      order?.code ||
      `#${order?.id || "-"}`
    );
  };

  const getCustomerName = (order) => {
    return (
      order?.customer_name ||
      order?.customer?.name ||
      order?.name ||
      "-"
    );
  };

  const getTableName = (order) => {
    return (
      order?.table?.name ||
      order?.table?.table_number ||
      order?.table_name ||
      order?.table_code ||
      "-"
    );
  };

  const getTotal = (order) => {
    return (
      order?.total ||
      order?.grand_total ||
      order?.total_price ||
      0
    );
  };

  const getItemCount = (order) => {
    if (order?.items_count !== undefined) {
      return order.items_count;
    }

    if (order?.total_items !== undefined) {
      return order.total_items;
    }

    if (Array.isArray(order?.items)) {
      return order.items.reduce(
        (total, item) =>
          total + Number(item?.quantity || 1),
        0
      );
    }

    return 0;
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================
  // STATUS PESANAN
  // =========================

  const normalizeStatus = (status) => {
    if (!status) return "Baru";

    const value = String(status).toLowerCase();

    if (
      value === "pending" ||
      value === "baru" ||
      value === "new"
    ) {
      return "Baru";
    }

    if (
      value === "confirmed" ||
      value === "processing" ||
      value === "diproses" ||
      value === "process"
    ) {
      return "Diproses";
    }

    if (
      value === "completed" ||
      value === "selesai" ||
      value === "complete"
    ) {
      return "Selesai";
    }

    if (
      value === "cancelled" ||
      value === "canceled" ||
      value === "dibatalkan"
    ) {
      return "Dibatalkan";
    }

    return status;
  };

  // =========================
  // STATUS PEMBAYARAN
  // =========================

  const normalizePaymentStatus = (status) => {
    if (!status) {
      return "Belum Dibayar";
    }

    const value = String(status).toLowerCase();

    if (value === "paid") {
      return "Sudah Dibayar";
    }

    if (value === "unpaid") {
      return "Belum Dibayar";
    }

    return status;
  };

  // =========================
  // FILTER
  // =========================

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderCode =
        getOrderCode(order).toLowerCase();

      const customer =
        getCustomerName(order).toLowerCase();

      const table =
        getTableName(order).toLowerCase();

      const keyword = search.toLowerCase();

      const matchSearch =
        orderCode.includes(keyword) ||
        customer.includes(keyword) ||
        table.includes(keyword);

      const status = normalizeStatus(
        order?.status
      );

      const matchStatus =
        statusFilter === "Semua" ||
        status === statusFilter;

      return (
        matchSearch &&
        matchStatus
      );
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  // =========================
  // STATISTIK
  // =========================

  const totalOrders = orders.length;

  const newOrders = orders.filter(
    (order) =>
      normalizeStatus(order?.status) ===
      "Baru"
  ).length;

  const processingOrders = orders.filter(
    (order) =>
      normalizeStatus(order?.status) ===
      "Diproses"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      normalizeStatus(order?.status) ===
      "Selesai"
  ).length;

  const unpaidOrders = orders.filter(
    (order) =>
      String(
        order?.payment_status
      ).toLowerCase() === "unpaid"
  ).length;

  // =========================
  // DETAIL PESANAN
  // =========================

  const handleDetail = async (order) => {
    try {
      setDetailLoading(true);

      const orderCode =
        order?.order_code ||
        order?.code;

      if (!orderCode) {
        setSelectedOrder(order);
        return;
      }

      const result =
        await getOrderByCode(orderCode);

      const detail =
        result?.data ||
        result?.order ||
        result;

      setSelectedOrder(detail);
    } catch (err) {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  // =========================
  // UPDATE STATUS PESANAN
  // =========================

  const handleUpdateStatus = async (
    order,
    newStatus
  ) => {
    try {
      setUpdating(true);

      // Update status pesanan terlebih dahulu
      await updateOrderStatus(
        order.id,
        newStatus
      );

      // ==========================================
      // JIKA PESANAN DIPROSES KE DAPUR
      // PEMBAYARAN OTOMATIS MENJADI SUDAH DIBAYAR
      // ==========================================
      if (newStatus === "confirmed") {
        await updatePaymentStatus(
          order.id,
          "paid"
        );
      }

      // ==========================================
      // PESANAN DIPROSES
      // ==========================================
      if (newStatus === "confirmed") {
        alert(
          "Pesanan berhasil diproses ke dapur dan pembayaran sudah dikonfirmasi."
        );
      }

      // ==========================================
      // PESANAN SELESAI
      // ==========================================
      else if (newStatus === "completed") {
        alert(
          "Pesanan berhasil diselesaikan."
        );
      }

      // ==========================================
      // PESANAN DIBATALKAN
      // ==========================================
      else if (newStatus === "cancelled") {
        alert(
          "Pesanan berhasil dibatalkan."
        );
      }

      setSelectedOrder(null);

      await loadOrders();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Gagal memperbarui status pesanan."
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================
  // BADGE STATUS PESANAN
  // =========================

  const StatusBadge = ({ status }) => {
    const normalized =
      normalizeStatus(status);

    let background = "#f3f4f6";
    let color = "#374151";

    if (normalized === "Baru") {
      background = "#fff3cd";
      color = "#856404";
    }

    if (normalized === "Diproses") {
      background = "#e8d5d5";
      color = "#800000";
    }

    if (normalized === "Selesai") {
      background = "#d1e7dd";
      color = "#0f5132";
    }

    if (normalized === "Dibatalkan") {
      background = "#f8d7da";
      color = "#842029";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: "20px",
          backgroundColor: background,
          color,
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {normalized}
      </span>
    );
  };

  // =========================
  // BADGE PEMBAYARAN
  // =========================

  const PaymentBadge = ({ status }) => {
    const normalized =
      normalizePaymentStatus(status);

    const paid =
      String(status).toLowerCase() ===
      "paid";

    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 10px",
          borderRadius: "20px",
          backgroundColor: paid
            ? "#d1e7dd"
            : "#fff3cd",
          color: paid
            ? "#0f5132"
            : "#856404",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {normalized}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      <AdminSidebar />

      <main
        style={{
          marginLeft: "247px",
          width: "calc(100% - 247px)",
          minWidth: 0,
          minHeight: "100vh",
          padding: "30px",
          boxSizing: "border-box",
          overflowX: "auto",
          backgroundColor: "#f8f9fa",
        }}
      >
        {/* =========================
            HEADER
        ========================= */}

        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontWeight: "700",
              color: "#222",
            }}
          >
            Pesanan
          </h2>

          <p
            style={{
              marginTop: "6px",
              color: "#777",
            }}
          >
            Kelola pesanan dan pembayaran pelanggan.
          </p>
        </div>

        {/* =========================
            STATISTIK
        ========================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <StatCard
            title="Total Pesanan"
            value={totalOrders}
          />

          <StatCard
            title="Pesanan Baru"
            value={newOrders}
          />

          <StatCard
            title="Diproses"
            value={processingOrders}
            valueColor="#800000"
          />

          <StatCard
            title="Selesai"
            value={completedOrders}
            valueColor="#0f5132"
          />

          <StatCard
            title="Belum Dibayar"
            value={unpaidOrders}
            valueColor="#856404"
          />
        </div>

        {/* =========================
            SEARCH + FILTER
        ========================= */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Cari pesanan, pelanggan, atau meja..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fff",
            }}
          >
            <option value="Semua">
              Semua Status
            </option>

            <option value="Baru">
              Baru
            </option>

            <option value="Diproses">
              Diproses
            </option>

            <option value="Selesai">
              Selesai
            </option>

            <option value="Dibatalkan">
              Dibatalkan
            </option>
          </select>
        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#842029",
              padding: "12px 15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* =========================
            TABLE
        ========================= */}

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            overflowX: "auto",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#777",
              }}
            >
              Memuat pesanan...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#777",
              }}
            >
              Belum ada pesanan.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1100px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#800000",
                    color: "#fff",
                  }}
                >
                  <th style={thStyle}>
                    Pesanan
                  </th>

                  <th style={thStyle}>
                    Pelanggan
                  </th>

                  <th style={thStyle}>
                    Meja
                  </th>

                  <th style={thStyle}>
                    Item
                  </th>

                  <th style={thStyle}>
                    Total
                  </th>

                  <th style={thStyle}>
                    Status Pesanan
                  </th>

                  <th style={thStyle}>
                    Pembayaran
                  </th>

                  <th style={thStyle}>
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>
                          {getOrderCode(
                            order
                          )}
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#888",
                            marginTop: "4px",
                          }}
                        >
                          {formatTime(
                            order.created_at
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {getCustomerName(
                          order
                        )}
                      </td>

                      <td style={tdStyle}>
                        {getTableName(order)}
                      </td>

                      <td style={tdStyle}>
                        {getItemCount(order)}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {formatRupiah(
                            getTotal(order)
                          )}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge
                          status={
                            order.status
                          }
                        />
                      </td>

                      <td style={tdStyle}>
                        <PaymentBadge
                          status={
                            order.payment_status
                          }
                        />
                      </td>

                      <td style={tdStyle}>
                        <button
                          onClick={() =>
                            handleDetail(
                              order
                            )
                          }
                          style={{
                            border: "none",
                            background:
                              "#800000",
                            color: "#fff",
                            padding:
                              "8px 12px",
                            borderRadius:
                              "7px",
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* =========================
            DETAIL MODAL
        ========================= */}

        {selectedOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "#fff",
                width: "100%",
                maxWidth: "790px",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "15px",
                padding: "28px",
                boxSizing: "border-box",
              }}
            >
              {detailLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  Memuat detail pesanan...
                </div>
              ) : (
                <>
                  {/* HEADER MODAL */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom: "25px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontWeight:
                            "700",
                          fontSize:
                            "26px",
                        }}
                      >
                        Detail Pesanan
                      </h4>

                      <div
                        style={{
                          color: "#777",
                          marginTop:
                            "6px",
                          fontSize:
                            "16px",
                        }}
                      >
                        {getOrderCode(
                          selectedOrder
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedOrder(
                          null
                        )
                      }
                      style={{
                        border: "none",
                        background:
                          "#f1f1f1",
                        width: "40px",
                        height: "40px",
                        borderRadius:
                          "50%",
                        cursor:
                          "pointer",
                        fontSize:
                          "20px",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* INFO */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "16px",
                      marginBottom:
                        "22px",
                    }}
                  >
                    <InfoBox
                      label="Pelanggan"
                      value={getCustomerName(
                        selectedOrder
                      )}
                    />

                    <InfoBox
                      label="Meja"
                      value={getTableName(
                        selectedOrder
                      )}
                    />

                    <InfoBox
                      label="Status Pesanan"
                      value={
                        <StatusBadge
                          status={
                            selectedOrder.status
                          }
                        />
                      }
                    />

                    <InfoBox
                      label="Status Pembayaran"
                      value={
                        <PaymentBadge
                          status={
                            selectedOrder.payment_status
                          }
                        />
                      }
                    />
                  </div>

                  {/* CATATAN */}

                  {selectedOrder.note && (
                    <div
                      style={{
                        background:
                          "#f8f9fa",
                        padding:
                          "15px 16px",
                        borderRadius:
                          "9px",
                        marginBottom:
                          "24px",
                      }}
                    >
                      <strong
                        style={{
                          fontSize:
                            "16px",
                        }}
                      >
                        Catatan:
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "7px",
                          color:
                            "#555",
                          fontSize:
                            "16px",
                        }}
                      >
                        {
                          selectedOrder.note
                        }
                      </div>
                    </div>
                  )}

                  {/* ITEMS */}

                  <h5
                    style={{
                      fontWeight:
                        "700",
                      fontSize:
                        "21px",
                      marginBottom:
                        "14px",
                    }}
                  >
                    Detail Item
                  </h5>

                  <div
                    style={{
                      border:
                        "1px solid #e5e5e5",
                      borderRadius:
                        "10px",
                      overflow:
                        "hidden",
                      marginBottom:
                        "22px",
                    }}
                  >
                    {Array.isArray(
                      selectedOrder.items
                    ) &&
                    selectedOrder.items
                      .length > 0 ? (
                      selectedOrder.items.map(
                        (item, index) => (
                          <div
                            key={
                              item.id ||
                              index
                            }
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                index <
                                selectedOrder
                                  .items
                                  .length -
                                  1
                                  ? "1px solid #eee"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap: "15px",
                              }}
                            >
                              <div>
                                <strong
                                  style={{
                                    fontSize:
                                      "16px",
                                  }}
                                >
                                  {item
                                    ?.menu
                                    ?.name ||
                                    item?.menu_name ||
                                    item?.name ||
                                    "Menu"}
                                </strong>

                                <div
                                  style={{
                                    fontSize:
                                      "14px",
                                    color:
                                      "#777",
                                    marginTop:
                                      "5px",
                                  }}
                                >
                                  x
                                  {item?.quantity ||
                                    1}
                                </div>
                              </div>

                              <strong
                                style={{
                                  fontSize:
                                    "16px",
                                }}
                              >
                                {formatRupiah(
                                  item?.subtotal ||
                                    item?.total ||
                                    Number(
                                      item?.price ||
                                        0
                                    ) *
                                      Number(
                                        item?.quantity ||
                                          1
                                      )
                                )}
                              </strong>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div
                        style={{
                          padding:
                            "20px",
                          textAlign:
                            "center",
                          color:
                            "#777",
                        }}
                      >
                        Detail item tidak tersedia.
                      </div>
                    )}
                  </div>

                  {/* TOTAL */}

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      padding:
                        "18px 0",
                      borderTop:
                        "1px solid #ddd",
                      marginBottom:
                        "22px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          "18px",
                      }}
                    >
                      Total
                    </strong>

                    <strong
                      style={{
                        fontSize:
                          "22px",
                        color:
                          "#800000",
                      }}
                    >
                      {formatRupiah(
                        getTotal(
                          selectedOrder
                        )
                      )}
                    </strong>
                  </div>

                  {/* AKSI */}

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    {/* ==========================================
                        PESANAN BARU
                        BISA PROSES KE DAPUR
                        DAN BISA DIBATALKAN
                    ========================================== */}

                    {String(
                      selectedOrder.status
                    ).toLowerCase() ===
                      "pending" && (
                      <>
                        <button
                          disabled={
                            updating
                          }
                          onClick={() =>
                            handleUpdateStatus(
                              selectedOrder,
                              "confirmed"
                            )
                          }
                          style={{
                            ...primaryButtonStyle,
                            opacity:
                              updating
                                ? 0.6
                                : 1,
                          }}
                        >
                          {updating
                            ? "Memproses..."
                            : "Proses ke Dapur"}
                        </button>

                        <button
                          disabled={
                            updating
                          }
                          onClick={() =>
                            handleUpdateStatus(
                              selectedOrder,
                              "cancelled"
                            )
                          }
                          style={{
                            ...dangerButtonStyle,
                            opacity:
                              updating
                                ? 0.6
                                : 1,
                          }}
                        >
                          Batalkan
                        </button>
                      </>
                    )}

                    {/* ==========================================
                        PESANAN DIPROSES
                        HANYA BISA DITANDAI SELESAI
                    ========================================== */}

                    {String(
                      selectedOrder.status
                    ).toLowerCase() ===
                      "confirmed" && (
                      <button
                        disabled={
                          updating
                        }
                        onClick={() =>
                          handleUpdateStatus(
                            selectedOrder,
                            "completed"
                          )
                        }
                        style={{
                          ...successButtonStyle,
                          opacity:
                            updating
                              ? 0.6
                              : 1,
                        }}
                      >
                        {updating
                          ? "Menyelesaikan..."
                          : "Tandai Selesai"}
                      </button>
                    )}

                    {/* ==========================================
                        SUDAH SELESAI
                        PEMBAYARAN SUDAH DIBAYAR
                    ========================================== */}

                    {String(
                      selectedOrder.status
                    ).toLowerCase() ===
                      "completed" &&
                      String(
                        selectedOrder.payment_status
                      ).toLowerCase() ===
                        "paid" && (
                        <div
                          style={{
                            width:
                              "100%",
                            background:
                              "#d1e7dd",
                            color:
                              "#0f5132",
                            padding:
                              "13px 15px",
                            borderRadius:
                              "8px",
                            fontWeight:
                              "600",
                          }}
                        >
                          ✓ Pesanan selesai dan pembayaran sudah dikonfirmasi.
                        </div>
                      )}

                    {/* ==========================================
                        DIBATALKAN
                    ========================================== */}

                    {String(
                      selectedOrder.status
                    ).toLowerCase() ===
                      "cancelled" && (
                      <div
                        style={{
                          width:
                            "100%",
                            background:
                              "#f8d7da",
                            color:
                              "#842029",
                            padding:
                              "13px 15px",
                            borderRadius:
                              "8px",
                            fontWeight:
                              "600",
                          }}
                        >
                          Pesanan ini telah dibatalkan.
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =========================
// STAT CARD
// =========================

function StatCard({
  title,
  value,
  valueColor = "#222",
}) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: "14px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "700",
          marginTop: "5px",
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =========================
// INFO BOX
// =========================

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: "15px 16px",
        borderRadius: "9px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#777",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "600",
          fontSize: "16px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// =========================
// STYLE
// =========================

const thStyle = {
  padding: "14px 12px",
  textAlign: "left",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 12px",
  fontSize: "14px",
  color: "#333",
};

const primaryButtonStyle = {
  border: "none",
  background: "#800000",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const successButtonStyle = {
  border: "none",
  background: "#198754",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const dangerButtonStyle = {
  border: "none",
  background: "#dc3545",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

export default OrdersPage;