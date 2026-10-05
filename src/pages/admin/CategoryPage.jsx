import { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

import { getAdminMenus } from "../../services/menuService";

function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // RESTORAN AKTIF
  // ==================================================

  const [activeRestaurant, setActiveRestaurant] =
    useState(null);

  // ==================================================
  // TAMBAH KATEGORI
  // ==================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [formData, setFormData] = useState({
    restaurant_id: "",
    name: "",
    slug: "",
    description: "",
    sort_order: 0,
  });

  // ==================================================
  // EDIT KATEGORI
  // ==================================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [editSaving, setEditSaving] =
    useState(false);

  const [editError, setEditError] =
    useState("");

  const [editFormData, setEditFormData] = useState({
    restaurant_id: "",
    name: "",
    slug: "",
    description: "",
    sort_order: 0,
  });

  // ==================================================
  // HAPUS KATEGORI
  // ==================================================

  const [deleting, setDeleting] =
    useState(false);

  // ==================================================
  // AMBIL RESTORAN AKTIF
  // ==================================================

  const getActiveRestaurant = () => {
    // ==================================================
    // 1. PRIORITAS UTAMA:
    //    ADMIN USER YANG SEDANG LOGIN
    // ==================================================

    const savedUser =
      localStorage.getItem("adminUser");

    if (savedUser) {
      try {
        const adminUser =
          JSON.parse(savedUser);

        if (adminUser?.restaurant_id) {
          let restaurant = null;

          // Ambil data restaurant jika ada
          const savedRestaurant =
            localStorage.getItem(
              "adminRestaurant"
            );

          if (savedRestaurant) {
            try {
              const parsedRestaurant =
                JSON.parse(
                  savedRestaurant
                );

              // Hanya gunakan data restaurant
              // jika ID-nya sama dengan akun admin
              if (
                Number(
                  parsedRestaurant?.id
                ) ===
                Number(
                  adminUser.restaurant_id
                )
              ) {
                restaurant =
                  parsedRestaurant;
              }
            } catch (error) {
              console.error(
                "Gagal membaca adminRestaurant:",
                error
              );
            }
          }

          return {
            id: Number(
              adminUser.restaurant_id
            ),
            name:
              restaurant?.name ||
              adminUser?.restaurant?.name ||
              "Restoran",
          };
        }
      } catch (error) {
        console.error(
          "Gagal membaca adminUser:",
          error
        );
      }
    }

    // ==================================================
    // 2. FALLBACK:
    //    ADMIN RESTAURANT
    // ==================================================

    const savedRestaurant =
      localStorage.getItem(
        "adminRestaurant"
      );

    if (savedRestaurant) {
      try {
        const restaurant =
          JSON.parse(
            savedRestaurant
          );

        if (restaurant?.id) {
          return {
            ...restaurant,
            id: Number(
              restaurant.id
            ),
          };
        }
      } catch (error) {
        console.error(
          "Gagal membaca adminRestaurant:",
          error
        );
      }
    }

    return null;
  };

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    const restaurant =
      getActiveRestaurant();

    console.log(
      "================================="
    );

    console.log(
      "Restoran aktif CategoryPage:",
      restaurant
    );

    console.log(
      "Admin User:",
      JSON.parse(
        localStorage.getItem(
          "adminUser"
        ) || "null"
      )
    );

    console.log(
      "Admin Restaurant:",
      JSON.parse(
        localStorage.getItem(
          "adminRestaurant"
        ) || "null"
      )
    );

    console.log(
      "================================="
    );

    setActiveRestaurant(
      restaurant
    );

    loadCategories(
      restaurant
    );
  }, []);

  const loadCategories = async (
    restaurant = getActiveRestaurant()
  ) => {
    try {
      setLoading(true);

      // ==================================================
      // CEK RESTORAN AKTIF
      // ==================================================

      if (!restaurant?.id) {
        console.error(
          "Restaurant ID tidak ditemukan."
        );

        setCategories([]);
        setMenus([]);

        return;
      }

      const restaurantId =
        Number(restaurant.id);

      console.log(
        "Restaurant ID yang digunakan CategoryPage:",
        restaurantId
      );

      // ==================================================
      // AMBIL KATEGORI DAN MENU
      // ==================================================

      const [
        categoryResponse,
        menuResponse,
      ] = await Promise.all([
        getAdminCategories(),
        getAdminMenus(),
      ]);

      console.log(
        "Data kategori dari API:",
        categoryResponse
      );

      console.log(
        "Data menu dari API:",
        menuResponse
      );

      // ==================================================
      // NORMALISASI DATA KATEGORI
      // ==================================================

      let categoryData = [];

      if (
        Array.isArray(
          categoryResponse
        )
      ) {
        categoryData =
          categoryResponse;
      } else if (
        Array.isArray(
          categoryResponse?.data
        )
      ) {
        categoryData =
          categoryResponse.data;
      } else if (
        Array.isArray(
          categoryResponse?.categories
        )
      ) {
        categoryData =
          categoryResponse.categories;
      } else if (
        Array.isArray(
          categoryResponse?.data?.data
        )
      ) {
        categoryData =
          categoryResponse.data.data;
      } else if (
        Array.isArray(
          categoryResponse?.data?.categories
        )
      ) {
        categoryData =
          categoryResponse.data.categories;
      }

      // ==================================================
      // NORMALISASI DATA MENU
      // ==================================================

      let menuData = [];

      if (
        Array.isArray(
          menuResponse
        )
      ) {
        menuData =
          menuResponse;
      } else if (
        Array.isArray(
          menuResponse?.data
        )
      ) {
        menuData =
          menuResponse.data;
      } else if (
        Array.isArray(
          menuResponse?.menus
        )
      ) {
        menuData =
          menuResponse.menus;
      } else if (
        Array.isArray(
          menuResponse?.data?.data
        )
      ) {
        menuData =
          menuResponse.data.data;
      } else if (
        Array.isArray(
          menuResponse?.data?.menus
        )
      ) {
        menuData =
          menuResponse.data.menus;
      }

      // ==================================================
      // FILTER KATEGORI
      // BERDASARKAN RESTORAN AKTIF
      // ==================================================

      const filteredCategories =
        categoryData.filter(
          (category) => {
            const categoryRestaurantId =
              category?.restaurant_id ??
              category?.restaurant?.id;

            if (
              categoryRestaurantId !==
                undefined &&
              categoryRestaurantId !==
                null
            ) {
              return (
                Number(
                  categoryRestaurantId
                ) ===
                restaurantId
              );
            }

            return true;
          }
        );

      // ==================================================
      // FILTER MENU
      // BERDASARKAN RESTORAN AKTIF
      // ==================================================

      const filteredMenus =
        menuData.filter(
          (menu) => {
            const menuRestaurantId =
              menu?.restaurant_id ??
              menu?.restaurant?.id;

            if (
              menuRestaurantId !==
                undefined &&
              menuRestaurantId !==
                null
            ) {
              return (
                Number(
                  menuRestaurantId
                ) ===
                restaurantId
              );
            }

            return true;
          }
        );

      // ==================================================
      // HASIL FILTER
      // ==================================================

      console.log(
        "================================="
      );

      console.log(
        "Restaurant ID aktif:",
        restaurantId
      );

      console.log(
        "Kategori setelah filter:",
        filteredCategories
      );

      console.log(
        "Jumlah kategori:",
        filteredCategories.length
      );

      console.log(
        "Menu setelah filter:",
        filteredMenus
      );

      console.log(
        "Jumlah menu:",
        filteredMenus.length
      );

      console.log(
        "================================="
      );

      setCategories(
        filteredCategories
      );

      setMenus(
        filteredMenus
      );
    } catch (error) {
      console.error(
        "Gagal mengambil data:",
        error
      );

      setCategories([]);
      setMenus([]);

      alert(
        "Gagal mengambil data kategori dan menu."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // GENERATE SLUG
  // ==================================================

  const generateSlug = (
    value
  ) => {
    return value
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      );
  };

  // ==================================================
  // FORM TAMBAH
  // ==================================================

  const handleFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (
      name === "name"
    ) {
      setFormData(
        (currentData) => ({
          ...currentData,
          name: value,
          slug: generateSlug(
            value
          ),
        })
      );

      return;
    }

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value,
      })
    );
  };

  // ==================================================
  // FORM EDIT
  // ==================================================

  const handleEditFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (
      name === "name"
    ) {
      setEditFormData(
        (currentData) => ({
          ...currentData,
          name: value,
          slug: generateSlug(
            value
          ),
        })
      );

      return;
    }

    setEditFormData(
      (currentData) => ({
        ...currentData,
        [name]: value,
      })
    );
  };

  // ==================================================
  // BUKA MODAL TAMBAH
  // ==================================================

  const handleOpenAddModal = () => {
    const restaurant =
      getActiveRestaurant();

    if (!restaurant?.id) {
      alert(
        "Restoran aktif tidak ditemukan."
      );

      return;
    }

    setActiveRestaurant(
      restaurant
    );

    setFormData({
      restaurant_id:
        Number(
          restaurant.id
        ),
      name: "",
      slug: "",
      description: "",
      sort_order:
        categories.length + 1,
    });

    setFormError("");
    setShowAddModal(true);
  };

  // ==================================================
  // TUTUP MODAL TAMBAH
  // ==================================================

  const handleCloseAddModal = () => {
    if (saving) return;

    setShowAddModal(false);
    setFormError("");
  };

  // ==================================================
  // SIMPAN KATEGORI
  // ==================================================

  const handleCreateCategory =
    async (event) => {
      event.preventDefault();

      setFormError("");

      const restaurant =
        getActiveRestaurant();

      if (!restaurant?.id) {
        setFormError(
          "Restoran aktif tidak ditemukan."
        );

        return;
      }

      if (
        !formData.name.trim()
      ) {
        setFormError(
          "Nama kategori wajib diisi."
        );

        return;
      }

      if (
        !formData.slug.trim()
      ) {
        setFormError(
          "Slug kategori wajib diisi."
        );

        return;
      }

      try {
        setSaving(true);

        const categoryData = {
          restaurant_id:
            Number(
              restaurant.id
            ),

          name:
            formData.name.trim(),

          slug:
            formData.slug.trim(),

          description:
            formData.description.trim(),

          sort_order:
            Number(
              formData.sort_order
            ),
        };

        console.log(
          "Data kategori yang ditambahkan:",
          categoryData
        );

        await createCategory(
          categoryData
        );

        setShowAddModal(false);

        setFormData({
          restaurant_id:
            Number(
              restaurant.id
            ),
          name: "",
          slug: "",
          description: "",
          sort_order: 0,
        });

        await loadCategories(
          restaurant
        );

        alert(
          "Kategori berhasil ditambahkan."
        );
      } catch (error) {
        console.error(
          "Gagal menambahkan kategori:",
          error
        );

        if (
          error.response?.data
            ?.errors
        ) {
          const errors =
            error.response.data
              .errors;

          const firstError =
            Object.values(errors)
              .flat()
              .find(Boolean);

          setFormError(
            firstError ||
              "Data kategori tidak valid."
          );
        } else if (
          error.response?.data
            ?.message
        ) {
          setFormError(
            error.response.data
              .message
          );
        } else {
          setFormError(
            "Gagal menambahkan kategori. Silakan coba lagi."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  // ==================================================
  // BUKA MODAL EDIT
  // ==================================================

  const handleOpenEditModal = (
    category
  ) => {
    const restaurant =
      getActiveRestaurant();

    if (!restaurant?.id) {
      alert(
        "Restoran aktif tidak ditemukan."
      );

      return;
    }

    setActiveRestaurant(
      restaurant
    );

    setEditingCategory(
      category
    );

    setEditFormData({
      restaurant_id:
        Number(
          restaurant.id
        ),

      name:
        category.name || "",

      slug:
        category.slug || "",

      description:
        category.description ||
        "",

      sort_order:
        category.sort_order ??
        category.order ??
        0,
    });

    setEditError("");
    setShowEditModal(true);
  };

  // ==================================================
  // TUTUP MODAL EDIT
  // ==================================================

  const handleCloseEditModal = () => {
    if (editSaving) return;

    setShowEditModal(false);
    setEditingCategory(null);
    setEditError("");
  };

  // ==================================================
  // UPDATE KATEGORI
  // ==================================================

  const handleUpdateCategory =
    async (event) => {
      event.preventDefault();

      setEditError("");

      if (!editingCategory) {
        setEditError(
          "Kategori tidak ditemukan."
        );

        return;
      }

      const restaurant =
        getActiveRestaurant();

      if (!restaurant?.id) {
        setEditError(
          "Restoran aktif tidak ditemukan."
        );

        return;
      }

      if (
        !editFormData.name.trim()
      ) {
        setEditError(
          "Nama kategori wajib diisi."
        );

        return;
      }

      if (
        !editFormData.slug.trim()
      ) {
        setEditError(
          "Slug kategori wajib diisi."
        );

        return;
      }

      try {
        setEditSaving(true);

        const categoryData = {
          restaurant_id:
            Number(
              restaurant.id
            ),

          name:
            editFormData.name.trim(),

          slug:
            editFormData.slug.trim(),

          description:
            editFormData.description.trim(),

          sort_order:
            Number(
              editFormData.sort_order
            ),
        };

        console.log(
          "Data kategori yang diperbarui:",
          categoryData
        );

        await updateCategory(
          editingCategory.id,
          categoryData
        );

        setShowEditModal(false);
        setEditingCategory(null);

        await loadCategories(
          restaurant
        );

        alert(
          "Kategori berhasil diperbarui."
        );
      } catch (error) {
        console.error(
          "Gagal memperbarui kategori:",
          error
        );

        if (
          error.response?.data
            ?.errors
        ) {
          const errors =
            error.response.data
              .errors;

          const firstError =
            Object.values(errors)
              .flat()
              .find(Boolean);

          setEditError(
            firstError ||
              "Data kategori tidak valid."
          );
        } else if (
          error.response?.data
            ?.message
        ) {
          setEditError(
            error.response.data
              .message
          );
        } else {
          setEditError(
            "Gagal memperbarui kategori. Silakan coba lagi."
          );
        }
      } finally {
        setEditSaving(false);
      }
    };

  // ==================================================
  // HITUNG JUMLAH MENU DALAM KATEGORI
  // ==================================================

  const getMenuCount = (
    category
  ) => {
    return menus.filter(
      (menu) => {
        const menuCategoryId =
          menu.category_id ??
          menu.category?.id ??
          menu.category?.category_id;

        const menuCategoryName =
          menu.category?.name ??
          menu.category_name;

        const sameCategoryId =
          menuCategoryId !==
            undefined &&
          menuCategoryId !==
            null &&
          Number(
            menuCategoryId
          ) ===
            Number(
              category.id
            );

        const sameCategoryName =
          menuCategoryName &&
          category.name &&
          menuCategoryName
            .toString()
            .trim()
            .toLowerCase() ===
            category.name
              .toString()
              .trim()
              .toLowerCase();

        return (
          sameCategoryId ||
          sameCategoryName
        );
      }
    ).length;
  };

  // ==================================================
  // HAPUS KATEGORI
  // ==================================================

  const handleDeleteCategory =
    async (category) => {
      const confirmed =
        window.confirm(
          `Apakah kamu yakin ingin menghapus kategori "${category.name}"?`
        );

      if (!confirmed) {
        return;
      }

      const restaurant =
        getActiveRestaurant();

      if (!restaurant?.id) {
        alert(
          "Restoran aktif tidak ditemukan."
        );

        return;
      }

      // ==================================================
      // CEK MENU TERLEBIH DAHULU
      // ==================================================

      const menuCount =
        getMenuCount(category);

      if (menuCount > 0) {
        alert(
          `Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${menuCount} menu.\n\n` +
          `Silakan hapus atau pindahkan menu tersebut ke kategori lain terlebih dahulu.`
        );

        return;
      }

      try {
        setDeleting(true);

        await deleteCategory(
          category.id
        );

        await loadCategories(
          restaurant
        );

        alert(
          "Kategori berhasil dihapus."
        );
      } catch (error) {
        console.error(
          "Gagal menghapus kategori:",
          error
        );

        const status =
          error.response?.status;

        const message =
          error.response?.data?.message ||
          "";

        const errorText =
          error.response?.data?.error ||
          "";

        const fullErrorMessage =
          `${message} ${errorText}`.toLowerCase();

        // ==================================================
        // KATEGORI MASIH DIGUNAKAN DATA LAIN
        // ==================================================

        if (
          status === 409 ||
          fullErrorMessage.includes(
            "foreign key"
          ) ||
          fullErrorMessage.includes(
            "integrity constraint violation"
          ) ||
          fullErrorMessage.includes(
            "menus_category_id_foreign"
          )
        ) {
          alert(
            `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh data lain.`
          );

          return;
        }

        if (message) {
          alert(message);
        } else {
          alert(
            "Gagal menghapus kategori. Silakan coba lagi."
          );
        }
      } finally {
        setDeleting(false);
      }
    };

  // ==================================================
  // STATISTIK
  // ==================================================

  const totalCategories =
    categories.length;

  const totalMenus =
    menus.length;

  const categoryWithMostMenus =
    [...categories].sort(
      (a, b) =>
        getMenuCount(b) -
        getMenuCount(a)
    )[0];

  const mostMenusCount =
    categoryWithMostMenus
      ? getMenuCount(
          categoryWithMostMenus
        )
      : 0;

  const getCategoryOrder = (
    category,
    index
  ) => {
    return (
      category.sort_order ??
      category.order ??
      index + 1
    );
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor:
          "#f7f5f6",
      }}
    >
      {/* SIDEBAR */}

      <AdminSidebar />

      {/* MAIN */}

      <main
        style={{
          marginLeft: "240px",
          width:
            "calc(100% - 240px)",
          minHeight: "100vh",
          padding: "32px",
          boxSizing:
            "border-box",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize:
                  "28px",
                fontWeight:
                  "700",
                color:
                  "#211b1d",
              }}
            >
              Kategori
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                color:
                  "#777",
                fontSize:
                  "14px",
              }}
            >
              Kelola kategori menu{" "}
              {activeRestaurant?.name ||
                "restoran"}
              .
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleOpenAddModal
            }
            style={
              primaryButtonStyle
            }
          >
            + Tambah Kategori
          </button>
        </div>

        {/* LOADING */}

        {loading ? (
          <div
            style={{
              backgroundColor:
                "#fff",
              border:
                "1px solid #eee",
              borderRadius:
                "14px",
              padding:
                "50px",
              textAlign:
                "center",
              color:
                "#777",
            }}
          >
            Memuat data
            kategori...
          </div>
        ) : (
          <>
            {/* ==================================================
                STATISTIK
            ================================================== */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "20px",
                marginBottom:
                  "24px",
              }}
            >
              <StatCard
                label="Total Kategori"
                value={
                  totalCategories
                }
                description="Kategori menu yang tersedia"
              />

              <StatCard
                label="Total Menu"
                value={
                  totalMenus
                }
                description="Seluruh menu restoran"
              />

              <StatCard
                label="Kategori Terbanyak"
                value={
                  categoryWithMostMenus
                    ?.name ||
                  "-"
                }
                description={`${mostMenusCount} menu`}
                small
              />
            </div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "2fr 1fr",
                gap: "24px",
              }}
            >
              {/* ==================================================
                  DAFTAR KATEGORI
              ================================================== */}

              <div
                style={{
                  backgroundColor:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "14px",
                  overflow:
                    "hidden",
                }}
              >
                <div
                  style={{
                    padding:
                      "20px 22px",
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "18px",
                      fontWeight:
                        "700",
                      color:
                        "#211b1d",
                    }}
                  >
                    Daftar Kategori
                  </h2>

                  <p
                    style={{
                      margin:
                        "6px 0 0",
                      fontSize:
                        "12px",
                      color:
                        "#888",
                    }}
                  >
                    Kelola kategori
                    menu{" "}
                    {activeRestaurant?.name ||
                      "restoran"}
                    .
                  </p>
                </div>

                {categories.length ===
                0 ? (
                  <div
                    style={{
                      padding:
                        "40px",
                      textAlign:
                        "center",
                      color:
                        "#888",
                      fontSize:
                        "13px",
                    }}
                  >
                    Belum ada
                    kategori.
                  </div>
                ) : (
                  <div
                    style={{
                      overflowX:
                        "auto",
                    }}
                  >
                    <table
                      style={{
                        width:
                          "100%",
                        borderCollapse:
                          "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor:
                              "#faf9f9",
                            textAlign:
                              "left",
                          }}
                        >
                          <th
                            style={
                              tableHeaderStyle
                            }
                          >
                            Kategori
                          </th>

                          <th
                            style={
                              tableHeaderStyle
                            }
                          >
                            Jumlah Menu
                          </th>

                          <th
                            style={{
                              ...tableHeaderStyle,
                              textAlign:
                                "center",
                            }}
                          >
                            Urutan
                          </th>

                          <th
                            style={{
                              ...tableHeaderStyle,
                              textAlign:
                                "center",
                            }}
                          >
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {categories.map(
                          (
                            category,
                            index
                          ) => {
                            const menuCount =
                              getMenuCount(
                                category
                              );

                            return (
                              <tr
                                key={
                                  category.id
                                }
                              >
                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "12px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width:
                                          "42px",
                                        height:
                                          "42px",
                                        borderRadius:
                                          "9px",
                                        backgroundColor:
                                          "#f4e8eb",
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "center",
                                        color:
                                          "#8f2638",
                                        fontWeight:
                                          "700",
                                        fontSize:
                                          "14px",
                                        flexShrink:
                                          0,
                                      }}
                                    >
                                      {category.name
                                        ?.charAt(
                                          0
                                        )
                                        ?.toUpperCase() ||
                                        "?"}
                                    </div>

                                    <div>
                                      <strong
                                        style={{
                                          display:
                                            "block",
                                          fontSize:
                                            "13px",
                                          color:
                                            "#211b1d",
                                        }}
                                      >
                                        {category.name ||
                                          "-"}
                                      </strong>

                                      <span
                                        style={{
                                          display:
                                            "block",
                                          marginTop:
                                            "3px",
                                          fontSize:
                                            "11px",
                                          color:
                                            "#999",
                                        }}
                                      >
                                        {category.description ||
                                          "Tidak ada deskripsi."}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  <strong
                                    style={{
                                      fontSize:
                                        "13px",
                                      color:
                                        "#211b1d",
                                    }}
                                  >
                                    {
                                      menuCount
                                    }
                                  </strong>

                                  <span
                                    style={{
                                      marginLeft:
                                        "4px",
                                      fontSize:
                                        "11px",
                                      color:
                                        "#999",
                                    }}
                                  >
                                    menu
                                  </span>
                                </td>

                                <td
                                  style={{
                                    ...tableCellStyle,
                                    textAlign:
                                      "center",
                                  }}
                                >
                                  {getCategoryOrder(
                                    category,
                                    index
                                  )}
                                </td>

                                <td
                                  style={{
                                    ...tableCellStyle,
                                    textAlign:
                                      "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "center",
                                      gap:
                                        "7px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenEditModal(
                                          category
                                        )
                                      }
                                      style={
                                        actionButtonStyle
                                      }
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteCategory(
                                          category
                                        )
                                      }
                                      disabled={
                                        deleting
                                      }
                                      style={{
                                        ...actionButtonStyle,
                                        color:
                                          "#8f2638",
                                      }}
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ==================================================
                  KOMPOSISI KATEGORI
              ================================================== */}

              <div
                style={{
                  backgroundColor:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "14px",
                  padding:
                    "22px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "18px",
                    fontWeight:
                      "700",
                    color:
                      "#211b1d",
                  }}
                >
                  Komposisi Kategori
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 22px",
                    fontSize:
                      "12px",
                    color:
                      "#888",
                  }}
                >
                  Distribusi menu
                  berdasarkan
                  kategori.
                </p>

                {categories.map(
                  (category) => {
                    const menuCount =
                      getMenuCount(
                        category
                      );

                    const percentage =
                      totalMenus > 0
                        ? Math.round(
                            (menuCount /
                              totalMenus) *
                              100
                          )
                        : 0;

                    return (
                      <CategoryProgress
                        key={
                          category.id
                        }
                        name={
                          category.name ||
                          "-"
                        }
                        total={`${menuCount} menu`}
                        percentage={`${percentage}%`}
                      />
                    );
                  }
                )}

                <div
                  style={{
                    marginTop:
                      "25px",
                    padding:
                      "16px",
                    borderRadius:
                      "10px",
                    backgroundColor:
                      "#f7f5f6",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#888",
                    }}
                  >
                    Kategori dengan
                    menu terbanyak
                  </span>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      fontSize:
                        "16px",
                      color:
                        "#211b1d",
                    }}
                  >
                    {categoryWithMostMenus
                      ?.name ||
                      "-"}
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "3px",
                      fontSize:
                        "11px",
                      color:
                        "#777",
                    }}
                  >
                    {totalMenus >
                    0
                      ? `${Math.round(
                          (mostMenusCount /
                            totalMenus) *
                            100
                        )}% dari seluruh menu`
                      : "Belum ada menu"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ==================================================
          MODAL TAMBAH
      ================================================== */}

      {showAddModal && (
        <ModalOverlay
          onClose={
            handleCloseAddModal
          }
        >
          <ModalHeader
            label="TAMBAH KATEGORI"
            title="Tambah Kategori"
            description="Tambahkan kategori baru untuk menu restoran."
          />

          <form
            onSubmit={
              handleCreateCategory
            }
          >
            <div
              style={
                modalBodyStyle
              }
            >
              {formError && (
                <ErrorMessage
                  message={
                    formError
                  }
                />
              )}

              <FormField
                label="Nama Kategori"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleFormChange
                }
                placeholder="Contoh: Makanan"
                disabled={
                  saving
                }
              />

              <FormField
                label="Slug"
                name="slug"
                value={
                  formData.slug
                }
                onChange={
                  handleFormChange
                }
                placeholder="makanan"
                disabled={
                  saving
                }
              />

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label
                  style={
                    formLabelStyle
                  }
                >
                  Deskripsi
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Deskripsi singkat kategori..."
                  rows="3"
                  disabled={
                    saving
                  }
                  style={{
                    ...formInputStyle,
                    resize:
                      "vertical",
                    minHeight:
                      "80px",
                  }}
                />
              </div>

              <FormField
                label="Urutan"
                name="sort_order"
                type="number"
                value={
                  formData.sort_order
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  saving
                }
              />
            </div>

            <ModalFooter
              onCancel={
                handleCloseAddModal
              }
              loading={
                saving
              }
              loadingText="Menyimpan..."
              submitText="Simpan Kategori"
            />
          </form>
        </ModalOverlay>
      )}

      {/* ==================================================
          MODAL EDIT
      ================================================== */}

      {showEditModal && (
        <ModalOverlay
          onClose={
            handleCloseEditModal
          }
        >
          <ModalHeader
            label="EDIT KATEGORI"
            title="Edit Kategori"
            description="Perbarui informasi kategori menu."
          />

          <form
            onSubmit={
              handleUpdateCategory
            }
          >
            <div
              style={
                modalBodyStyle
              }
            >
              {editError && (
                <ErrorMessage
                  message={
                    editError
                  }
                />
              )}

              <FormField
                label="Nama Kategori"
                name="name"
                value={
                  editFormData.name
                }
                onChange={
                  handleEditFormChange
                }
                placeholder="Contoh: Makanan"
                disabled={
                  editSaving
                }
              />

              <FormField
                label="Slug"
                name="slug"
                value={
                  editFormData.slug
                }
                onChange={
                  handleEditFormChange
                }
                placeholder="makanan"
                disabled={
                  editSaving
                }
              />

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >
                <label
                  style={
                    formLabelStyle
                  }
                >
                  Deskripsi
                </label>

                <textarea
                  name="description"
                  value={
                    editFormData.description
                  }
                  onChange={
                    handleEditFormChange
                  }
                  placeholder="Deskripsi singkat kategori..."
                  rows="3"
                  disabled={
                    editSaving
                  }
                  style={{
                    ...formInputStyle,
                    resize:
                      "vertical",
                    minHeight:
                      "80px",
                  }}
                />
              </div>

              <FormField
                label="Urutan"
                name="sort_order"
                type="number"
                value={
                  editFormData.sort_order
                }
                onChange={
                  handleEditFormChange
                }
                disabled={
                  editSaving
                }
              />
            </div>

            <ModalFooter
              onCancel={
                handleCloseEditModal
              }
              loading={
                editSaving
              }
              loadingText="Menyimpan..."
              submitText="Simpan Perubahan"
            />
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ==================================================
// STAT CARD
// ==================================================

function StatCard({
  label,
  value,
  description,
  small = false,
}) {
  return (
    <div
      style={
        statCardStyle
      }
    >
      <span
        style={
          statLabelStyle
        }
      >
        {label}
      </span>

      <h2
        style={{
          ...statValueStyle,
          fontSize: small
            ? "21px"
            : "28px",
        }}
      >
        {value}
      </h2>

      <span
        style={
          statDescriptionStyle
        }
      >
        {description}
      </span>
    </div>
  );
}

// ==================================================
// PROGRESS KATEGORI
// ==================================================

function CategoryProgress({
  name,
  total,
  percentage,
}) {
  return (
    <div
      style={{
        marginBottom:
          "17px",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          marginBottom:
            "7px",
        }}
      >
        <span
          style={{
            fontSize:
              "12px",
            color:
              "#555",
          }}
        >
          {name}
        </span>

        <span
          style={{
            fontSize:
              "11px",
            color:
              "#888",
          }}
        >
          {total}
        </span>
      </div>

      <div
        style={{
          height: "7px",
          backgroundColor:
            "#eee",
          borderRadius:
            "10px",
          overflow:
            "hidden",
        }}
      >
        <div
          style={{
            width:
              percentage,
            height:
              "100%",
            backgroundColor:
              "#8f2638",
            borderRadius:
              "10px",
          }}
        />
      </div>
    </div>
  );
}

// ==================================================
// MODAL OVERLAY
// ==================================================

function ModalOverlay({
  children,
  onClose,
}) {
  return (
    <div
      style={{
        position:
          "fixed",
        inset: 0,
        backgroundColor:
          "rgba(33, 27, 29, 0.45)",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        zIndex: 9999,
        padding:
          "20px",
      }}
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width:
            "100%",
          maxWidth:
            "520px",
          backgroundColor:
            "#fff",
          borderRadius:
            "16px",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.15)",
          overflow:
            "hidden",
        }}
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}

