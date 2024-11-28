export interface MikrotikConfig {
    host: string;
    username: string;
    password: string;
    port: number;
    useSsl: boolean;
}

export const DEFAULT_CONFIG: MikrotikConfig = {
    host: '',
    username: '',
    password: '',
    port: 443,
    useSsl: true
};