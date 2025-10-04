// src/config/permissions.js
export const rolePermissions = {
  admin: [
    "accessories",
    "cars",
    "home-assets",
    "insurance",
    "rto",
    "schemes",
    "users",
    "variant-content",
    "variants",
  ],
  editor: [
    "accessories",
    "cars",
    "home-assets",
    "insurance",
    "rto",
    "schemes",
    "variant-content",
    "variants",
  ],
  viewer: [
    "cars",
    "home-assets",
  ],
  pending: [], // pending = no access
};