// ==================================================
// MODAL HEADER
// ==================================================

function ModalHeader({
  label,
  title,
  description,
}) {
  return (
    <div
      style={{
        padding:
          "22px 24px",
        borderBottom:
          "1px solid #eee",
      }}
    >
      <span
        style={{
          fontSize:
            "10px",
          fontWeight:
            "700",
          color:
            "#8f2638",
          letterSpacing:
            "0.08em",
        }}
      >
        {label}
      </span>

      <h2
        style={{
          margin:
            "6px 0 0",
          fontSize:
            "21px",
          fontWeight:
            "700",
          color:
            "#211b1d",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin:
            "6px 0 0",
          fontSize:
            "12px",
          color:
            "#888",
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ==================================================
// MODAL FOOTER
// ==================================================

function ModalFooter({
  onCancel,
  loading,
  loadingText,
  submitText,
}) {
  return (
    <div
      style={{
        padding:
          "16px 24px",
        borderTop:
          "1px solid #eee",
        display:
          "flex",
        justifyContent:
          "flex-end",
        gap: "10px",
      }}
    >
      <button
        type="button"
        onClick={
          onCancel
        }
        disabled={
          loading
        }
        style={
          secondaryButtonStyle
        }
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={
          loading
        }
        style={{
          ...primaryButtonStyle,
          backgroundColor:
            loading
              ? "#b87985"
              : "#8f2638",
        }}
      >
        {loading
          ? loadingText
          : submitText}
      </button>
    </div>
  );
}

// ==================================================
// FORM FIELD
// ==================================================

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}) {
  return (
    <div
      style={{
        marginBottom:
          "16px",
      }}
    >
      <label
        style={
          formLabelStyle
        }
      >
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        disabled={
          disabled
        }
        style={
          formInputStyle
        }
      />
    </div>
  );
}

// ==================================================
// ERROR MESSAGE
// ==================================================

function ErrorMessage({
  message,
}) {
  return (
    <div
      style={{
        marginBottom:
          "16px",
        padding:
          "11px 13px",
        borderRadius:
          "8px",
        backgroundColor:
          "#fcecef",
        color:
          "#8f2638",
        fontSize:
          "12px",
        lineHeight:
          "1.5",
      }}
    >
      {message}
    </div>
  );
}

// ==================================================
// STYLE
// ==================================================

const primaryButtonStyle = {
  border: "none",
  backgroundColor:
    "#8f2638",
  color: "#fff",
  padding:
    "12px 18px",
  borderRadius:
    "8px",
  fontSize:
    "13px",
  fontWeight:
    "600",
  cursor:
    "pointer",
};

const secondaryButtonStyle = {
  border:
    "1px solid #ddd",
  backgroundColor:
    "#fff",
  color: "#555",
  padding:
    "10px 16px",
  borderRadius:
    "8px",
  fontSize:
    "12px",
  fontWeight:
    "600",
  cursor:
    "pointer",
};

const actionButtonStyle = {
  border: "none",
  backgroundColor:
    "#f7f5f6",
  color: "#555",
  padding:
    "7px 10px",
  borderRadius:
    "6px",
  fontSize:
    "10px",
  fontWeight:
    "600",
  cursor:
    "pointer",
};

const statCardStyle = {
  backgroundColor:
    "#fff",
  border:
    "1px solid #eee",
  borderRadius:
    "14px",
  padding:
    "20px",
};

const statLabelStyle = {
  fontSize:
    "13px",
  color: "#777",
};

const statValueStyle = {
  margin:
    "8px 0 0",
  fontSize:
    "28px",
  color:
    "#211b1d",
};

const statDescriptionStyle = {
  display:
    "block",
  marginTop:
    "6px",
  fontSize:
    "11px",
  color:
    "#999",
};

const tableHeaderStyle = {
  padding:
    "14px 18px",
  fontSize:
    "11px",
  color:
    "#888",
  fontWeight:
    "600",
  borderBottom:
    "1px solid #eee",
};

const tableCellStyle = {
  padding:
    "16px 18px",
  borderBottom:
    "1px solid #eee",
  fontSize:
    "13px",
};

const formLabelStyle = {
  display:
    "block",
  marginBottom:
    "7px",
  fontSize:
    "12px",
  fontWeight:
    "600",
  color:
    "#444",
};

const formInputStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  border:
    "1px solid #ddd",
  borderRadius:
    "8px",
  padding:
    "10px 12px",
  fontSize:
    "12px",
  color:
    "#333",
  outline:
    "none",
  backgroundColor:
    "#fff",
};

const modalBodyStyle = {
  padding:
    "22px 24px",
};

export default CategoryPage;