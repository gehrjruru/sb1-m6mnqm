import { Observable, ApplicationSettings } from '@nativescript/core';
import { ApiService } from './api.service';
import { MikrotikConfig, DEFAULT_CONFIG } from './api.config';
import { Package, Voucher } from '../models/package.model';

export class MikrotikService extends Observable {
    private apiService: ApiService | null = null;
    private _isConnected: boolean = false;
    private _lastError: string = '';

    constructor() {
        super();
        this.loadConfig();
    }

    private loadConfig(): void {
        const savedConfig = ApplicationSettings.getString('mikrotik.config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.initializeApi(config);
        }
    }

    private initializeApi(config: MikrotikConfig): void {
        this.apiService = new ApiService(config);
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    get lastError(): string {
        return this._lastError;
    }

    async connect(config: MikrotikConfig): Promise<boolean> {
        try {
            this.initializeApi(config);
            
            if (!this.apiService) {
                throw new Error('API service not initialized');
            }

            this._isConnected = await this.apiService.testConnection();
            
            if (this._isConnected) {
                ApplicationSettings.setString('mikrotik.config', JSON.stringify(config));
                this.notifyPropertyChange('isConnected', this._isConnected);
                this._lastError = '';
            }

            return this._isConnected;
        } catch (error) {
            console.error('Connection failed:', error);
            this._isConnected = false;
            this._lastError = error.message;
            this.notifyPropertyChange('isConnected', this._isConnected);
            this.notifyPropertyChange('lastError', this._lastError);
            throw error;
        }
    }

    async getPackages(): Promise<Package[]> {
        if (!this.apiService || !this._isConnected) {
            throw new Error('Not connected to MikroTik');
        }

        try {
            const profiles = await this.apiService.getProfiles();
            return profiles.map(profile => ({
                id: profile.name,
                name: profile.name,
                duration: this.formatDuration(profile['session-timeout']),
                price: 0,
                dataLimit: this.formatDataLimit(profile['rate-limit']),
                speedLimit: this.formatSpeedLimit(profile['rate-limit'])
            }));
        } catch (error) {
            console.error('Failed to fetch packages:', error);
            throw error;
        }
    }

    private formatDuration(timeout: string): string {
        if (!timeout) return 'Unlimited';
        const seconds = parseInt(timeout);
        const hours = Math.floor(seconds / 3600);
        return hours > 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
    }

    private formatDataLimit(limit: string): string {
        if (!limit) return 'Unlimited';
        const match = limit.match(/(\d+)([kmg])/i);
        if (!match) return limit;
        const [_, num, unit] = match;
        return `${num}${unit.toUpperCase()}B`;
    }

    private formatSpeedLimit(limit: string): string {
        if (!limit) return 'Unlimited';
        const match = limit.match(/(\d+[kmg])?\/(\d+[kmg])/i);
        if (!match) return limit;
        return `${match[1] || '0'} ↓ / ${match[2]} ↑`;
    }

    async generateVoucher(packageId: string): Promise<Voucher> {
        if (!this.apiService || !this._isConnected) {
            throw new Error('Not connected to MikroTik');
        }

        try {
            const user = await this.apiService.generateUser(packageId, 'hotspot1');
            const selectedPackage = (await this.getPackages())
                .find(pkg => pkg.id === packageId);

            if (!selectedPackage) {
                throw new Error('Package not found');
            }

            return {
                code: user.password,
                package: selectedPackage,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: 'active'
            };
        } catch (error) {
            console.error('Failed to generate voucher:', error);
            throw error;
        }
    }
}