export interface Package {
    id: string;
    name: string;
    duration: string;
    price: number;
    dataLimit?: string;
    speedLimit?: string;
}

export interface Voucher {
    code: string;
    package: Package;
    createdAt: Date;
    expiresAt: Date;
    status: 'active' | 'used' | 'expired';
}