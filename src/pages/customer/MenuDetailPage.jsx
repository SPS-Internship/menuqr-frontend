import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../../context/useCart";

import {
  getMenuById,
  getMenuVariants,
  getMenuAddons,
} from "../../services/menuService";

function MenuDetailPage() {
  const { slug, id } = useParams();
  const { addToCart } = useCart();

  // =========================
  // DATA MEJA
  // =========================

  const [table, setTable] = useState(null);

  // =========================
  // DATA MENU
  // =========================

  const [menu, setMenu] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // AMBIL DATA MEJA
  // =========================

  useEffect(() => {
    try {
      const savedTable = localStorage.getItem(
        "restaurantTable"
      );

      if (!savedTable) {
        setTable(null);
        return;
      }

      const parsedTable = JSON.parse(savedTable);

      const tableData =
        parsedTable?.table ||
        parsedTable?.data?.table ||
        parsedTable?.data ||
        parsedTable;

      setTable(tableData);
    } catch (error) {
      console.error(
        "Gagal membaca data meja:",
        error
      );

      setTable(null);
    }
  }, []);

  // =========================
  // AMBIL DETAIL MENU
  // =========================

  useEffect(() => {
    const fetchMenuDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          menuData,
          variantData,
          addonData,
        ] = await Promise.all([
          getMenuById(id),
          getMenuVariants(id),
          getMenuAddons(id),
        ]);

        console.log(
          "Detail menu:",
          menuData
        );

        console.log(
          "Variant menu:",
          variantData
        );

        console.log(
          "Add-on menu:",
          addonData
        );

        // =========================
        // DATA MENU
        // =========================

        const menuResult =
          menuData?.data ||
          menuData;

        setMenu(menuResult);

        // =========================
        // DATA VARIANT
        // =========================

        const variantResult =
          Array.isArray(variantData)
            ? variantData
            : Array.isArray(
                variantData?.data
              )
              ? variantData.data
              : [];

        setVariants(variantResult);

        // =========================
        // DATA ADDON
        // =========================

        const addonResult =
          Array.isArray(addonData)
            ? addonData
            : Array.isArray(
                addonData?.data
              )
              ? addonData.data
              : [];

        setAddons(addonResult);
      } catch (err) {
        console.error(
          "Gagal mengambil detail menu:",
          err
        );

        setError(
          "Gagal mengambil detail menu."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMenuDetail();
    }
  }, [id]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner-border text-danger">
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <p>
          Memuat detail menu...
        </p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="container py-5">
        <div className="detail-error">
          {error}
        </div>
      </div>
    );
  }

  // =========================
  // MENU TIDAK DITEMUKAN
  // =========================

  if (!menu) {
    return (
      <div className="container py-5">
        <div className="detail-error">
          Menu tidak ditemukan.
        </div>
      </div>
    );
  }

  // =========================
  // HARGA
  // =========================

  const menuPrice =
    Number(menu.price) || 0;

  const variantPrice =
    selectedVariant
      ? Number(selectedVariant.price) || 0
      : 0;

  const addonPrice =
    selectedAddons.reduce(
      (total, addon) =>
        total +
        (Number(addon.price) || 0),
      0
    );

  const unitPrice =
    menuPrice +
    variantPrice +
    addonPrice;

  const totalPrice =
    unitPrice * quantity;

  // =========================
  // ADD TO CART
  // =========================

  const handleAddToCart = () => {
    const cartItem = {
      menuId: menu.id,

      restaurantId:
        menu.restaurant_id,

      name: menu.name,

      price: menuPrice,

      variant: selectedVariant,

      addons: selectedAddons,

      quantity: quantity,

      totalPrice: totalPrice,
    };

    console.log(
      "Menu yang ditambahkan ke cart:",
      cartItem
    );

    addToCart(cartItem);

    alert(
      "Menu berhasil ditambahkan ke keranjang!"
    );
  };

  // =========================
  // ADDON TOGGLE
  // =========================

  const handleAddonChange = (
    addon,
    checked
  ) => {
    if (checked) {
      setSelectedAddons(
        (currentAddons) => [
          ...currentAddons,
          addon,
        ]
      );
    } else {
      setSelectedAddons(
        (currentAddons) =>
          currentAddons.filter(
            (item) =>
              item.id !== addon.id
          )
      );
    }
  };

  // =========================
  // RETURN KE MENU RESTORAN
  // =========================

  const menuBackLink = table?.code
    ? `/menu/${slug}?table=${table.code}`
    : `/menu/${slug}`;

  // =========================
  // RENDER
  // =========================

  return (
    <main className="detail-page">

      {/* =========================
          HEADER
          ========================== */}

      <div className="detail-top">
        <div className="container">

          <Link
            to={menuBackLink}
            className="detail-back"
          >
            ← Kembali ke menu
          </Link>

        </div>
      </div>

      {/* =========================
          DETAIL CONTENT
          ========================== */}

      <div className="container detail-container">

        <div className="detail-layout">

          {/* =========================
              FOTO
              ========================== */}

          <div className="detail-image-wrapper">

            {menu.image_url ? (
              <img
                src={menu.image_url}
                alt={menu.name}
                className="detail-image"
              />
            ) : (
              <div className="detail-image-placeholder">

                <span>
                  🍜
                </span>

                <p>
                  Foto Menu
                </p>

              </div>
            )}

          </div>

          {/* =========================
              INFORMASI
              ========================== */}

          <div className="detail-info">

            <p className="detail-label">
              MENU
            </p>

            <h1 className="detail-title">
              {menu.name}
            </h1>

            <p className="detail-description">
              {menu.description ||
                "Menu lezat pilihan kami."}
            </p>

            <div className="detail-price">
              Rp{" "}
              {menuPrice.toLocaleString(
                "id-ID"
              )}
            </div>

            {/* =========================
                VARIANT
                ========================== */}

            {variants.length > 0 && (
              <section className="detail-section">

                <div className="detail-section-title">

                  <h2>
                    Pilih Variant
                  </h2>

                  <span>
                    Wajib pilih
                  </span>

                </div>

                <div className="variant-list">

                  {variants.map(
                    (variant) => (
                      <button
                        type="button"
                        key={variant.id}
                        className={`variant-item ${
                          selectedVariant?.id ===
                          variant.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedVariant(
                            variant
                          )
                        }
                      >

                        <div className="variant-radio">
                          <span />
                        </div>

                        <div className="variant-info">

                          <span className="variant-name">
                            {variant.name}
                          </span>

                          <span className="variant-price">
                            {Number(
                              variant.price
                            ) > 0
                              ? `+ Rp ${Number(
                                  variant.price
                                ).toLocaleString(
                                  "id-ID"
                                )}`
                              : "Gratis"}
                          </span>

                        </div>

                      </button>
                    )
                  )}

                </div>

              </section>
            )}

            {/* =========================
                ADD-ON
                ========================== */}

            {addons.length > 0 && (
              <section className="detail-section">

                <div className="detail-section-title">

                  <h2>
                    Tambahan
                  </h2>

                  <span>
                    Opsional
                  </span>

                </div>

                <div className="addon-list">

                  {addons.map(
                    (addon) => {
                      const isSelected =
                        selectedAddons.some(
                          (item) =>
                            item.id ===
                            addon.id
                        );

                      return (
                        <label
                          key={addon.id}
                          className={`addon-item ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleAddonChange(
                                addon,
                                e.target.checked
                              )
                            }
                          />

                          <span className="addon-check">
                            ✓
                          </span>

                          <span className="addon-info">

                            <span className="addon-name">
                              {addon.name}
                            </span>

                            <span className="addon-price">
                              + Rp{" "}
                              {Number(
                                addon.price
                              ).toLocaleString(
                                "id-ID"
                              )}
                            </span>

                          </span>

                        </label>
                      );
                    }
                  )}

                </div>

              </section>
            )}

            {/* =========================
                JUMLAH
                ========================== */}

            <section className="detail-section">

              <div className="detail-section-title">

                <h2>
                  Jumlah
                </h2>

              </div>

              <div className="quantity-control">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.max(
                        1,
                        quantity - 1
                      )
                    )
                  }
                >
                  −
                </button>

                <span>
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      quantity + 1
                    )
                  }
                >
                  +
                </button>

              </div>

            </section>

            {/* =========================
                TOTAL
                ========================== */}

            <div className="detail-total">

              <div>

                <span>
                  Total
                </span>

                <small>
                  {quantity} item
                  {quantity > 1
                    ? "s"
                    : ""}
                </small>

              </div>

              <strong>
                Rp{" "}
                {totalPrice.toLocaleString(
                  "id-ID"
                )}
              </strong>

            </div>

            {/* =========================
                BUTTON CART
                ========================== */}

            <button
              type="button"
              className="detail-cart-button"
              onClick={
                handleAddToCart
              }
            >
              🛒 Tambah ke Keranjang
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}

export default MenuDetailPage;