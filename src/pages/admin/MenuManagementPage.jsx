import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  getAdminMenus,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../../services/menuService";

import { getAdminCategories } from "../../services/categoryService";
import { useAdminProfile } from "../../context/AdminProfileContext";

function MenuManagementPage() {
  // =========================================================
  // ADMIN PROFILE / RESTAURANT AKTIF
  // =========================================================

  const { profile } = useAdminProfile();

  const activeRestaurant =
    profile?.restaurant || null;

  const activeRestaurantId =
    activeRestaurant?.id ||
    (() => {
      const savedAdminUser =
        localStorage.getItem("adminUser");

      if (savedAdminUser) {
        try {
          const parsedAdminUser =
            JSON.parse(savedAdminUser);

          return parsedAdminUser?.restaurant_id || null;
        } catch (error) {
          console.error(
            "Gagal membaca adminUser:",
            error
          );
        }
      }

      return null;
    })();

  // =========================================================
  // DATA
  // =========================================================

  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);

  // =========================================================
  // FILTER
  // =========================================================

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // =========================================================
  // LOADING & ERROR
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // TAMBAH MENU
  // =========================================================

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    restaurant_id: "",
    category_id: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    image: null,
    is_available: true,
    sort_order: 0,
  });

  // =========================================================
  // EDIT MENU
  // =========================================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingMenu, setEditingMenu] =
    useState(null);

  const [editFormData, setEditFormData] = useState({
    restaurant_id: "",
    category_id: "",
    name: "",
    slug: "",
    description: "",
    price: "",
    image: null,
    is_available: true,
    sort_order: 0,
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        menuResponse,
        categoryResponse,
      ] = await Promise.all([
        getAdminMenus(),
        getAdminCategories(),
      ]);

      const menuData =
        Array.isArray(menuResponse)
          ? menuResponse
          : menuResponse?.data || [];

      const categoryData =
        Array.isArray(categoryResponse)
          ? categoryResponse
          : categoryResponse?.data || [];

      setMenus(menuData);
      setCategories(categoryData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data menu. Pastikan backend Laravel sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DATA RESTAURANT AKTIF
  // =========================================================

  const restaurantMenus = useMemo(() => {
    if (!activeRestaurantId) {
      return menus;
    }

    return menus.filter((menu) => {
      const menuRestaurantId =
        menu.restaurant_id ||
        menu.restaurant?.id;

      return (
        String(menuRestaurantId) ===
        String(activeRestaurantId)
      );
    });
  }, [menus, activeRestaurantId]);

  const restaurantCategories = useMemo(() => {
    if (!activeRestaurantId) {
      return categories;
    }

    return categories.filter((category) => {
      const categoryRestaurantId =
        category.restaurant_id ||
        category.restaurant?.id;

      return (
        String(categoryRestaurantId) ===
        String(activeRestaurantId)
      );
    });
  }, [categories, activeRestaurantId]);

  // =========================================================
  // HELPER
  // =========================================================

  const getCategoryName = (menu) => {
    if (menu.category?.name) {
      return menu.category.name;
    }

    const category =
      restaurantCategories.find(
        (item) =>
          String(item.id) ===
          String(menu.category_id)
      );

    return category?.name || "-";
  };

  const getRestaurantName = (menu) => {
    if (menu.restaurant?.name) {
      return menu.restaurant.name;
    }

    if (
      activeRestaurant &&
      String(menu.restaurant_id) ===
        String(activeRestaurant.id)
    ) {
      return activeRestaurant.name;
    }

    return "-";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID").format(
      price || 0
    );
  };

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // =========================================================
  // FILTER MENU
  // =========================================================

  const filteredMenus = useMemo(() => {
    return restaurantMenus.filter((menu) => {
      const keyword =
        search.toLowerCase().trim();

      const matchesSearch =
        !keyword ||
        menu.name
          ?.toLowerCase()
          .includes(keyword) ||
        menu.description
          ?.toLowerCase()
          .includes(keyword) ||
        menu.slug
          ?.toLowerCase()
          .includes(keyword);

      const matchesCategory =
        !categoryFilter ||
        String(menu.category_id) ===
          String(categoryFilter);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "available" &&
          menu.is_available) ||
        (statusFilter === "unavailable" &&
          !menu.is_available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    restaurantMenus,
    search,
    categoryFilter,
    statusFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalMenus =
    restaurantMenus.length;

  const availableMenus =
    restaurantMenus.filter(
      (menu) => menu.is_available
    ).length;

  const unavailableMenus =
    restaurantMenus.filter(
      (menu) => !menu.is_available
    ).length;

  const totalCategories =
    restaurantCategories.length;

  // =========================================================
  // CATEGORY COMPOSITION
  // =========================================================

  const categoryComposition =
    useMemo(() => {
      const result = {};

      restaurantMenus.forEach((menu) => {
        const categoryName =
          getCategoryName(menu);

        if (!result[categoryName]) {
          result[categoryName] = 0;
        }

        result[categoryName]++;
      });

      return Object.entries(result)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    }, [
      restaurantMenus,
      restaurantCategories,
    ]);

  // =========================================================
  // TAMBAH MENU
  // =========================================================

  const handleOpenCreateModal = () => {
    setFormError("");

    setFormData({
      restaurant_id:
        activeRestaurantId || "",
      category_id: "",
      name: "",
      slug: "",
      description: "",
      price: "",
      image: null,
      is_available: true,
      sort_order: 0,
    });

    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    if (saving) {
      return;
    }

    setShowCreateModal(false);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    if (name === "name") {
      setFormData((current) => ({
        ...current,
        name: value,
        slug: createSlug(value),
      }));

      return;
    }

    if (name === "image") {
      setFormData((current) => ({
        ...current,
        image: files?.[0] || null,
      }));

      return;
    }

    if (type === "checkbox") {
      setFormData((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateMenu = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!activeRestaurantId) {
      setFormError(
        "Restaurant aktif tidak ditemukan. Silakan login kembali."
      );
      return;
    }

    if (!formData.category_id) {
      setFormError(
        "Silakan pilih kategori menu."
      );
      return;
    }

    if (!formData.name.trim()) {
      setFormError(
        "Nama menu wajib diisi."
      );
      return;
    }

    if (
      !formData.price ||
      Number(formData.price) < 0
    ) {
      setFormError(
        "Harga menu wajib diisi dengan benar."
      );
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append(
        "restaurant_id",
        activeRestaurantId
      );

      data.append(
        "category_id",
        formData.category_id
      );

      data.append(
        "name",
        formData.name.trim()
      );

      data.append(
        "slug",
        formData.slug ||
          createSlug(formData.name)
      );

      data.append(
        "description",
        formData.description || ""
      );

      data.append(
        "price",
        Number(formData.price)
      );

      data.append(
        "is_available",
        formData.is_available
          ? "1"
          : "0"
      );

      data.append(
        "sort_order",
        Number(formData.sort_order) || 0
      );

      if (formData.image) {
        data.append(
          "image",
          formData.image
        );
      }

      await createMenu(data);

      setShowCreateModal(false);

      setFormData({
        restaurant_id:
          activeRestaurantId || "",
        category_id: "",
        name: "",
        slug: "",
        description: "",
        price: "",
        image: null,
        is_available: true,
        sort_order: 0,
      });

      await loadData();

      alert(
        "Menu berhasil ditambahkan!"
      );
    } catch (err) {
      console.error(err);

      const backendErrors =
        err.response?.data?.errors;

      if (backendErrors) {
        const firstError =
          Object.values(
            backendErrors
          )
            .flat()
            .find(Boolean);

        setFormError(
          firstError ||
            "Gagal menambahkan menu."
        );
      } else {
        setFormError(
          err.response?.data?.message ||
            "Gagal menambahkan menu."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT MENU
  // =========================================================

  const handleOpenEditModal = (menu) => {
    setFormError("");
    setEditingMenu(menu);

    setEditFormData({
      restaurant_id:
        activeRestaurantId ||
        menu.restaurant_id ||
        menu.restaurant?.id ||
        "",
      category_id:
        menu.category_id ||
        menu.category?.id ||
        "",
      name: menu.name || "",
      slug: menu.slug || "",
      description:
        menu.description || "",
      price: menu.price || "",
      image: null,
      is_available:
        Boolean(menu.is_available),
      sort_order:
        menu.sort_order || 0,
    });

    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    if (saving) {
      return;
    }

    setShowEditModal(false);
    setEditingMenu(null);
    setFormError("");

    setEditFormData({
      restaurant_id:
        activeRestaurantId || "",
      category_id: "",
      name: "",
      slug: "",
      description: "",
      price: "",
      image: null,
      is_available: true,
      sort_order: 0,
    });
  };

  const handleEditFormChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    if (name === "name") {
      setEditFormData((current) => ({
        ...current,
        name: value,
        slug: createSlug(value),
      }));

      return;
    }

    if (name === "image") {
      setEditFormData((current) => ({
        ...current,
        image: files?.[0] || null,
      }));

      return;
    }

    if (type === "checkbox") {
      setEditFormData((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    setEditFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpdateMenu = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");

    if (!editingMenu) {
      return;
    }

    if (!activeRestaurantId) {
      setFormError(
        "Restaurant aktif tidak ditemukan. Silakan login kembali."
      );
      return;
    }

    if (!editFormData.category_id) {
      setFormError(
        "Silakan pilih kategori menu."
      );
      return;
    }

    if (!editFormData.name.trim()) {
      setFormError(
        "Nama menu wajib diisi."
      );
      return;
    }

    if (
      editFormData.price === "" ||
      Number(editFormData.price) < 0
    ) {
      setFormError(
        "Harga menu wajib diisi dengan benar."
      );
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append(
        "restaurant_id",
        activeRestaurantId
      );

      data.append(
        "category_id",
        editFormData.category_id
      );

      data.append(
        "name",
        editFormData.name.trim()
      );

      data.append(
        "slug",
        editFormData.slug ||
          createSlug(
            editFormData.name
          )
      );

      data.append(
        "description",
        editFormData.description || ""
      );

      data.append(
        "price",
        Number(editFormData.price)
      );

      data.append(
        "is_available",
        editFormData.is_available
          ? "1"
          : "0"
      );

      data.append(
        "sort_order",
        Number(
          editFormData.sort_order
        ) || 0
      );

      // Foto hanya dikirim jika user memilih foto baru
      if (editFormData.image) {
        data.append(
          "image",
          editFormData.image
        );
      }

      await updateMenu(
        editingMenu.id,
        data
      );

      setShowEditModal(false);
      setEditingMenu(null);

      await loadData();

      alert(
        "Menu berhasil diperbarui!"
      );
    } catch (err) {
      console.error(err);

      const backendErrors =
        err.response?.data?.errors;

      if (backendErrors) {
        const firstError =
          Object.values(
            backendErrors
          )
            .flat()
            .find(Boolean);

        setFormError(
          firstError ||
            "Gagal memperbarui menu."
        );
      } else {
        setFormError(
          err.response?.data?.message ||
            "Gagal memperbarui menu."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // HAPUS MENU
  // =========================================================

  const handleDelete = async (
    menu
  ) => {
    const confirmed =
      window.confirm(
        `Apakah kamu yakin ingin menghapus menu "${menu.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMenu(menu.id);

      setMenus(
        (currentMenus) =>
          currentMenus.filter(
            (item) =>
              item.id !== menu.id
          )
      );

      alert(
        "Menu berhasil dihapus!"
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Gagal menghapus menu."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-main menu-management-page">
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Memuat data menu...</p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main menu-management-page">

        {/* ================= HEADER ================= */}

        <section className="menu-page-header">
          <div>
            <span className="menu-page-eyebrow">
              MENU MANAGEMENT
            </span>

            <h1>Manajemen Menu</h1>

            <p>
              Kelola seluruh menu restaurant dari satu tempat.
            </p>
          </div>

          <button
            type="button"
            className="menu-add-button"
            onClick={
              handleOpenCreateModal
            }
          >
            <span>+</span>
            Tambah Menu
          </button>
        </section>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="menu-error">
            <strong>
              Terjadi kesalahan
            </strong>
            <span>{error}</span>
          </div>
        )}

        {/* ================= RESTAURANT AKTIF ================= */}

        {activeRestaurant && (
          <div
            className="menu-active-restaurant"
            style={{
              marginBottom: "20px",
            }}
          >
            <strong>
              Restaurant aktif:
            </strong>{" "}
            {activeRestaurant.name}
          </div>
        )}

        {/* ================= STATISTICS ================= */}

        <section className="menu-stat-grid">

          <div className="menu-stat-card">
            <div className="menu-stat-icon bowl-icon">
              🍜
            </div>

            <div className="menu-stat-content">
              <span>Total Menu</span>
              <strong>
                {totalMenus}
              </strong>
              <small>
                Semua menu
              </small>
            </div>
          </div>

          <div className="menu-stat-card">
            <div className="menu-stat-icon check-icon">
              ✓
            </div>

            <div className="menu-stat-content">
              <span>Tersedia</span>
              <strong>
                {availableMenus}
              </strong>
              <small>
                Menu aktif
              </small>
            </div>
          </div>

          <div className="menu-stat-card">
            <div className="menu-stat-icon warning-icon">
              !
            </div>

            <div className="menu-stat-content">
              <span>Habis</span>
              <strong>
                {unavailableMenus}
              </strong>
              <small>
                Tidak tersedia
              </small>
            </div>
          </div>

          <div className="menu-stat-card">
            <div className="menu-stat-icon category-icon">
              ◈
            </div>

            <div className="menu-stat-content">
              <span>Kategori</span>
              <strong>
                {totalCategories}
              </strong>
              <small>
                Kategori menu
              </small>
            </div>
          </div>

        </section>

        {/* ================= FILTER ================= */}

        <section className="menu-filter-card">

          <div className="menu-search-box">
            <span className="menu-search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Cari nama atau deskripsi menu..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Semua Kategori
            </option>

            {restaurantCategories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Semua Status
            </option>

            <option value="available">
              Tersedia
            </option>

            <option value="unavailable">
              Habis
            </option>
          </select>

        </section>

        {/* ================= MENU TABLE ================= */}

        <section className="menu-list-card">

          <div className="menu-list-header">
            <div>
              <span className="menu-list-eyebrow">
                MENU LIST
              </span>

              <h2>Daftar Menu</h2>
            </div>

            <span className="menu-count-badge">
              {filteredMenus.length} menu
            </span>
          </div>

          <div className="menu-table-wrapper">
            <table className="menu-table">

              <thead>
                <tr>
                  <th>MENU</th>
                  <th>KATEGORI</th>
                  <th>HARGA</th>
                  <th>STATUS</th>
                  <th>RESTAURANT</th>
                  <th>AKSI</th>
                </tr>
              </thead>

              <tbody>

                {filteredMenus.length > 0 ? (

                  filteredMenus.map(
                    (menu) => (

                      <tr key={menu.id}>

                        {/* MENU */}

                        <td>
                          <div className="menu-info">

                            {menu.image_url ? (
                              <img
                                src={
                                  menu.image_url
                                }
                                alt={
                                  menu.name
                                }
                                className="menu-image"
                              />
                            ) : (
                              <div className="menu-image-placeholder">
                                🍜
                              </div>
                            )}

                            <div className="menu-info-text">

                              <strong>
                                {menu.name}
                              </strong>

                              <span>
                                {menu.slug ||
                                  "-"}
                              </span>

                            </div>

                          </div>
                        </td>

                        {/* KATEGORI */}

                        <td>
                          <span className="category-badge">
                            {getCategoryName(
                              menu
                            )}
                          </span>
                        </td>

                        {/* HARGA */}

                        <td>
                          <strong className="menu-price">
                            Rp{" "}
                            {formatPrice(
                              menu.price
                            )}
                          </strong>
                        </td>

                        {/* STATUS */}

                        <td>
                          {menu.is_available ? (

                            <span className="status-badge status-available">
                              <span className="status-dot"></span>
                              Tersedia
                            </span>

                          ) : (

                            <span className="status-badge status-unavailable">
                              <span className="status-dot"></span>
                              Habis
                            </span>

                          )}
                        </td>

                        {/* RESTAURANT */}

                        <td>
                          <span className="restaurant-name">
                            {getRestaurantName(
                              menu
                            )}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <div className="menu-actions">

                            <button
                              type="button"
                              className="menu-edit-button"
                              onClick={() =>
                                handleOpenEditModal(
                                  menu
                                )
                              }
                            >
                              <span>
                                ✎
                              </span>
                              Edit
                            </button>

                            <button
                              type="button"
                              className="menu-delete-button"
                              onClick={() =>
                                handleDelete(
                                  menu
                                )
                              }
                            >
                              <span>
                                ♜
                              </span>
                              Hapus
                            </button>

                          </div>
                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>
                    <td colSpan="6">

                      <div className="menu-empty-state">

                        <div className="menu-empty-icon">
                          🍜
                        </div>

                        <h3>
                          Menu tidak ditemukan
                        </h3>

                        <p>
                          Tidak ada menu yang sesuai
                          dengan pencarian atau filter.
                        </p>

                      </div>

                    </td>
                  </tr>

                )}

              </tbody>

            </table>
          </div>

        </section>

        {/* ================= BOTTOM INFORMATION ================= */}

        <section className="menu-bottom-grid">

          {/* CATEGORY COMPOSITION */}

          <div className="menu-bottom-card">

            <div className="menu-bottom-header">
              <div>
                <span>
                  KATEGORI
                </span>

                <h3>
                  Komposisi Menu
                </h3>
              </div>
            </div>

            {categoryComposition.length > 0 ? (

              <div className="category-composition">

                {categoryComposition.map(
                  (
                    [
                      categoryName,
                      total,
                    ]
                  ) => {

                    const percentage =
                      totalMenus > 0
                        ? (total /
                            totalMenus) *
                          100
                        : 0;

                    return (
                      <div
                        className="composition-item"
                        key={
                          categoryName
                        }
                      >

                        <div className="composition-top">

                          <span>
                            {categoryName}
                          </span>

                          <strong>
                            {total}
                          </strong>

                        </div>

                        <div className="composition-bar">

                          <div
                            className="composition-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            ) : (

              <div className="small-empty">
                Belum ada data kategori.
              </div>

            )}

          </div>

          {/* QUICK SUMMARY */}

          <div className="menu-bottom-card">

            <div className="menu-bottom-header">
              <div>
                <span>
                  OVERVIEW
                </span>

                <h3>
                  Ringkasan Menu
                </h3>
              </div>
            </div>

            <div className="menu-overview">

              <div className="overview-row">
                <span>
                  Total menu
                </span>

                <strong>
                  {totalMenus}
                </strong>
              </div>

              <div className="overview-row">
                <span>
                  Menu tersedia
                </span>

                <strong>
                  {availableMenus}
                </strong>
              </div>

              <div className="overview-row">
                <span>
                  Menu habis
                </span>

                <strong>
                  {unavailableMenus}
                </strong>
              </div>

              <div className="overview-row">
                <span>
                  Kategori
                </span>

                <strong>
                  {totalCategories}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            MODAL TAMBAH MENU
        ===================================================== */}

        {showCreateModal && (

          <div
            className="menu-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                handleCloseCreateModal();
              }
            }}
          >

            <div className="menu-modal">

              <div className="menu-modal-header">

                <div>
                  <span className="menu-modal-eyebrow">
                    NEW MENU
                  </span>

                  <h2>
                    Tambah Menu
                  </h2>

                  <p>
                    Tambahkan menu baru ke restaurant.
                  </p>
                </div>

                <button
                  type="button"
                  className="menu-modal-close"
                  onClick={
                    handleCloseCreateModal
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>

              {formError && (
                <div className="menu-form-error">
                  {formError}
                </div>
              )}

              <form
                className="menu-create-form"
                onSubmit={
                  handleCreateMenu
                }
              >

                {/* RESTAURANT */}

                <div className="menu-form-group">

                  <label htmlFor="restaurant_id">
                    Restaurant
                    <span>*</span>
                  </label>

                  <select
                    id="restaurant_id"
                    name="restaurant_id"
                    value={
                      formData.restaurant_id
                    }
                    disabled
                    required
                  >

                    <option value="">
                      {activeRestaurant
                        ? activeRestaurant.name
                        : "Restaurant belum ditemukan"}
                    </option>

                  </select>

                </div>

                {/* CATEGORY */}

                <div className="menu-form-group">

                  <label htmlFor="category_id">
                    Kategori
                    <span>*</span>
                  </label>

                  <select
                    id="category_id"
                    name="category_id"
                    value={
                      formData.category_id
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                    required
                  >

                    <option value="">
                      Pilih kategori
                    </option>

                    {restaurantCategories.map(
                      (category) => (

                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* NAMA */}

                <div className="menu-form-group">

                  <label htmlFor="name">
                    Nama Menu
                    <span>*</span>
                  </label>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Contoh: Nasi Goreng Spesial"
                    disabled={saving}
                    required
                  />

                </div>

                {/* SLUG */}

                <div className="menu-form-group">

                  <label htmlFor="slug">
                    Slug
                  </label>

                  <input
                    id="slug"
                    type="text"
                    name="slug"
                    value={
                      formData.slug
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="nasi-goreng-spesial"
                    disabled={saving}
                  />

                  <small>
                    Slug otomatis dibuat dari nama menu.
                  </small>

                </div>

                {/* DESKRIPSI */}

                <div className="menu-form-group">

                  <label htmlFor="description">
                    Deskripsi
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Masukkan deskripsi menu..."
                    rows="4"
                    disabled={saving}
                  />

                </div>

                {/* HARGA + SORT */}

                <div className="menu-form-row">

                  <div className="menu-form-group">

                    <label htmlFor="price">
                      Harga
                      <span>*</span>
                    </label>

                    <div className="menu-price-input">

                      <span>
                        Rp
                      </span>

                      <input
                        id="price"
                        type="number"
                        name="price"
                        value={
                          formData.price
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="15000"
                        min="0"
                        disabled={saving}
                        required
                      />

                    </div>

                  </div>

                  <div className="menu-form-group">

                    <label htmlFor="sort_order">
                      Urutan
                    </label>

                    <input
                      id="sort_order"
                      type="number"
                      name="sort_order"
                      value={
                        formData.sort_order
                      }
                      onChange={
                        handleFormChange
                      }
                      min="0"
                      disabled={saving}
                    />

                  </div>

                </div>

                {/* IMAGE */}

                <div className="menu-form-group">

                  <label htmlFor="image">
                    Foto Menu
                  </label>

                  <input
                    id="image"
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                  />

                  <small>
                    Pilih foto menu jika tersedia.
                  </small>

                  {formData.image && (

                    <div className="menu-selected-file">
                      File dipilih:{" "}
                      <strong>
                        {
                          formData.image
                            .name
                        }
                      </strong>
                    </div>

                  )}

                </div>

                {/* STATUS */}

                <div className="menu-form-checkbox">

                  <label>

                    <input
                      type="checkbox"
                      name="is_available"
                      checked={
                        formData.is_available
                      }
                      onChange={
                        handleFormChange
                      }
                      disabled={saving}
                    />

                    <span>
                      Menu tersedia
                    </span>

                  </label>

                </div>

                {/* FOOTER */}

                <div className="menu-modal-footer">

                  <button
                    type="button"
                    className="menu-modal-cancel"
                    onClick={
                      handleCloseCreateModal
                    }
                    disabled={saving}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="menu-modal-submit"
                    disabled={
                      saving ||
                      !activeRestaurantId
                    }
                  >

                    {saving ? (
                      <>
                        <span className="menu-button-spinner"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span>
                          +
                        </span>
                        Simpan Menu
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* =====================================================
            MODAL EDIT MENU
        ===================================================== */}

        {showEditModal && (

          <div
            className="menu-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                handleCloseEditModal();
              }
            }}
          >

            <div className="menu-modal">

              {/* HEADER */}

              <div className="menu-modal-header">

                <div>
                  <span className="menu-modal-eyebrow">
                    EDIT MENU
                  </span>

                  <h2>
                    Edit Menu
                  </h2>

                  <p>
                    Ubah informasi menu yang dipilih.
                  </p>
                </div>

                <button
                  type="button"
                  className="menu-modal-close"
                  onClick={
                    handleCloseEditModal
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>

              {/* ERROR */}

              {formError && (

                <div className="menu-form-error">
                  {formError}
                </div>

              )}

              {/* FORM */}

              <form
                className="menu-create-form"
                onSubmit={
                  handleUpdateMenu
                }
              >

                {/* RESTAURANT */}

                <div className="menu-form-group">

                  <label htmlFor="edit_restaurant_id">
                    Restaurant
                    <span>*</span>
                  </label>

                  <select
                    id="edit_restaurant_id"
                    name="restaurant_id"
                    value={
                      editFormData.restaurant_id
                    }
                    disabled
                    required
                  >

                    <option value="">
                      {activeRestaurant
                        ? activeRestaurant.name
                        : "Restaurant belum ditemukan"}
                    </option>

                  </select>

                </div>

                {/* CATEGORY */}

                <div className="menu-form-group">

                  <label htmlFor="edit_category_id">
                    Kategori
                    <span>*</span>
                  </label>

                  <select
                    id="edit_category_id"
                    name="category_id"
                    value={
                      editFormData.category_id
                    }
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                    required
                  >

                    <option value="">
                      Pilih kategori
                    </option>

                    {restaurantCategories.map(
                      (category) => (

                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* NAMA */}

                <div className="menu-form-group">

                  <label htmlFor="edit_name">
                    Nama Menu
                    <span>*</span>
                  </label>

                  <input
                    id="edit_name"
                    type="text"
                    name="name"
                    value={
                      editFormData.name
                    }
                    onChange={
                      handleEditFormChange
                    }
                    placeholder="Contoh: Nasi Goreng Spesial"
                    disabled={saving}
                    required
                  />

                </div>

                {/* SLUG */}

                <div className="menu-form-group">

                  <label htmlFor="edit_slug">
                    Slug
                  </label>

                  <input
                    id="edit_slug"
                    type="text"
                    name="slug"
                    value={
                      editFormData.slug
                    }
                    onChange={
                      handleEditFormChange
                    }
                    placeholder="nasi-goreng-spesial"
                    disabled={saving}
                  />

                  <small>
                    Slug otomatis dibuat dari nama menu.
                  </small>

                </div>

                {/* DESKRIPSI */}

                <div className="menu-form-group">

                  <label htmlFor="edit_description">
                    Deskripsi
                  </label>

                  <textarea
                    id="edit_description"
                    name="description"
                    value={
                      editFormData.description
                    }
                    onChange={
                      handleEditFormChange
                    }
                    placeholder="Masukkan deskripsi menu..."
                    rows="4"
                    disabled={saving}
                  />

                </div>

                {/* HARGA + SORT */}

                <div className="menu-form-row">

                  <div className="menu-form-group">

                    <label htmlFor="edit_price">
                      Harga
                      <span>*</span>
                    </label>

                    <div className="menu-price-input">

                      <span>
                        Rp
                      </span>

                      <input
                        id="edit_price"
                        type="number"
                        name="price"
                        value={
                          editFormData.price
                        }
                        onChange={
                          handleEditFormChange
                        }
                        placeholder="15000"
                        min="0"
                        disabled={saving}
                        required
                      />

                    </div>

                  </div>

                  <div className="menu-form-group">

                    <label htmlFor="edit_sort_order">
                      Urutan
                    </label>

                    <input
                      id="edit_sort_order"
                      type="number"
                      name="sort_order"
                      value={
                        editFormData.sort_order
                      }
                      onChange={
                        handleEditFormChange
                      }
                      min="0"
                      disabled={saving}
                    />

                  </div>

                </div>

                {/* FOTO LAMA */}

                {editingMenu?.image_url && (

                  <div className="menu-form-group">

                    <label>
                      Foto Saat Ini
                    </label>

                    <div>
                      <img
                        src={
                          editingMenu.image_url
                        }
                        alt={
                          editingMenu.name
                        }
                        className="menu-edit-preview"
                      />
                    </div>

                  </div>

                )}

                {/* FOTO BARU */}

                <div className="menu-form-group">

                  <label htmlFor="edit_image">
                    Ganti Foto Menu
                  </label>

                  <input
                    id="edit_image"
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={
                      handleEditFormChange
                    }
                    disabled={saving}
                  />

                  <small>
                    Kosongkan jika tidak ingin mengganti foto.
                  </small>

                  {editFormData.image && (

                    <div className="menu-selected-file">
                      Foto baru:{" "}
                      <strong>
                        {
                          editFormData
                            .image.name
                        }
                      </strong>
                    </div>

                  )}

                </div>

                {/* STATUS */}

                <div className="menu-form-checkbox">

                  <label>

                    <input
                      type="checkbox"
                      name="is_available"
                      checked={
                        editFormData.is_available
                      }
                      onChange={
                        handleEditFormChange
                      }
                      disabled={saving}
                    />

                    <span>
                      Menu tersedia
                    </span>

                  </label>

                </div>

                {/* FOOTER */}

                <div className="menu-modal-footer">

                  <button
                    type="button"
                    className="menu-modal-cancel"
                    onClick={
                      handleCloseEditModal
                    }
                    disabled={saving}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="menu-modal-submit"
                    disabled={
                      saving ||
                      !activeRestaurantId
                    }
                  >

                    {saving ? (
                      <>
                        <span className="menu-button-spinner"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span>
                          ✓
                        </span>
                        Simpan Perubahan
                      </>
                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </main>
    </div>
  );
}

export default MenuManagementPage;
