import api from "./api";

export const createOrder = async (orderData) => {
  const response = await api.post(
    "/orders",
    orderData
  );

  return response.data;
};

export const previewOrder = async (orderData) => {
  const response = await api.post(
    "/orders/preview",
    orderData
  );

  return response.data;
};

export const getOrder = async (orderCode) => {
  const response = await api.get(
    `/orders/${encodeURIComponent(orderCode)}`
  );

  return response.data;
};

export const getWhatsAppUrl = async (orderCode) => {
  const response = await api.get(
    `/orders/${encodeURIComponent(orderCode)}/whatsapp`
  );

  return response.data;
};