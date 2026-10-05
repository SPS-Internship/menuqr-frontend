import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
} from "../../services/promoService";


function PromoStatusBadge({ status }) {
  const styles = {
    Aktif: {
      background: "#e8f6ed",
      color: "#167344",
    },

    Terjadwal: {
      background: "#e9efff",
      color: "#315fd4",
    },

    Berakhir: {
      background: "#f2f2f4",
      color: "#777783",
    },
  };

  const style = styles[status] || styles.Berakhir;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: style.background,
        color: style.color,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "currentColor",
        }}
      />

      {status}
    </span>
  );
}

function formatRupiah(value) {
  const number = Number(value) || 0;

  return `Rp${new Intl.NumberFormat("id-ID").format(number)}`;
}

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPromoStatus(promo) {
  const now = new Date();

  const startsAt = promo.starts_at
    ? new Date(promo.starts_at)
    : null;

  const endsAt = promo.ends_at
    ? new Date(promo.ends_at)
    : null;

  if (promo.is_active === false || promo.is_active === 0) {
    return "Berakhir";
  }

  if (startsAt && now < startsAt) {
    return "Terjadwal";
  }

  if (endsAt && now > endsAt) {
    return "Berakhir";
  }

  return "Aktif";
}

function getRemainingText(promo, status) {
  if (status === "Berakhir") {
    return "Kedaluwarsa";
  }

  if (status === "Terjadwal") {
    if (!promo.starts_at) {
      return "Belum dimulai";
    }

    const now = new Date();
    const start = new Date(promo.starts_at);

    const difference = start.getTime() - now.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
      return "Segera dimulai";
    }

    return `Dimulai dalam ${days} hari`;
  }

  if (!promo.ends_at) {
    return "Tanpa batas waktu";
  }

  const now = new Date();
  const end = new Date(promo.ends_at);

  const difference = end.getTime() - now.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) {
    return "Berakhir hari ini";
  }

  return `Sisa ${days} hari`;
}

function getPromoIcon(type) {
  if (type === "percentage") {
    return "%";
  }

  return "Rp";
}

function getPromoTypeLabel(type) {
  if (type === "percentage") {
    return "Persentase";
  }

  return "Potongan Tetap";
}

function formatPromoValue(promo) {
  if (promo.type === "percentage") {
    return `${Number(promo.value) || 0}%`;
  }

  return formatRupiah(promo.value);
}

