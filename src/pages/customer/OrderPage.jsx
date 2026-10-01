import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { useCart } from "../../context/useCart";

import {
  createOrder,
  previewOrder,
} from "../../services/orderService";

function OrderPage() {
  const { slug } = useParams();

  const {
    cartItems,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] =
    useState("");

  const [note, setNote] =
    useState("");

  const [latitude, setLatitude] =
    useState(null);

  const [longitude, setLongitude] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [successOrder, setSuccessOrder] =
    useState(null);

  const [successTotal, setSuccessTotal] =
    useState(0);

  const [promoPreview, setPromoPreview] =
    useState(null);

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // TABLE
  // =========================================================

  const savedTable =
    localStorage.getItem(
      "restaurantTable"
    );

  let parsedTable = null;

  try {
    parsedTable = savedTable
      ? JSON.parse(savedTable)
      : null;
  } catch (error) {
    console.error(
      "Gagal membaca data meja:",
      error
    );

    parsedTable = null;
  }

  const table =
    parsedTable?.table ||
    parsedTable?.data?.table ||
    parsedTable?.data ||
    parsedTable;

  // =========================================================
  // RESTAURANT
  // =========================================================

  const savedRestaurantSlug =
    localStorage.getItem(
      "restaurantSlug"
    );

  const restaurantSlug =
    slug ||
    savedRestaurantSlug ||
    table?.restaurant?.slug ||
    parsedTable?.restaurant?.slug ||
    parsedTable?.data?.restaurant?.slug ||
    "";

  // =========================================================
  // TABLE CODE
  // =========================================================

  const savedTableCode =
    localStorage.getItem(
      "restaurantTableCode"
    );

  const tableCode =
    savedTableCode ||
    table?.code ||
    table?.table_code ||
    table?.number ||
    "";

  // =========================================================
  // MENU RETURN URL
  // =========================================================

  const savedMenuReturnUrl =
    localStorage.getItem(
      "menuReturnUrl"
    );

  const menuLink =
    savedMenuReturnUrl ||
    (restaurantSlug
      ? tableCode
        ? `/menu/${restaurantSlug}?table=${tableCode}`
        : `/menu/${restaurantSlug}`
      : tableCode
        ? `/?table=${tableCode}`
        : "/");

  // =========================================================
  // TOTAL CART
  // =========================================================

  const total = cartItems.reduce(
    (totalAmount, item) => {
      const itemTotal =
        item.totalPrice ||
        Number(item.price || 0) *
          Number(item.quantity || 0);

      return (
        totalAmount +
        Number(itemTotal)
      );
    },
    0
  );

  // =========================================================
  // PREVIEW PROMO
  // =========================================================

  const handlePreviewPromo = async () => {
    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      setPromoPreview(null);
      return;
    }

    const restaurantId =
      cartItems[0]?.restaurantId;

    if (!restaurantId) {
      setPromoPreview(null);
      return;
    }

    const items = cartItems.map(
      (item) => ({
        menu_id:
          item.menuId,

        variant_id:
          item.variant?.id || null,

        addon_ids:
          Array.isArray(item.addons)
            ? item.addons.map(
                (addon) =>
                  addon.id
              )
            : [],

        quantity:
          item.quantity,
      })
    );

    try {
      setPromoLoading(true);

      const response =
        await previewOrder({
          restaurant_id:
            restaurantId,

          items: items,
        });

      console.log(
        "Preview promo:",
        response
      );

      setPromoPreview(
        response?.data || null
      );
    } catch (error) {
      console.error(
        "Gagal preview promo:",
        error
      );

      console.error(
        "Response error:",
        error?.response?.data
      );

      setPromoPreview(null);
    } finally {
      setPromoLoading(false);
    }
  };

  // =========================================================
  // AUTO PREVIEW PROMO
  // =========================================================

  useEffect(() => {
    handlePreviewPromo();
  }, [cartItems]);

  // =========================================================
  // GET LOCATION
  // =========================================================

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError(
        "Browser kamu tidak mendukung pengambilan lokasi."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude
        );

        setLongitude(
          position.coords.longitude
        );

        setError("");
      },
      (locationError) => {
        console.error(
          "Gagal mengambil lokasi:",
          locationError
        );

        setError(
          "Lokasi diperlukan untuk membuat pesanan. Silakan izinkan akses lokasi."
        );
      }
    );
  };

  // =========================================================
  // SUBMIT ORDER
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (
      !cartItems ||
      cartItems.length === 0
    ) {
      setError(
        "Keranjang masih kosong."
      );

      return;
    }

    if (!customerName.trim()) {
      setError(
        "Silakan isi nama pelanggan."
      );

      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setError(
        "Silakan izinkan akses lokasi terlebih dahulu."
      );

      getLocation();

      return;
    }

    const restaurantId =
      cartItems[0]?.restaurantId;

    if (!restaurantId) {
      setError(
        "Restaurant tidak ditemukan dari data pesanan."
      );

      return;
    }

    const items = cartItems.map(
      (item) => ({
        menu_id:
          item.menuId,

        variant_id:
          item.variant?.id || null,

        addon_ids:
          Array.isArray(item.addons)
            ? item.addons.map(
                (addon) =>
                  addon.id
              )
            : [],

        quantity:
          item.quantity,

        note:
          item.note || "",
      })
    );

    const orderData = {
      restaurant_id:
        restaurantId,

      table_id:
        table?.id || null,

      customer_name:
        customerName.trim(),

      note:
        note.trim(),

      latitude:
        latitude,

      longitude:
        longitude,

      items:
        items,
    };

    try {
      setLoading(true);

      console.log(
        "Data yang dikirim:",
        orderData
      );

      const response =
        await createOrder(
          orderData
        );

      console.log(
        "Response order:",
        response
      );

      const order =
        response?.data ||
        response?.order ||
        response;

      setSuccessOrder(order);

      // =====================================================
      // GUNAKAN TOTAL DARI BACKEND
      // Karena backend sudah menghitung promo
      // =====================================================

      const finalTotal =
        Number(
          order?.total ??
          promoPreview?.total ??
          total
        );

      setSuccessTotal(
        finalTotal
      );

      setOrderSuccess(true);

      clearCart();
    } catch (error) {
      console.error(
        "Gagal membuat pesanan:",
        error
      );

      console.error(
        "Response error:",
        error?.response?.data
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Pesanan gagal dibuat. Silakan coba lagi.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SUCCESS PAGE
  // =========================================================

  if (orderSuccess) {
    return (
      <main className="order-page">
        <div className="container">

          <div className="order-success">

            <div className="order-success-icon">
              <span>✓</span>
            </div>

            <span className="order-success-label">
              ORDER CONFIRMED
            </span>

            <h1>
              Pesanan berhasil dibuat!
            </h1>

            <div className="order-payment-highlight">
              <strong>
                Silakan lanjutkan pembayaran
              </strong>

              <span>
                di kasir untuk menyelesaikan
                pesananmu.
              </span>
            </div>

            {successOrder?.order_code && (
              <div className="order-success-code">

                <span>
                  Kode Pesanan
                </span>

                <strong>
                  {
                    successOrder.order_code
                  }
                </strong>

              </div>
            )}

            <div className="order-success-info">

              {tableCode && (
                <div className="order-success-info-item">

                  <span>
                    Meja
                  </span>

                  <strong>
                    {
                      table?.name ||
                      tableCode
                    }
                  </strong>

                </div>
              )}

              <div className="order-success-info-item">

                <span>
                  Total Pesanan
                </span>

                <strong>
                  Rp{" "}
                  {Number(
                    successTotal
                  ).toLocaleString(
                    "id-ID"
                  )}
                </strong>

              </div>

            </div>

            <div className="order-success-actions">

              <Link
                to={menuLink}
                className="order-back-menu"
              >
                Kembali ke Menu
              </Link>

            </div>

          </div>

        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <main className="order-page">

      <div className="container">

        {/* BACK TO MENU */}

        <Link
          to={menuLink}
          className="order-top-back"
        >
          <span className="order-top-back-arrow">
            ←
          </span>

          <span>
            Kembali ke menu
          </span>
        </Link>

        {/* HEADER */}

        <div className="order-header">

          <span className="order-header-label">
            YOUR ORDER
          </span>

          <h1>
            Konfirmasi Pesanan
          </h1>

          {tableCode && (
            <p>
              Meja{" "}
              <strong>
                {
                  table?.name ||
                  tableCode
                }
              </strong>
            </p>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="order-error">
            {error}
          </div>
        )}

        {/* EMPTY CART */}

        {cartItems.length === 0 ? (

          <div className="order-empty">

            <div className="order-empty-icon">
              🛒
            </div>

            <h2>
              Keranjang masih kosong
            </h2>

            <p>
              Silakan pilih menu terlebih
              dahulu.
            </p>

            <Link
              to={menuLink}
              className="order-back-menu"
            >
              Kembali ke Menu
            </Link>

          </div>

        ) : (

          <div className="order-layout">

            {/* =================================================
                CUSTOMER FORM
            ================================================= */}

            <section className="order-form-card">

              <div className="order-card-header">

                <span>
                  01
                </span>

                <div>

                  <small>
                    CUSTOMER
                  </small>

                  <h2>
                    Data Pemesan
                  </h2>

                </div>

              </div>

              {/* NAMA */}

              <div className="order-form-group">

                <label htmlFor="customerName">
                  Nama
                </label>

                <input
                  id="customerName"
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan nama kamu"
                />

              </div>

              {/* CATATAN */}

              <div className="order-form-group">

                <label htmlFor="note">
                  Catatan Pesanan
                </label>

                <textarea
                  id="note"
                  value={note}
                  onChange={(
                    event
                  ) =>
                    setNote(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: jangan terlalu pedas..."
                  rows="4"
                />

              </div>

              {/* LOCATION */}

              <div className="order-location">

                <div>

                  <strong>
                    Lokasi Pemesan
                  </strong>

                  <p>
                    Lokasi digunakan untuk
                    memastikan kamu berada
                    di area restoran.
                  </p>

                </div>

                {latitude === null ||
                longitude === null ? (

                  <button
                    type="button"
                    onClick={
                      getLocation
                    }
                    className="order-location-button"
                  >
                    Izinkan Lokasi
                  </button>

                ) : (

                  <span className="order-location-success">
                    ✓ Lokasi berhasil
                  </span>

                )}

              </div>

            </section>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <section className="order-summary-card">

              <div className="order-card-header">

                <span>
                  02
                </span>

                <div>

                  <small>
                    SUMMARY
                  </small>

                  <h2>
                    Ringkasan Pesanan
                  </h2>

                </div>

              </div>

              {/* ITEMS */}

              <div className="order-items">

                {cartItems.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="order-item"
                      key={`${item.menuId}-${index}`}
                    >

                      <div className="order-item-info">

                        <strong>
                          {item.name}
                        </strong>

                        {item.variant && (
                          <small>
                            {
                              item.variant.name
                            }
                          </small>
                        )}

                        {item.addons &&
                          item.addons.length >
                            0 && (

                            <small>
                              Tambahan:{" "}
                              {item.addons
                                .map(
                                  (
                                    addon
                                  ) =>
                                    addon.name
                                )
                                .join(
                                  ", "
                                )}
                            </small>

                          )}

                        <span>
                          {
                            item.quantity
                          }{" "}
                          × Rp{" "}
                          {Number(
                            item.price ||
                              0
                          ).toLocaleString(
                            "id-ID"
                          )}
                        </span>

                      </div>

                      <strong className="order-item-price">

                        Rp{" "}
                        {Number(
                          item.totalPrice ||
                            Number(
                              item.price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  0
                              )
                        ).toLocaleString(
                          "id-ID"
                        )}

                      </strong>

                    </div>

                  )
                )}

              </div>

              {/* =================================================
                  SUBTOTAL
              ================================================= */}

              <div className="order-summary-total">

                <span>
                  Subtotal
                </span>

                <strong>
                  Rp{" "}
                  {Number(
                    promoPreview?.subtotal ??
                      total
                  ).toLocaleString(
                    "id-ID"
                  )}
                </strong>

              </div>

              {/* =================================================
                  PROMO LOADING
              ================================================= */}

              {promoLoading && (
                <div className="order-promo-loading">
                  Mengecek promo...
                </div>
              )}

              {/* =================================================
                  PROMO
              ================================================= */}

              {promoPreview?.promo && (
                <div className="order-promo">

                  <div>

                    <span className="order-promo-label">
                      Promo
                    </span>

                    <strong>
                      {
                        promoPreview
                          .promo.name
                      }
                    </strong>

                  </div>

                  {promoPreview
                    .promo.code && (

                    <span className="order-promo-code">
                      {
                        promoPreview
                          .promo.code
                      }
                    </span>

                  )}

                </div>
              )}

              {/* =================================================
                  DISCOUNT
              ================================================= */}

              {promoPreview?.discount >
                0 && (

                <div className="order-discount">

                  <span>
                    Diskon
                  </span>

                  <strong>
                    - Rp{" "}
                    {Number(
                      promoPreview.discount
                    ).toLocaleString(
                      "id-ID"
                    )}
                  </strong>

                </div>

              )}

              {/* =================================================
                  FINAL TOTAL
              ================================================= */}

              <div className="order-summary-total">

                <span>
                  Total Pesanan
                </span>

                <strong>
                  Rp{" "}
                  {Number(
                    promoPreview?.total ??
                      total
                  ).toLocaleString(
                    "id-ID"
                  )}
                </strong>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="button"
                className="order-submit-button"
                onClick={
                  handleSubmit
                }
                disabled={
                  loading ||
                  promoLoading
                }
              >

                {loading
                  ? "Memproses Pesanan..."
                  : "Buat Pesanan"}

              </button>

              <p className="order-payment-note">
                Pembayaran dilakukan langsung
                di kasir setelah pesanan dibuat.
              </p>

            </section>

          </div>

        )}

      </div>

    </main>
  );
}

export default OrderPage;