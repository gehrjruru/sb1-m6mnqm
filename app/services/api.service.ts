import { Http, HttpResponse } from '@nativescript/core';
import { MikrotikConfig } from './api.config';

export class ApiService {
    private baseUrl: string;
    private auth: string;

    constructor(config: MikrotikConfig) {
        this.baseUrl = `${config.useSsl ? 'https' : 'http'}://${config.host}:${config.port}/rest`;
        this.auth = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
    }

    private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        try {
            const response = await Http.request({
                url: `${this.baseUrl}${endpoint}`,
                method: method,
                headers: {
                    'Authorization': this.auth,
                    'Content-Type': 'application/json'
                },
                content: body ? JSON.stringify(body) : undefined,
                timeout: 10000 // 10 second timeout
            });

            if (response.statusCode === 401) {
                throw new Error('Invalid username or password');
            }

            if (response.statusCode === 403) {
                throw new Error('Insufficient permissions');
            }

            if (response.statusCode >= 400) {
                throw new Error(`Connection failed (${response.statusCode})`);
            }

            return response.content.toJSON();
        } catch (error) {
            if (error.message.includes('ECONNREFUSED')) {
                throw new Error('Could not connect to router. Please check IP address and port.');
            }
            if (error.message.includes('ETIMEDOUT')) {
                throw new Error('Connection timed out. Please check your network connection.');
            }
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.request('/system/resource');
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            throw error;
        }
    }

    async getProfiles(): Promise<any[]> {
        return this.request('/ip/hotspot/user/profile');
    }

    async generateUser(profile: string, server: string): Promise<any> {
        const randomString = () => Math.random().toString(36).substring(7).toUpperCase();
        return this.request('/ip/hotspot/user/add', 'POST', {
            profile,
            server,
            name: `VOUCHER_${randomString()}`,
            password: randomString()
        });
    }
}