import { Link } from "react-router-dom";

function MenuCard({ menu, restaurantSlug }) {
  return (
    <Link
      to={`/menu/${restaurantSlug}/${menu.id}`}
      className="text-decoration-none"
    >
      <div className="menu-card">
        {/* FOTO MENU */}
        <div className="menu-card-image">
          {menu.image_url ? (
            <img
              src={menu.image_url}
              alt={menu.name}
            />
          ) : (
            <div className="menu-card-no-image">
              Foto Menu
            </div>
          )}
        </div>

        {/* INFORMASI MENU */}
        <div className="menu-card-body">
          <h5 className="menu-card-title">
            {menu.name}
          </h5>

          <p className="menu-card-description">
            {menu.description ||
              "Menu lezat pilihan kami."}
          </p>

          {/* HARGA + TOMBOL */}
          <div className="menu-card-bottom">
            <span className="menu-card-price">
              Rp{" "}
              {Number(menu.price).toLocaleString(
                "id-ID"
              )}
            </span>

            <span className="menu-card-button">
              <span className="menu-card-plus">
                +
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MenuCard;