function getErrorMessage(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;

    const firstError = Object.values(errors)?.[0];

    if (Array.isArray(firstError)) {
      return firstError[0];
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

function PromoPage() {
  const [promos, setPromos] = useState([]);
  const [adminRestaurant, setAdminRestaurant] = useState(null);

  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingPromo, setEditingPromo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState({
    restaurant_id: "",
    name: "",
    code: "",
    is_active: true,
    starts_at: "",
    ends_at: "",
    min_order: "",
    type: "percentage",
    value: "",
  });

  // =========================================================
  // FETCH DATA
  // =========================================================

  const getCurrentAdminRestaurant = () => {
    try {
      const storedRestaurant =
        localStorage.getItem("adminRestaurant");

      const storedAdmin =
        localStorage.getItem("adminUser");

      const restaurant = storedRestaurant
        ? JSON.parse(storedRestaurant)
        : null;

      const admin = storedAdmin
        ? JSON.parse(storedAdmin)
        : null;

      return {
        restaurant:
          restaurant?.data ||
          restaurant ||
          null,
        restaurantId:
          restaurant?.data?.id ||
          restaurant?.id ||
          restaurant?.restaurant_id ||
          admin?.restaurant_id ||
          admin?.restaurant?.id ||
          null,
      };
    } catch (error) {
      console.error(
        "Gagal membaca data restaurant admin:",
        error
      );

      return {
        restaurant: null,
        restaurantId: null,
      };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { restaurant, restaurantId } =
        getCurrentAdminRestaurant();

      setAdminRestaurant(restaurant);

      const promoResponse = await getPromos();

      const promoData =
        promoResponse?.data || promoResponse || [];

      const currentRestaurantId = Number(
        restaurantId
      );

      const filteredPromoData =
        Array.isArray(promoData) &&
        currentRestaurantId
          ? promoData.filter(
              (promo) =>
                Number(promo.restaurant_id) ===
                currentRestaurantId
            )
          : [];

      setPromos(
        Array.isArray(filteredPromoData)
          ? filteredPromoData
          : []
      );
    } catch (error) {
      console.error(
        "Gagal mengambil data promo:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // SUCCESS MESSAGE
  // =========================================================

  const showSuccess = (message) => {
    setSuccessMessage(message);

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // =========================================================
  // FORM HANDLER
  // =========================================================

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setEditingPromo(null);

    const { restaurantId } =
      getCurrentAdminRestaurant();

    setForm({
      restaurant_id: restaurantId || "",
      name: "",
      code: "",
      is_active: true,
      starts_at: "",
      ends_at: "",
      min_order: "",
      type: "percentage",
      value: "",
    });

    setErrorMessage("");
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (promo) => {
    setEditingPromo(promo);

    setForm({
      restaurant_id:
        getCurrentAdminRestaurant().restaurantId ||
        promo.restaurant_id ||
        "",

      // FIX:
      // Nama promo sekarang ikut dimasukkan
      name:
        promo.name || "",

      // FIX:
      // Kode promo sekarang ikut dimasukkan
      code:
        promo.code || "",

      is_active:
        promo.is_active === true ||
        promo.is_active === 1,

      starts_at: promo.starts_at
        ? promo.starts_at.substring(0, 16)
        : "",

      ends_at: promo.ends_at
        ? promo.ends_at.substring(0, 16)
        : "",

      min_order:
        promo.min_order ?? "",

      type:
        promo.type || "percentage",

      value:
        promo.value ?? "",
    });

    setErrorMessage("");
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPromo(null);
    setErrorMessage("");
  };

  // =========================================================
  // SUBMIT PROMO
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    // Restaurant otomatis mengikuti akun admin
    const { restaurantId } =
      getCurrentAdminRestaurant();

    if (!restaurantId) {
      setErrorMessage(
        "Restaurant admin tidak ditemukan. Silakan login kembali."
      );
      return;
    }

    // Nama promo wajib diisi
    if (!form.name.trim()) {
      setErrorMessage(
        "Nama promo harus diisi."
      );
      return;
    }

    // Kode promo wajib diisi
    if (!form.code.trim()) {
      setErrorMessage(
        "Kode promo harus diisi."
      );
      return;
    }

    // Nilai diskon wajib diisi
    if (
      form.value === "" ||
      form.value === null ||
      form.value === undefined
    ) {
      setErrorMessage(
        "Nilai diskon harus diisi."
      );
      return;
    }

    // Persentase maksimal 100
    if (
      form.type === "percentage" &&
      Number(form.value) > 100
    ) {
      setErrorMessage(
        "Persentase diskon tidak boleh lebih dari 100%."
      );
      return;
    }

    // Nilai diskon tidak boleh negatif
    if (Number(form.value) < 0) {
      setErrorMessage(
        "Nilai diskon tidak boleh kurang dari 0."
      );
      return;
    }

    // Minimum pembelian tidak boleh negatif
    if (Number(form.min_order) < 0) {
      setErrorMessage(
        "Minimum pembelian tidak boleh kurang dari 0."
      );
      return;
    }

    // Tanggal selesai tidak boleh lebih awal
    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.ends_at) <
        new Date(form.starts_at)
    ) {
      setErrorMessage(
        "Tanggal berakhir tidak boleh sebelum tanggal mulai."
      );
      return;
    }

    try {
      setSaving(true);

      // =====================================================
      // PAYLOAD
      // =====================================================

      const payload = {
        restaurant_id: restaurantId,

        // FIX:
        // name sekarang dikirim ke backend
        name: form.name.trim(),

        // FIX:
        // code sekarang dikirim ke backend
        code: form.code.trim().toUpperCase(),

        is_active: Boolean(form.is_active),

        starts_at: form.starts_at
          ? form.starts_at
          : null,

        ends_at: form.ends_at
          ? form.ends_at
          : null,

        min_order:
          Number(form.min_order) || 0,

        type: form.type,

        value: Number(form.value),
      };

      console.log(
        "Payload promo:",
        payload
      );

      // =====================================================
      // UPDATE
      // =====================================================

      if (editingPromo) {
        await updatePromo(
          editingPromo.id,
          payload
        );

        showSuccess(
          "Promo berhasil diperbarui."
        );
      }

      // =====================================================
      // CREATE
      // =====================================================

      else {
        await createPromo(payload);

        showSuccess(
          "Promo berhasil ditambahkan."
        );
      }

      setShowModal(false);
      setEditingPromo(null);

      await fetchData();
    } catch (error) {
      console.error(
        "Gagal menyimpan promo:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE PROMO
  // =========================================================

  const handleDelete = async (promo) => {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus promo "${promo.code}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      await deletePromo(promo.id);

      showSuccess(
        "Promo berhasil dihapus."
      );

      await fetchData();
    } catch (error) {
      console.error(
        "Gagal menghapus promo:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    }
  };

  // =========================================================
  // PROMO STATUS
  // =========================================================

  const promoWithStatus = useMemo(() => {
    return promos.map((promo) => ({
      ...promo,
      status: getPromoStatus(promo),
    }));
  }, [promos]);

  // =========================================================
  // COUNTS
  // =========================================================

  const activeCount = promoWithStatus.filter(
    (promo) =>
      promo.status === "Aktif"
  ).length;

  const scheduledCount = promoWithStatus.filter(
    (promo) =>
      promo.status === "Terjadwal"
  ).length;

  const expiredCount = promoWithStatus.filter(
    (promo) =>
      promo.status === "Berakhir"
  ).length;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredPromos =
    promoWithStatus.filter(
      (promo) => {
        const matchesTab =
          activeTab === "Semua" ||
          (activeTab === "Aktif" &&
            promo.status === "Aktif") ||
          (activeTab === "Terjadwal" &&
            promo.status === "Terjadwal") ||
          (activeTab === "Berakhir" &&
            promo.status === "Berakhir");

        const keyword =
          search.toLowerCase().trim();

        const matchesSearch =
          String(promo.name || "")
            .toLowerCase()
            .includes(keyword) ||
          String(promo.code || "")
            .toLowerCase()
            .includes(keyword);

        return (
          matchesTab &&
          matchesSearch
        );
      }
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f7fc",
        color: "#252532",
      }}
    >
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <AdminSidebar />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        style={{
          marginLeft: "240px",
          minHeight: "100vh",
          padding: "32px 32px 45px",
          boxSizing: "border-box",
        }}
      >
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "26px",
          }}
        >
          <div>
            {/* Breadcrumb */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "8px",
                fontSize: "11px",
              }}
            >
              <span
                style={{
                  color: "#94132f",
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                }}
              >
                KAMPANYE & PENAWARAN
              </span>

              <span
                style={{
                  color: "#b5b4bd",
                }}
              >
                •
              </span>

              <span
                style={{
                  color: "#777681",
                }}
              >
                Shibui Dining Management
              </span>
            </div>

            {/* Title */}

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: "-0.8px",
              }}
            >
              Promosi
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#777681",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Kelola promo restoran, diskon musiman,
              <br />
              voucher meja, dan loyalty dining.
            </p>
          </div>

          {/* =====================================================
              STAT CARDS
          ====================================================== */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              paddingTop: "24px",
            }}
          >
            {/* PROMO BERJALAN */}

            <div
              style={{
                width: "178px",
                minHeight: "68px",
                padding: "12px 14px",
                borderRadius: "9px",
                background: "#f0f1fa",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#dceaea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "19px",
                  flexShrink: 0,
                }}
              >
                ⚡
              </div>

              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#777681",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    fontWeight: 600,
                  }}
                >
                  PROMO BERJALAN
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "3px",
                    fontSize: "16px",
                    color: "#252532",
                  }}
                >
                  {activeCount} Aktif
                </strong>
              </div>
            </div>

            {/* TOTAL PROMO */}

            <div
              style={{
                width: "178px",
                minHeight: "68px",
                padding: "12px 14px",
                borderRadius: "9px",
                background: "#f0f1fa",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#f4e4e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "19px",
                  flexShrink: 0,
                }}
              >
                🎁
              </div>

              <div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#777681",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    fontWeight: 600,
                  }}
                >
                  TOTAL PROMO
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: "3px",
                    fontSize: "16px",
                    color: "#252532",
                  }}
                >
                  {promos.length}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {errorMessage && !showModal && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              borderRadius: "7px",
              background: "#fff0f0",
              border: "1px solid #ffd3d3",
              color: "#b42323",
              fontSize: "12px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* =====================================================
            SUCCESS MESSAGE
        ====================================================== */}

        {successMessage && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              borderRadius: "7px",
              background: "#eaf8ef",
              border: "1px solid #ccebd8",
              color: "#167344",
              fontSize: "12px",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* =====================================================
            RECOMMENDATION BANNER
        ====================================================== */}

        <section
          style={{
            position: "relative",
            minHeight: "174px",
            marginBottom: "24px",
            borderRadius: "10px",
            overflow: "hidden",
            background:
              "linear-gradient(100deg, #f1f2fb 0%, #f0f1fa 64%, #dedee7 64%)",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "58px",
              top: "16px",
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.18)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "24px",
              maxWidth: "570px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 11px",
                borderRadius: "2px",
                background: "#eadde5",
                color: "#891334",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.4px",
              }}
            >
              ✨ REKOMENDASI DINAMIS
            </span>

            <h2
              style={{
                margin: "12px 0 6px",
                fontSize: "21px",
                lineHeight: 1.25,
                fontWeight: 700,
                color: "#292833",
              }}
            >
              Kelola Promo Restoran
            </h2>

            <p
              style={{
                margin: 0,
                color: "#686773",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              Buat promo persentase atau potongan
              harga tetap. Atur periode berlaku,
              minimum pembelian, dan status promo
              langsung dari halaman ini.
            </p>
          </div>

          {/* INFO */}

          <div
            style={{
              position: "absolute",
              right: "225px",
              top: "60px",
              width: "145px",
              padding: "13px 10px",
              background: "#ffffff",
              borderRadius: "5px",
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.04)",
              boxSizing: "border-box",
              zIndex: 3,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#55545e",
              }}
            >
              Promo terjadwal{" "}
              <strong
                style={{
                  color: "#315fd4",
                }}
              >
                {scheduledCount}
              </strong>
            </div>

            <div
              style={{
                height: "6px",
                marginTop: "7px",
                borderRadius: "10px",
                background: "#e7e5eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width:
                    promos.length > 0
                      ? `${Math.min(
                          100,
                          (scheduledCount /
                            promos.length) *
                            100
                        )}%`
                      : "0%",
                  height: "100%",
                  borderRadius: "10px",
                  background: "#315fd4",
                }}
              />
            </div>
          </div>

          {/* ADD PROMO */}

          <button
            type="button"
            onClick={openAddModal}
            style={{
              position: "absolute",
              right: "24px",
              top: "68px",
              border: "none",
              borderRadius: "4px",
              background: "#a81637",
              color: "#ffffff",
              padding: "13px 17px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              zIndex: 3,
              whiteSpace: "nowrap",
            }}
          >
            ＋ Tambah Promo Baru
          </button>
        </section>

        {/* =====================================================
            FILTER BAR
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            padding: "11px",
            marginBottom: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #eeeef3",
            boxSizing: "border-box",
          }}
        >
          {/* TABS */}

          <div
            style={{
              display: "flex",
              gap: "3px",
              background: "#f0f1f8",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            {[
              {
                label: "Semua",
                count: promos.length,
              },
              {
                label: "Aktif",
                count: activeCount,
              },
              {
                label: "Terjadwal",
                count: scheduledCount,
              },
              {
                label: "Berakhir",
                count: expiredCount,
              },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() =>
                  setActiveTab(tab.label)
                }
                style={{
                  border: "none",
                  borderRadius: "5px",
                  padding: "8px 13px",
                  background:
                    activeTab === tab.label
                      ? "#ffffff"
                      : "transparent",
                  color:
                    activeTab === tab.label
                      ? "#292833"
                      : "#73727d",
                  fontSize: "11px",
                  fontWeight:
                    activeTab === tab.label
                      ? 700
                      : 500,
                  cursor: "pointer",
                  boxShadow:
                    activeTab === tab.label
                      ? "0 1px 4px rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                {tab.label}{" "}
                <span
                  style={{
                    color:
                      tab.label === "Aktif"
                        ? "#16804d"
                        : tab.label ===
                          "Terjadwal"
                        ? "#315fd4"
                        : "#777681",
                  }}
                >
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* SEARCH */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <div
              style={{
                width: "330px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                borderRadius: "5px",
                background: "#f2f2f8",
                padding: "0 11px",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  color: "#777681",
                  fontSize: "16px",
                  marginRight: "8px",
                }}
              >
                ⌕
              </span>

              <input
                type="text"
                placeholder="Cari promo berdasarkan nama atau kode..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "11px",
                  color: "#33323d",
                }}
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            PROMO TABLE
        ====================================================== */}

        <section
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #eeeef3",
            overflow: "hidden",
          }}
        >
          {/* TABLE HEADER */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr 1.2fr .8fr 1fr 1.45fr .8fr",
              padding: "14px 19px",
              background: "#f6f6fa",
              color: "#666570",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.35px",
              boxSizing: "border-box",
              gap: "10px",
            }}
          >
            <div>NAMA PROMO</div>
            <div>KODE PROMO</div>
            <div>JENIS DISKON</div>
            <div>NILAI</div>
            <div>MIN. PEMBELIAN</div>
            <div>PERIODE BERLAKU</div>
            <div>AKSI</div>
          </div>

          {/* LOADING */}

          {loading && (
            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#777681",
                fontSize: "12px",
              }}
            >
              Memuat data promo...
            </div>
          )}

          {/* ROWS */}

          {!loading &&
            filteredPromos.map((promo) => (
              <div
                key={promo.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 1fr 1.2fr .8fr 1fr 1.45fr .8fr",
                  alignItems: "center",
                  padding: "14px 19px",
                  borderTop:
                    "1px solid #eeeeF3",
                  minHeight: "76px",
                  boxSizing: "border-box",
                  color:
                    promo.status ===
                    "Berakhir"
                      ? "#85848d"
                      : "#292833",
                  gap: "10px",
                }}
              >
                {/* NAME */}

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {promo.name ||
                      `Promo ${promo.code}`}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    <PromoStatusBadge
                      status={promo.status}
                    />
                  </span>
                </div>

                {/* CODE */}

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 9px",
                      borderRadius: "3px",
                      background: "#eff0f7",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      color: "#31303a",
                    }}
                  >
                    {promo.code || "-"}
                  </span>
                </div>

                {/* TYPE */}

                <div
                  style={{
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color:
                        promo.type ===
                        "percentage"
                          ? "#a30f31"
                          : "#16804d",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {getPromoIcon(
                      promo.type
                    )}
                  </span>

                  <span>
                    {getPromoTypeLabel(
                      promo.type
                    )}
                  </span>
                </div>

                {/* VALUE */}

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color:
                      promo.status ===
                      "Berakhir"
                        ? "#85848d"
                        : promo.type ===
                          "percentage"
                        ? "#a30f31"
                        : "#292833",
                  }}
                >
                  {formatPromoValue(
                    promo
                  )}
                </div>

                {/* MINIMUM */}

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatRupiah(
                    promo.min_order
                  )}
                </div>

                {/* PERIOD */}

                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(
                      promo.starts_at
                    )}{" "}
                    –{" "}
                    {formatDate(
                      promo.ends_at
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "10px",
                      color:
                        promo.status ===
                        "Berakhir"
                          ? "#e25555"
                          : promo.status ===
                            "Terjadwal"
                          ? "#315fd4"
                          : "#16804d",
                    }}
                  >
                    {getRemainingText(
                      promo,
                      promo.status
                    )}
                  </div>
                </div>

                {/* ACTION */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        promo
                      )
                    }
                    style={{
                      border:
                        "1px solid #dddce4",
                      background:
                        "#ffffff",
                      color: "#55545e",
                      borderRadius: "4px",
                      padding: "7px 8px",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        promo
                      )
                    }
                    style={{
                      border:
                        "1px solid #f0caca",
                      background:
                        "#fff5f5",
                      color: "#c43838",
                      borderRadius: "4px",
                      padding: "7px 8px",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}

          {/* EMPTY */}

          {!loading &&
            filteredPromos.length ===
              0 && (
              <div
                style={{
                  padding: "45px 20px",
                  textAlign: "center",
                  color: "#888794",
                  fontSize: "12px",
                }}
              >
                Promo tidak ditemukan.
              </div>
            )}

          {/* FOOTER */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 19px",
              borderTop:
                "1px solid #eeeeF3",
              fontSize: "10px",
              color: "#666570",
            }}
          >
            <div>
              Menampilkan{" "}
              <strong>
                {filteredPromos.length}
              </strong>{" "}
              dari{" "}
              <strong>
                {promos.length}
              </strong>{" "}
              promo

              <span
                style={{
                  margin: "0 10px",
                  color: "#c4c3ca",
                }}
              >
                •
              </span>

              Waktu server:
              GMT+7 (WIB)
            </div>

            <div>
              <PromoStatusBadge
                status={`${activeCount} aktif`}
              />
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          MODAL TAMBAH / EDIT PROMO
      ========================================================== */}

      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(20, 19, 27, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "520px",
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "10px",
              padding: "25px",
              boxShadow:
                "0 15px 50px rgba(0,0,0,0.15)",
              boxSizing: "border-box",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#95112f",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  {editingPromo
                    ? "EDIT PROMO"
                    : "PROMO BARU"}
                </span>

                <h2
                  style={{
                    margin: "4px 0 0",
                    fontSize: "21px",
                    color: "#292833",
                  }}
                >
                  {editingPromo
                    ? "Edit Promo"
                    : "Tambah Promo"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: "32px",
                  height: "32px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#f4f4f7",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#777681",
                }}
              >
                ×
              </button>
            </div>

            {/* MODAL ERROR */}

            {errorMessage && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "11px 13px",
                  borderRadius: "6px",
                  background: "#fff0f0",
                  border:
                    "1px solid #ffd3d3",
                  color: "#b42323",
                  fontSize: "11px",
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
            >
              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                {/* RESTAURANT */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#35343e",
                    }}
                  >
                    Restaurant
                  </label>

                  <input
                    type="text"
                    value={
                      adminRestaurant?.name ||
                      adminRestaurant?.nama ||
                      adminRestaurant?.slug ||
                      "Restaurant admin"
                    }
                    readOnly
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      border:
                        "1px solid #dddce4",
                      borderRadius: "5px",
                      background: "#f7f7fa",
                      color: "#55545e",
                      fontSize: "12px",
                      outline: "none",
                      cursor: "not-allowed",
                    }}
                  />

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: "#9998a2",
                      fontSize: "10px",
                    }}
                  >
                    Restaurant otomatis mengikuti akun admin yang sedang login.
                  </span>
                </div>

                {/* NAMA PROMO */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#35343e",
                    }}
                  >
                    Nama Promo
                  </label>

                  <input
                    type="text"
                    placeholder="Masukkan nama promo"
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      handleFormChange(
                        "name",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      border:
                        "1px solid #dddce4",
                      borderRadius: "5px",
                      outline: "none",
                      fontSize: "12px",
                    }}
                    required
                  />

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: "#9998a2",
                      fontSize: "10px",
                    }}
                  >
                    Nama digunakan sebagai
                    informasi promo di halaman
                    admin.
                  </span>
                </div>

                {/* KODE */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#35343e",
                    }}
                  >
                    Kode Promo
                  </label>

                  <input
                    type="text"
                    placeholder="Masukkan kode promo"
                    value={
                      form.code
                    }
                    onChange={(e) =>
                      handleFormChange(
                        "code",
                        e.target.value.toUpperCase()
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      border:
                        "1px solid #dddce4",
                      borderRadius: "5px",
                      outline: "none",
                      fontSize: "12px",
                      textTransform:
                        "uppercase",
                    }}
                    required
                  />

                </div>

                {/* TYPE + VALUE */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  {/* TYPE */}

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        color: "#35343e",
                      }}
                    >
                      Jenis Diskon
                    </label>

                    <select
                      value={
                        form.type
                      }
                      onChange={(e) =>
                        handleFormChange(
                          "type",
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        border:
                          "1px solid #dddce4",
                        borderRadius: "5px",
                        background:
                          "#ffffff",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    >
                      <option value="percentage">
                        Persentase
                      </option>

                      <option value="fixed">
                        Potongan Tetap
                      </option>
                    </select>
                  </div>

                  {/* VALUE */}

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        color: "#35343e",
                      }}
                    >
                      Nilai Diskon
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={
                        form.type ===
                        "percentage"
                          ? "100"
                          : undefined
                      }
                      step="1"
                      placeholder={
                        form.type ===
                        "percentage"
                          ? "10"
                          : "20000"
                      }
                      value={
                        form.value
                      }
                      onChange={(e) =>
                        handleFormChange(
                          "value",
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        boxSizing:
                          "border-box",
                        padding: "10px 12px",
                        border:
                          "1px solid #dddce4",
                        borderRadius: "5px",
                        fontSize: "12px",
                        outline: "none",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* MINIMUM */}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#35343e",
                    }}
                  >
                    Minimum Pembelian
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="75000"
                    value={
                      form.min_order
                    }
                    onChange={(e) =>
                      handleFormChange(
                        "min_order",
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      border:
                        "1px solid #dddce4",
                      borderRadius: "5px",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: "#9998a2",
                      fontSize: "10px",
                    }}
                  >
                    Contoh: 75000 untuk
                    minimum pembelian
                    Rp75.000.
                  </span>
                </div>

                {/* PERIODE */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  {/* START */}

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        color: "#35343e",
                      }}
                    >
                      Tanggal Mulai
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.starts_at
                      }
                      onChange={(e) =>
                        handleFormChange(
                          "starts_at",
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        boxSizing:
                          "border-box",
                        padding: "10px",
                        border:
                          "1px solid #dddce4",
                        borderRadius: "5px",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* END */}

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "6px",
                        color: "#35343e",
                      }}
                    >
                      Tanggal Berakhir
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.ends_at
                      }
                      onChange={(e) =>
                        handleFormChange(
                          "ends_at",
                          e.target.value
                        )
                      }
                      style={{
                        width: "100%",
                        boxSizing:
                          "border-box",
                        padding: "10px",
                        border:
                          "1px solid #dddce4",
                        borderRadius: "5px",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* STATUS */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    background: "#f7f7fa",
                    border:
                      "1px solid #eeeef3",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#35343e",
                      }}
                    >
                      Status Promo
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        fontSize: "10px",
                        color: "#85848d",
                      }}
                    >
                      Aktifkan promo agar
                      dapat digunakan
                      customer.
                    </span>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        form.is_active
                      }
                      onChange={(e) =>
                        handleFormChange(
                          "is_active",
                          e.target.checked
                        )
                      }
                    />

                    {form.is_active
                      ? "Aktif"
                      : "Nonaktif"}
                  </label>
                </div>
              </div>

              {/* ACTION */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "25px",
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    border:
                      "1px solid #dddce4",
                    background: "#ffffff",
                    color: "#55545e",
                    padding: "10px 17px",
                    borderRadius: "5px",
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: "none",
                    background: saving
                      ? "#c98a9a"
                      : "#a81637",
                    color: "#ffffff",
                    padding: "10px 17px",
                    borderRadius: "5px",
                    fontWeight: 600,
                    cursor: saving
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "12px",
                  }}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingPromo
                    ? "Simpan Perubahan"
                    : "Simpan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoPage;