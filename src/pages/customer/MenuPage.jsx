import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import MenuCard from "../../components/customer/MenuCard";
import { getMenus } from "../../services/menuService";
import { getCategories } from "../../services/categoryService";
import { getTableByCode } from "../../services/tableService";

function MenuPage() {
  const { slug } = useParams();

  // =========================================================
  // DATA
  // =========================================================

  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);

  // =========================================================
  // FILTER
  // =========================================================

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  // =========================================================
  // TABLE
  // =========================================================

  const [table, setTable] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  // =========================================================
  // RESTAURANT SLUG
  // =========================================================

  // URL yang digunakan sekarang:
  // http://localhost:5173/?table=HOSHI-001
  //
  // Karena tidak ada slug di URL, gunakan slug Hoshi Ramen.

  const restaurantSlug = slug;

  // =========================================================
  // AMBIL DATA MENU & KATEGORI
  // =========================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, categoryData] = await Promise.all([
          getMenus(restaurantSlug),
          getCategories(),
        ]);

        console.log("Data menu:", menuData);
        console.log("Data kategori:", categoryData);

        // =====================================================
        // PERBAIKAN PENTING
        // =====================================================
        //
        // Backend mengembalikan bentuk:
        //
        // {
        //   restaurant: {...},
        //   categories: [...],
        //   menus: [...]
        // }
        //
        // Jadi yang dimasukkan ke state menus adalah
        // menuData.menus.

        setMenus(
          Array.isArray(menuData)
            ? menuData
            : menuData?.menus ||
                menuData?.data?.menus ||
                menuData?.data ||
                []
        );

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : categoryData?.data || []
        );
      } catch (error) {
        console.error(
          "Gagal mengambil data menu dan kategori:",
          error
        );

        setMenus([]);
        setCategories([]);
      }
    };

    fetchData();
  }, [restaurantSlug]);

  // =========================================================
  // AMBIL DATA MEJA DARI QR
  // =========================================================

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const tableCode = params.get("table");

    if (!tableCode) {
      return;
    }

    const fetchTable = async () => {
      try {
        setTableLoading(true);
        setTableError("");

        const response = await getTableByCode(
          restaurantSlug,
          tableCode
        );

        console.log("Data meja:", response);

        const tableData =
          response?.table ||
          response?.data?.table ||
          response?.data ||
          response;

        setTable(tableData);

localStorage.setItem(
  "restaurantTable",
  JSON.stringify(response)
);

localStorage.setItem(
  "restaurantSlug",
  restaurantSlug
);

localStorage.setItem(
  "restaurantTableCode",
  tableCode
);

localStorage.setItem(
  "menuReturnUrl",
  `/menu/${restaurantSlug}?table=${tableCode}`
);

      } catch (error) {
        console.error(
          "Gagal mengambil data meja:",
          error
        );

        setTableError(
          "Meja tidak ditemukan atau QR Code tidak valid."
        );
      } finally {
        setTableLoading(false);
      }
    };

    fetchTable();
  }, [restaurantSlug]);

  // =========================================================
  // FILTER MENU
  // =========================================================

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(menu.category_id) ===
        String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // =========================================================
  // MENU RECOMMENDED
  // =========================================================

  const recommendedMenus = menus.slice(0, 4);

  // =========================================================
  // LINK KEMBALI KE MENU
  // =========================================================

  const menuLink = table?.code
    ? `?table=${table.code}`
    : "/";

  // =========================================================
  // SCROLL KE BAGIAN MENU
  // =========================================================

  const handleMenuClick = (event) => {
    event.preventDefault();

    const menuSection =
      document.getElementById("menu");

    if (menuSection) {
      menuSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // =========================================================
  // KEMBALI KE BAGIAN ATAS
  // =========================================================

  const handleHomeClick = (event) => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="menu-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="restaurant-header">

        <div className="container">

          <div className="restaurant-header-top">

            <div className="restaurant-brand">

              <div className="restaurant-logo">
                H
              </div>

              <div>

                <p className="restaurant-label">
                  HOSHI RAMEN
                </p>

                <h1 className="restaurant-title">
                  Japanese comfort food.
                </h1>

              </div>

            </div>

            {/* TABLE */}

            {table && (
              <div className="table-info">

                <span className="table-info-label">
                  YOUR TABLE
                </span>

                <strong>
                  {table.name || table.code}
                </strong>

              </div>
            )}

          </div>

          <div className="restaurant-intro">

            <p>
              Authentic Japanese taste, made for you.
            </p>

          </div>

          {/* TABLE LOADING */}

          {tableLoading && (
            <div className="table-status">
              Memeriksa meja...
            </div>
          )}

          {/* TABLE ERROR */}

          {tableError && (
            <div className="table-error">
              {tableError}
            </div>
          )}

          {/* TABLE WARNING */}

          {!table &&
            !tableLoading &&
            !new URLSearchParams(
              window.location.search
            ).get("table") && (

              <div className="table-warning">
                Silakan scan QR Code meja untuk mulai
                memesan.
              </div>

            )}

        </div>

      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="menu-content">

        <div className="container">

          {/* =================================================
              SEARCH
          ================================================== */}

          <div className="menu-search-box">

            <span className="menu-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari menu favoritmu..."
            />

          </div>

          {/* =================================================
              CATEGORY
          ================================================== */}

          <div className="menu-category-scroll">

            <button
              type="button"
              className={`category-button ${
                selectedCategory === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSelectedCategory("all")
              }
            >
              Semua
            </button>

            {categories.map((category) => (

              <button
                type="button"
                key={category.id}
                className={`category-button ${
                  String(selectedCategory) ===
                  String(category.id)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(category.id)
                }
              >
                {category.name}
              </button>

            ))}

          </div>

          {/* =================================================
              PROMO
          ================================================== */}

          <section className="menu-promo">

            <div className="menu-promo-content">

              <span className="menu-promo-label">
                PROMO HARI INI
              </span>

              <h2>
                Nikmati ramen
                <br />
                favoritmu lebih hemat.
              </h2>

              <p>
                Dapatkan diskon 20% untuk pembelian
                minimal Rp50.000.
              </p>

              <div className="menu-promo-code">
                KODE: <strong>RAMEN20</strong>
              </div>

            </div>

            <div className="menu-promo-decoration">
              🍜
            </div>

          </section>

          {/* =================================================
              RECOMMENDED
          ================================================== */}

          {selectedCategory === "all" &&
            search === "" &&
            recommendedMenus.length > 0 && (

              <section className="recommended-section">

                <div className="section-heading">

                  <div>

                    <span>
                      OUR FAVORITES
                    </span>

                    <h2>
                      Recommended
                    </h2>

                  </div>

                </div>

                <div className="recommended-grid">

                  {recommendedMenus.map((menu) => (

                   <Link
  key={menu.id}
  to={`/menu/${restaurantSlug}/${menu.id}`}
  className="recommended-card"
>

                      <div className="recommended-image">

                        {menu.image_url ? (

                          <img
                            src={menu.image_url}
                            alt={menu.name}
                          />

                        ) : (

                          <div className="recommended-no-image">
                            🍜
                          </div>

                        )}

                      </div>

                      <div className="recommended-info">

                        <h3>
                          {menu.name}
                        </h3>

                        <span>
                          Rp{" "}
                          {Number(
                            menu.price
                          ).toLocaleString("id-ID")}
                        </span>

                      </div>

                    </Link>

                  ))}

                </div>

              </section>

            )}

          {/* =================================================
              ALL MENU
          ================================================== */}

          <section
            id="menu"
            className="all-menu-section"
          >

            <div className="section-heading menu-heading">

              <div>

                <span>
                  OUR MENU
                </span>

                <h2>
                  Pilihan Menu
                </h2>

              </div>

              <small>
                {filteredMenus.length} menu
              </small>

            </div>

            {filteredMenus.length > 0 ? (

              <div className="row g-3 g-md-4">

                {filteredMenus.map((menu) => (

                  <div
                    className="col-12 col-sm-6 col-lg-4"
                    key={menu.id}
                  >

                    <MenuCard menu={menu} />

                  </div>

                ))}

              </div>

            ) : (

              <div className="menu-empty">

                <div className="menu-empty-icon">
                  🍜
                </div>

                <h3>
                  Menu tidak ditemukan
                </h3>

                <p>
                  Coba gunakan kata kunci atau kategori
                  lainnya.
                </p>

              </div>

            )}

          </section>

        </div>

      </section>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      <nav className="mobile-bottom-nav">

        {/* HOME */}

        <a
          href={menuLink}
          className="bottom-nav-item active"
          onClick={handleHomeClick}
        >

          <span className="bottom-nav-icon">
            ⌂
          </span>

          <small>
            Home
          </small>

        </a>

        {/* MENU */}

        <a
          href="#menu"
          className="bottom-nav-item"
          onClick={handleMenuClick}
        >

          <span className="bottom-nav-icon">
            ☰
          </span>

          <small>
            Menu
          </small>

        </a>

        {/* CART */}

        <Link
          to="/cart"
          className="bottom-nav-item"
        >

          <span className="bottom-nav-icon">
            🛒
          </span>

          <small>
            Cart
          </small>

        </Link>

      </nav>

    </main>
  );
}

export default MenuPage;