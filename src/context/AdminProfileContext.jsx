import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getAdminSettingsProfile,
} from "../services/adminService";

const AdminProfileContext =
  createContext();

export function AdminProfileProvider({
  children,
}) {
  const [profile, setProfile] =
    useState(() => {
      const savedProfile =
        localStorage.getItem(
          "adminProfile"
        );

      const savedRestaurant =
        localStorage.getItem(
          "adminRestaurant"
        );

      let parsedProfile = null;
      let parsedRestaurant = null;

      // =========================
      // BACA ADMIN PROFILE
      // =========================

      if (savedProfile) {
        try {
          parsedProfile =
            JSON.parse(savedProfile);
        } catch (error) {
          console.error(
            "Gagal membaca adminProfile:",
            error
          );
        }
      }

      // =========================
      // BACA RESTORAN AKTIF
      // =========================

      if (savedRestaurant) {
        try {
          parsedRestaurant =
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

      // =========================
      // PROFILE AWAL
      // =========================

      return {
        name:
          parsedProfile?.name ||
          "Admin",

        email:
          parsedProfile?.email ||
          "",

        role:
          parsedProfile?.role ||
          "Administrator",

        photo:
          parsedProfile?.photo ||
          null,

        restaurant:
          parsedRestaurant ||
          parsedProfile?.restaurant ||
          null,
      };
    });

  // =========================
  // UPDATE PROFILE
  // =========================

  const updateProfile = (
    newProfile
  ) => {
    setProfile(newProfile);

    localStorage.setItem(
      "adminProfile",
      JSON.stringify(newProfile)
    );

    if (newProfile?.restaurant) {
      localStorage.setItem(
        "adminRestaurant",
        JSON.stringify(
          newProfile.restaurant
        )
      );
    }
  };

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    const loadProfile = async () => {
      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await getAdminSettingsProfile();

        const data =
          response?.data;

        if (!data) {
          return;
        }

        // ==================================
        // AMBIL RESTORAN AKTIF DARI STORAGE
        // ==================================

        const savedRestaurant =
          localStorage.getItem(
            "adminRestaurant"
          );

        let savedRestaurantData =
          null;

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

        // ==================================
        // PRIORITAS:
        // 1. RESTORAN YANG DISIMPAN SAAT LOGIN
        // 2. RESTORAN DARI RESPONSE BACKEND
        // ==================================

        const restaurant =
          savedRestaurantData ||
          data?.restaurant ||
          null;

        // ==================================
        // PROFILE TERBARU
        // ==================================

        const updatedProfile = {
          name:
            data?.name ||
            "Admin",

          email:
            data?.email ||
            "",

          role:
            data?.role ||
            "Administrator",

          photo:
            data?.photo ||
            null,

          restaurant,
        };

        setProfile(
          updatedProfile
        );

        localStorage.setItem(
          "adminProfile",
          JSON.stringify(
            updatedProfile
          )
        );

        if (restaurant) {
          localStorage.setItem(
            "adminRestaurant",
            JSON.stringify(
              restaurant
            )
          );
        }
      } catch (error) {
        console.error(
          "Gagal mengambil profil admin:",
          error
        );
      }
    };

    loadProfile();
  }, []);

  return (
    <AdminProfileContext.Provider
      value={{
        profile,
        updateProfile,
      }}
    >
      {children}
    </AdminProfileContext.Provider>
  );
}

export function useAdminProfile() {
  return useContext(
    AdminProfileContext
  );
}

