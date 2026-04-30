export enum OrderStatus {
    CREATED = 'CREATED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING',
    PAID = 'PAID',
    PREPARING = 'PREPARING',
    CLOSED = 'CLOSED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_REQUESTED = 'PAYMENT_REQUESTED',
    CANCEL = 'CANCEL',
    CANCELLED = 'CANCELLED'
}

export interface CheckoutResponse {
    orderId: string;
    status: OrderStatus;
    paymentStatus?: string;
    totalAmount: number;
    items?: any[];
    reason?: string;
}


export interface AddonSnapshot {
    addonId: string;
    name?: string;
    addonName?: string;
    price?: number;
}

export interface VariantSnapshot {
    variantId: string;
    label?: string;
    variantName?: string;
    price?: number;
}

export interface CartItem {
    cartItemId: string;
    menuItemId: string;
    imageUrl: string;
    name: string;
    identityKey: string;
    variant?: VariantSnapshot;
    addons: AddonSnapshot[];
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface Cart {
    cartId: string;
    restaurantId: number;
    sessionId: string;
    createdAt: number;
    updatedAt: number;
    items: CartItem[];
    subtotal: number;
}

export interface AddToCartRequest {
    sessionId: string;
    restaurantId: number;
    imageUrl: string;
    menuItemId: string;
    variantId?: string;
    addonIds?: string[];
    quantity: number;
}

export interface UpdateCartItemRequest {
    restaurantId: number;
    sessionId: string;
    quantity: number;
}

export interface CheckoutRequest {
    restaurantId: number;
    sessionId: string;
    tableNumber: number;
    items?: {
        menuItemId: string;
        variantId?: string;
        quantity: number;
    }[];
}
