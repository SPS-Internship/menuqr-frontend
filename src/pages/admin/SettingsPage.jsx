import { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAdminProfile } from "../../context/AdminProfileContext";

import {
  getRestaurants,
  updateRestaurant,
} from "../../services/restaurantService";

import {
  getAdminSettingsProfile,
  updateAdminProfile,
  updateAdminPassword,
} from "../../services/adminService";

function SettingsPage() {
  const { profile, updateProfile } =
    useAdminProfile();

  // =========================================================
  // PROFILE ADMIN
  // =========================================================

  const [adminName, setAdminName] =
    useState(
      profile.name || "Administrator"
    );

  const [profilePhoto, setProfilePhoto] =
    useState(
      profile.photo || null
    );

  const [currentEmail, setCurrentEmail] =
    useState("");

  const [newEmail, setNewEmail] =
    useState("");

  const [profileConfirmPassword, setProfileConfirmPassword] =
    useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  // =========================================================
  // PASSWORD ADMIN
  // =========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  // =========================================================
  // DATA RESTAURANT
  // =========================================================

  const [restaurant, setRestaurant] =
    useState(null);

  const [restaurantLoading, setRestaurantLoading] =
    useState(true);

  const [restaurantSaving, setRestaurantSaving] =
    useState(false);

  const [restaurantError, setRestaurantError] =
    useState("");

  // =========================================================
  // LOKASI RESTAURANT
  // =========================================================

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [locationRadius, setLocationRadius] =
    useState("100");

  // =========================================================
  // AMBIL DATA PROFILE ADMIN
  // =========================================================

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const response =
          await getAdminSettingsProfile();

        console.log(
          "Data profile admin:",
          response
        );

        const adminData =
          response?.data;

        if (adminData) {
          setAdminName(
            adminData.name ||
              "Administrator"
          );

          setCurrentEmail(
            adminData.email || ""
          );

          // -------------------------------------------------
          // AMBIL FOTO DARI LOCAL STORAGE BERDASARKAN EMAIL
          // -------------------------------------------------

          const adminEmail =
            adminData?.email
              ?.trim()
              .toLowerCase();

          if (adminEmail) {
            const photoStorageKey =
              `adminProfilePhoto_${adminEmail}`;

            const savedProfilePhoto =
              localStorage.getItem(
                photoStorageKey
              );

            if (savedProfilePhoto) {
              setProfilePhoto(
                savedProfilePhoto
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Gagal mengambil profile admin:",
          error
        );

        console.error(
          "Detail error backend:",
          error?.response?.data
        );
      }
    };

    loadAdminProfile();
  }, []);

  // =========================================================
  // AMBIL DATA RESTAURANT
  // =========================================================

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setRestaurantLoading(true);
        setRestaurantError("");

        // ---------------------------------------------------
        // AMBIL RESTAURANT ID DARI ADMIN YANG SEDANG LOGIN
        // ---------------------------------------------------

        const savedUser =
          localStorage.getItem(
            "adminUser"
          );

        const savedRestaurant =
          localStorage.getItem(
            "adminRestaurant"
          );

        let adminUser = null;
        let savedRestaurantData = null;

        // ---------------------------------------------------
        // BACA adminUser
        // ---------------------------------------------------

        if (savedUser) {
          try {
            adminUser =
              JSON.parse(
                savedUser
              );
          } catch (error) {
            console.error(
              "Gagal membaca adminUser:",
              error
            );
          }
        }

        // ---------------------------------------------------
        // BACA adminRestaurant
        // ---------------------------------------------------

        if (savedRestaurant) {
          try {
            savedRestaurantData =
              JSON.parse(
                savedRestaurant
              );
          } catch (error) {
            console.error(
              "Gagal membaca adminRestaurant:",
              error
            );
          }
        }

        console.log(
          "Admin yang sedang login:",
          adminUser
        );

        console.log(
          "Restaurant dari localStorage:",
          savedRestaurantData
        );

        // ---------------------------------------------------
        // TENTUKAN RESTAURANT ID AKTIF
        // ---------------------------------------------------

        const activeRestaurantId =
          adminUser?.restaurant_id ||
          savedRestaurantData?.id;

        if (!activeRestaurantId) {
          setRestaurantError(
            "Restaurant untuk akun admin ini tidak ditemukan."
          );

          return;
        }

        console.log(
          "Restaurant ID aktif:",
          activeRestaurantId
        );

        // ---------------------------------------------------
        // AMBIL SEMUA DATA RESTAURANT
        // ---------------------------------------------------

        const response =
          await getRestaurants();

        console.log(
          "Data restaurant:",
          response
        );

        // ---------------------------------------------------
        // NORMALISASI RESPONSE
        // ---------------------------------------------------

        const restaurantList =
          Array.isArray(response)
            ? response
            : Array.isArray(
                response?.data
              )
            ? response.data
            : response?.data
            ? [response.data]
            : [];

        console.log(
          "Daftar restaurant:",
          restaurantList
        );

        // ---------------------------------------------------
        // CARI RESTAURANT SESUAI ADMIN YANG LOGIN
        // ---------------------------------------------------

        const foundRestaurant =
          restaurantList.find(
            (item) =>
              Number(item.id) ===
              Number(
                activeRestaurantId
              )
          );

        if (!foundRestaurant) {
          setRestaurantError(
            `Data restaurant dengan ID ${activeRestaurantId} tidak ditemukan.`
          );

          return;
        }

        console.log(
          "Restaurant yang digunakan:",
          foundRestaurant
        );

        // ---------------------------------------------------
        // SIMPAN RESTAURANT AKTIF
        // ---------------------------------------------------

        setRestaurant(
          foundRestaurant
        );

        // ---------------------------------------------------
        // UPDATE adminRestaurant
        // AGAR SELALU SESUAI DENGAN RESTAURANT AKTIF
        // ---------------------------------------------------

        localStorage.setItem(
          "adminRestaurant",
          JSON.stringify(
            foundRestaurant
          )
        );

        // ---------------------------------------------------
        // ISI LOKASI YANG SUDAH TERSIMPAN
        // ---------------------------------------------------

        setLatitude(
          foundRestaurant.latitude ??
            ""
        );

        setLongitude(
          foundRestaurant.longitude ??
            ""
        );

        setLocationRadius(
          foundRestaurant.location_radius ??
            100
        );
      } catch (error) {
        console.error(
          "Gagal mengambil data restaurant:",
          error
        );

        setRestaurantError(
          error?.response?.data?.message ||
            "Gagal mengambil data restaurant."
        );
      } finally {
        setRestaurantLoading(false);
      }
    };

    loadRestaurant();
  }, []);

  // =========================================================
  // FOTO PROFILE
  // =========================================================

  const handlePhotoChange = (
    event
  ) => {
    const file =
      event.target.files[0];

    if (!file) return;

    // -------------------------------------------------------
    // Maksimal 2 MB
    // -------------------------------------------------------

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      alert(
        "Ukuran foto maksimal 2 MB."
      );

      return;
    }

    // -------------------------------------------------------
    // Format foto
    // -------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Foto harus berformat JPG, JPEG, atau PNG."
      );

      return;
    }

    // -------------------------------------------------------
    // Ubah menjadi Data URL
    // -------------------------------------------------------

    const reader =
      new FileReader();

    reader.onloadend = () => {
      const photoData =
        reader.result;

      // Tampilkan foto di halaman
      setProfilePhoto(
        photoData
      );

      // -----------------------------------------------------
      // SIMPAN FOTO BERDASARKAN EMAIL ADMIN
      // -----------------------------------------------------

      const savedUser =
        localStorage.getItem(
          "adminUser"
        );

      if (savedUser) {
        try {
          const adminUser =
            JSON.parse(
              savedUser
            );

          const adminEmail =
            adminUser?.email
              ?.trim()
              .toLowerCase();

          if (adminEmail) {
            const photoStorageKey =
              `adminProfilePhoto_${adminEmail}`;

            localStorage.setItem(
              photoStorageKey,
              photoData
            );

            console.log(
              "Foto profil berhasil disimpan:",
              photoStorageKey
            );
          }
        } catch (error) {
          console.error(
            "Gagal menyimpan foto profil:",
            error
          );
        }
      }
    };

    reader.readAsDataURL(file);
  };

  // =========================================================
  // SIMPAN PROFILE ADMIN
  // =========================================================

  const handleSaveProfile =
    async (event) => {
      event.preventDefault();

      try {
        setProfileSaving(true);

        // ---------------------------------------------------
        // Validasi nama
        // ---------------------------------------------------

        if (!adminName.trim()) {
          alert(
            "Nama admin wajib diisi."
          );

          return;
        }

        // ---------------------------------------------------
        // Tentukan email yang akan disimpan
        // ---------------------------------------------------

        const emailToSave =
          newEmail.trim() ||
          currentEmail;

        if (!emailToSave) {
          alert(
            "Email wajib diisi."
          );

          return;
        }

        // ---------------------------------------------------
        // Update nama + email ke backend
        // ---------------------------------------------------

        const response =
          await updateAdminProfile({
            name: adminName.trim(),
            email: emailToSave,
          });

        console.log(
          "Response update profile:",
          response
        );

        // ---------------------------------------------------
        // SIMPAN FOTO BERDASARKAN EMAIL
        // ---------------------------------------------------

        if (profilePhoto) {
          const adminEmail =
            emailToSave
              .trim()
              .toLowerCase();

          if (adminEmail) {
            const photoStorageKey =
              `adminProfilePhoto_${adminEmail}`;

            localStorage.setItem(
              photoStorageKey,
              profilePhoto
            );

            console.log(
              "Foto profil berhasil disimpan:",
              photoStorageKey
            );
          }
        }

        // ---------------------------------------------------
        // Update context agar sidebar ikut berubah
        // ---------------------------------------------------

        updateProfile({
          ...profile,
          name: adminName.trim(),
          email: emailToSave,
          photo: profilePhoto,
        });

        // ---------------------------------------------------
        // Update state email
        // ---------------------------------------------------

        setCurrentEmail(
          emailToSave
        );

        setNewEmail("");

        setProfileConfirmPassword(
          ""
        );

        alert(
          "Nama dan email berhasil diperbarui."
        );
      } catch (error) {
        console.error(
          "Gagal menyimpan profile admin:",
          error
        );

        console.error(
          "Detail error backend:",
          error?.response?.data
        );

        const backendMessage =
          error?.response?.data?.message;

        const backendErrors =
          error?.response?.data?.errors;

        if (backendErrors) {
          const messages =
            Object.values(
              backendErrors
            )
              .flat()
              .join(" ");

          alert(
            messages ||
              "Data profile tidak valid."
          );
        } else {
          alert(
            backendMessage ||
              "Gagal menyimpan profile admin."
          );
        }
      } finally {
        setProfileSaving(false);
      }
    };

  // =========================================================
  // SIMPAN PASSWORD ADMIN
  // =========================================================

  const handleSavePassword =
    async (event) => {
      event.preventDefault();

      if (!currentPassword) {
        alert(
          "Password saat ini wajib diisi."
        );

        return;
      }

      if (!newPassword) {
        alert(
          "Password baru wajib diisi."
        );

        return;
      }

      if (
        newPassword.length < 8
      ) {
        alert(
          "Password baru minimal 8 karakter."
        );

        return;
      }

      if (!confirmNewPassword) {
        alert(
          "Konfirmasi password baru wajib diisi."
        );

        return;
      }

      if (
        newPassword !==
        confirmNewPassword
      ) {
        alert(
          "Konfirmasi password baru tidak sama."
        );

        return;
      }

      try {
        setPasswordSaving(true);

        const response =
          await updateAdminPassword({
            current_password:
              currentPassword,

            password:
              newPassword,

            password_confirmation:
              confirmNewPassword,
          });

        console.log(
          "Response update password:",
          response
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");

        alert(
          "Password berhasil diubah."
        );
      } catch (error) {
        console.error(
          "Gagal mengubah password:",
          error
        );

        console.error(
          "Detail error backend:",
          error?.response?.data
        );

        const backendMessage =
          error?.response?.data?.message;

        const backendErrors =
          error?.response?.data?.errors;

        if (backendErrors) {
          const messages =
            Object.values(
              backendErrors
            )
              .flat()
              .join(" ");

          alert(
            messages ||
              "Password tidak dapat diubah."
          );
        } else {
          alert(
            backendMessage ||
              "Gagal mengubah password."
          );
        }
      } finally {
        setPasswordSaving(false);
      }
    };

  // =========================================================
  // BATAL PERUBAHAN PROFILE
  // =========================================================

  const handleCancelProfile =
    () => {
      setAdminName(
        profile.name ||
          "Administrator"
      );

      setCurrentEmail(
        profile.email || currentEmail
      );

      setNewEmail("");

      setProfilePhoto(
        profile.photo || null
      );

      setProfileConfirmPassword("");
    };

  // =========================================================
  // SIMPAN LOKASI RESTAURANT
  // =========================================================

  const handleSaveLocation =
    async (event) => {
      event.preventDefault();

      // -----------------------------------------------------
      // Validasi latitude dan longitude
      // -----------------------------------------------------

      if (
        latitude === "" ||
        longitude === ""
      ) {
        setRestaurantError(
          "Latitude dan longitude wajib diisi."
        );

        return;
      }

      // -----------------------------------------------------
      // Konversi angka
      // -----------------------------------------------------

      const latitudeNumber =
        Number(latitude);

      const longitudeNumber =
        Number(longitude);

      const radiusNumber =
        Number(locationRadius);

      // -----------------------------------------------------
      // Validasi latitude
      // -----------------------------------------------------

      if (
        Number.isNaN(
          latitudeNumber
        ) ||
        latitudeNumber < -90 ||
        latitudeNumber > 90
      ) {
        setRestaurantError(
          "Latitude harus berupa angka antara -90 sampai 90."
        );

        return;
      }

      // -----------------------------------------------------
      // Validasi longitude
      // -----------------------------------------------------

      if (
        Number.isNaN(
          longitudeNumber
        ) ||
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        setRestaurantError(
          "Longitude harus berupa angka antara -180 sampai 180."
        );

        return;
      }

      // -----------------------------------------------------
      // Validasi radius
      // -----------------------------------------------------

      if (
        Number.isNaN(
          radiusNumber
        ) ||
        radiusNumber <= 0
      ) {
        setRestaurantError(
          "Radius harus lebih besar dari 0 meter."
        );

        return;
      }

      // -----------------------------------------------------
      // Pastikan restaurant tersedia
      // -----------------------------------------------------

      if (!restaurant?.id) {
        setRestaurantError(
          "Data restaurant belum tersedia."
        );

        return;
      }

      try {
        setRestaurantSaving(true);
        setRestaurantError("");

        // ---------------------------------------------------
        // Data yang dikirim ke backend
        // ---------------------------------------------------

        const restaurantData = {
          latitude:
            latitudeNumber,

          longitude:
            longitudeNumber,

          location_radius:
            radiusNumber,
        };

        console.log(
          "Data lokasi yang dikirim:",
          restaurantData
        );

        // ---------------------------------------------------
        // Update restaurant
        // ---------------------------------------------------

        const response =
          await updateRestaurant(
            restaurant.id,
            restaurantData
          );

        console.log(
          "Response update restaurant:",
          response
        );

        // ---------------------------------------------------
        // Update state lokal
        // ---------------------------------------------------

        setRestaurant({
          ...restaurant,

          latitude:
            latitudeNumber,

          longitude:
            longitudeNumber,

          location_radius:
            radiusNumber,
        });

        // ---------------------------------------------------
        // Update localStorage agar data restaurant aktif
        // juga ikut terbaru
        // ---------------------------------------------------

        const updatedRestaurant = {
          ...restaurant,

          latitude:
            latitudeNumber,

          longitude:
            longitudeNumber,

          location_radius:
            radiusNumber,
        };

        localStorage.setItem(
          "adminRestaurant",
          JSON.stringify(
            updatedRestaurant
          )
        );

        alert(
          "Lokasi restaurant berhasil disimpan."
        );
      } catch (error) {
        console.error(
          "Gagal menyimpan lokasi restaurant:",
          error
        );

        console.error(
          "Detail error backend:",
          error?.response?.data
        );

        const backendMessage =
          error?.response?.data?.message;

        const backendErrors =
          error?.response?.data?.errors;

        if (backendErrors) {
          const messages =
            Object.values(
              backendErrors
            )
              .flat()
              .join(" ");

          setRestaurantError(
            messages ||
              "Data lokasi tidak valid."
          );
        } else {
          setRestaurantError(
            backendMessage ||
              "Gagal menyimpan lokasi restaurant."
          );
        }
      } finally {
        setRestaurantSaving(
          false
        );
      }
    };

  // =========================================================
  // TAMPILAN
  // =========================================================

  return (
    <div
      className="admin-layout"
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor:
          "#f7f5f6",
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
        className="settings-content"
        style={{
          marginLeft: "240px",
          width:
            "calc(100% - 240px)",
          minHeight: "100vh",
          boxSizing:
            "border-box",
        }}
      >
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="settings-header">
          <div>
            <h1>
              Pengaturan
            </h1>

            <p>
              Kelola informasi akun
              dan pengaturan restoran.
            </p>
          </div>
        </div>

        {/* ===================================================
            FORM PROFILE
        ==================================================== */}

        <form
          onSubmit={
            handleSaveProfile
          }
        >
          {/* =================================================
              FOTO PROFIL
          ================================================== */}

          <section className="settings-section">
            <div className="settings-section-header">
              <h2>
                Foto Profil
              </h2>

              <p>
                Gunakan foto profil
                untuk memudahkan
                identifikasi akun admin.
              </p>
            </div>

            <div className="profile-photo-area">
              <div className="profile-photo">
                {profilePhoto ? (
                  <img
                    src={
                      profilePhoto
                    }
                    alt="Foto profil"
                  />
                ) : (
                  <span>
                    {(
                      adminName ||
                      "Admin"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="profile-photo-info">
                <strong>
                  Foto Profil Administrator
                </strong>

                <p>
                  Format JPG, JPEG
                  atau PNG. Maksimal
                  2 MB.
                </p>

                <label className="change-photo-button">
                  Ganti Foto

                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={
                      handlePhotoChange
                    }
                    hidden
                  />
                </label>
              </div>
            </div>
          </section>

          {/* =================================================
              INFORMASI AKUN
          ================================================== */}

          <section className="settings-section">
            <div className="settings-section-header">
              <h2>
                Informasi Akun
              </h2>

              <p>
                Kelola informasi akun
                administrator.
              </p>
            </div>

            <div className="settings-grid">
              {/* NAMA ADMIN */}

              <div className="settings-field">
                <label>
                  Nama Admin
                </label>

                <input
                  type="text"
                  value={
                    adminName
                  }
                  onChange={(
                    event
                  ) =>
                    setAdminName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Masukkan nama admin"
                />
              </div>

              {/* EMAIL SAAT INI */}

              <div className="settings-field">
                <label>
                  Email Saat Ini
                </label>

                <input
                  type="email"
                  value={
                    currentEmail
                  }
                  disabled
                />
              </div>

              {/* EMAIL BARU */}

              <div className="settings-field">
                <label>
                  Email Baru
                </label>

                <input
                  type="email"
                  value={
                    newEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setNewEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder="Masukkan email baru"
                />
              </div>

              {/* KONFIRMASI PASSWORD */}

              <div className="settings-field">
                <label>
                  Konfirmasi Password
                </label>

                <input
                  type="password"
                  value={
                    profileConfirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setProfileConfirmPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Masukkan password untuk konfirmasi"
                />
              </div>
            </div>
          </section>

          {/* =================================================
              BUTTON PROFILE
          ================================================== */}

          <div className="settings-actions">
            <button
              type="button"
              className="settings-cancel-button"
              onClick={
                handleCancelProfile
              }
            >
              Batal
            </button>

            <button
              type="submit"
              className="settings-save-button"
              disabled={
                profileSaving
              }
            >
              {profileSaving
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>
          </div>
        </form>

        {/* ===================================================
            UBAH PASSWORD
        ==================================================== */}

        <section className="settings-section">
          <div className="settings-section-header">
            <h2>
              Ubah Password
            </h2>

            <p>
              Pastikan password baru
              berbeda dari password
              sebelumnya.
            </p>
          </div>

          <form
            onSubmit={
              handleSavePassword
            }
          >
            <div className="settings-grid settings-password-grid">
              {/* PASSWORD SAAT INI */}

              <div className="settings-field">
                <label>
                  Password Saat Ini
                </label>

                <input
                  type="password"
                  value={
                    currentPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setCurrentPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Masukkan password saat ini"
                />
              </div>

              <div />

              {/* PASSWORD BARU */}

              <div className="settings-field">
                <label>
                  Password Baru
                </label>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setNewPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Masukkan password baru"
                />

                <small>
                  Minimal 8 karakter.
                </small>
              </div>

              {/* KONFIRMASI PASSWORD BARU */}

              <div className="settings-field">
                <label>
                  Konfirmasi Password Baru
                </label>

                <input
                  type="password"
                  value={
                    confirmNewPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmNewPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            {/* =================================================
                BUTTON PASSWORD
            ================================================== */}

            <div className="settings-actions">
              <button
                type="submit"
                className="settings-save-button"
                disabled={
                  passwordSaving
                }
              >
                {passwordSaving
                  ? "Mengubah Password..."
                  : "Simpan Password"}
              </button>
            </div>
          </form>
        </section>

        {/* ===================================================
            LOKASI RESTAURANT
        ==================================================== */}

        <section className="settings-section restaurant-location-section">
          <div className="settings-section-header">
            <h2>
              Lokasi Restoran
            </h2>

            <p>
              Atur lokasi{" "}
              {restaurant?.name ||
                "restoran"}{" "}
              yang digunakan untuk
              memvalidasi jarak pelanggan
              saat melakukan pemesanan.
            </p>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {restaurantLoading && (
            <div className="settings-location-loading">
              Memuat data lokasi restoran...
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================== */}

          {restaurantError && (
            <div className="settings-location-error">
              <strong>
                Terjadi kesalahan
              </strong>

              <p>
                {restaurantError}
              </p>
            </div>
          )}

          {/* =================================================
              LOCATION FORM
          ================================================== */}

          {!restaurantLoading &&
            restaurant && (
              <form
                onSubmit={
                  handleSaveLocation
                }
              >
                {/* INFO RESTAURANT */}

                <div className="restaurant-location-info">
                  <div>
                    <span>
                      RESTAURANT
                    </span>

                    <strong>
                      {
                        restaurant.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      ID RESTAURANT
                    </span>

                    <strong>
                      {
                        restaurant.id
                      }
                    </strong>
                  </div>
                </div>

                {/* INPUT LOCATION */}

                <div className="settings-grid">
                  {/* LATITUDE */}

                  <div className="settings-field">
                    <label htmlFor="restaurant-latitude">
                      Latitude
                    </label>

                    <input
                      id="restaurant-latitude"
                      type="number"
                      step="any"
                      value={
                        latitude
                      }
                      onChange={(
                        event
                      ) =>
                        setLatitude(
                          event.target
                            .value
                        )
                      }
                      placeholder="Contoh: -7.98"
                    />

                    <small>
                      Nilai antara -90
                      sampai 90.
                    </small>
                  </div>

                  {/* LONGITUDE */}

                  <div className="settings-field">
                    <label htmlFor="restaurant-longitude">
                      Longitude
                    </label>

                    <input
                      id="restaurant-longitude"
                      type="number"
                      step="any"
                      value={
                        longitude
                      }
                      onChange={(
                        event
                      ) =>
                        setLongitude(
                          event.target
                            .value
                        )
                      }
                      placeholder="Contoh: 112.63"
                    />

                    <small>
                      Nilai antara -180
                      sampai 180.
                    </small>
                  </div>

                  {/* RADIUS */}

                  <div className="settings-field">
                    <label htmlFor="restaurant-radius">
                      Radius Lokasi
                    </label>

                    <div className="settings-input-with-unit">
                      <input
                        id="restaurant-radius"
                        type="number"
                        min="1"
                        value={
                          locationRadius
                        }
                        onChange={(
                          event
                        ) =>
                          setLocationRadius(
                            event.target
                              .value
                          )
                        }
                        placeholder="100"
                      />

                      <span>
                        meter
                      </span>
                    </div>

                    <small>
                      Jarak maksimal pelanggan
                      dari restoran.
                    </small>
                  </div>
                </div>

                {/* =================================================
                    PETUNJUK
                ================================================== */}

                <div className="restaurant-location-note">
                  <span>
                    ℹ
                  </span>

                  <div>
                    <strong>
                      Cara kerja lokasi
                    </strong>

                    <p>
                      Saat pelanggan melakukan
                      pemesanan, browser akan
                      mengambil lokasi pelanggan.
                      Backend kemudian membandingkan
                      lokasi tersebut dengan lokasi
                      restoran dan radius yang kamu
                      tentukan di sini.
                    </p>
                  </div>
                </div>

                {/* =================================================
                    SAVE LOCATION
                ================================================== */}

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-save-button"
                    disabled={
                      restaurantSaving
                    }
                  >
                    {restaurantSaving
                      ? "Menyimpan..."
                      : "Simpan Lokasi Restoran"}
                  </button>
                </div>
              </form>
            )}
        </section>
      </main>
    </div>
  );
}

export default SettingsPage;