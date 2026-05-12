const GATEWAY_URL = import.meta.env['VITE_GATEWAY_URL'];

export const environment = {
  production: true,
  gatewayUrl: GATEWAY_URL,
  
  // Full Service URLs
  authUrl: `${GATEWAY_URL}/auth`,
  menuUrl: `${GATEWAY_URL}/menu`,
  inventoryUrl: `${GATEWAY_URL}/inventory`,
  orderUrl: `${GATEWAY_URL}/order`,
  cartUrl: `${GATEWAY_URL}/cart`,
  restaurantUrl: `${GATEWAY_URL}/restaurant`,

  // Individual endpoints that might not follow the service/endpoint pattern
  // (though in a gateway they usually do)
  loginUrl: `${GATEWAY_URL}/auth/login`,
  registerUrl: `${GATEWAY_URL}/auth/register`,

  // Legacy properties (for compatibility during refactoring)
  baseUrl: GATEWAY_URL,
  auth: '/auth',
  menu: '/menu',
  inventory: '/inventory',
  order: '/order',
  cart: '/cart',
  login: '/login',
  restaurant: '/restaurant',
  register: '/register'
};
