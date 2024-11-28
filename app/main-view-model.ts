import { Observable, Utils, ApplicationSettings, ShowModalOptions } from '@nativescript/core';
import { MikrotikService } from './services/mikrotik.service';
import { Package, Voucher } from './models/package.model';
import { MikrotikConfig } from './services/api.config';

export class MainViewModel extends Observable {
    private mikrotikService: MikrotikService;
    private _packages: Array<Package> = [];
    private _currentVoucher: Voucher | null = null;
    private _isConnected: boolean = false;

    constructor() {
        super();
        this.mikrotikService = new MikrotikService();
        this._isConnected = this.mikrotikService.isConnected;
        
        if (this._isConnected) {
            this.loadPackages();
        }
    }

    get packages(): Array<Package> {
        return this._packages;
    }

    set packages(value: Array<Package>) {
        if (this._packages !== value) {
            this._packages = value;
            this.notifyPropertyChange('packages', value);
        }
    }

    get currentVoucher(): Voucher | null {
        return this._currentVoucher;
    }

    set currentVoucher(value: Voucher | null) {
        if (this._currentVoucher !== value) {
            this._currentVoucher = value;
            this.notifyPropertyChange('currentVoucher', value);
        }
    }

    get isConnected(): boolean {
        return this._isConnected;
    }

    set isConnected(value: boolean) {
        if (this._isConnected !== value) {
            this._isConnected = value;
            this.notifyPropertyChange('isConnected', value);
        }
    }

    async showConnectionModal() {
        const options: ShowModalOptions = {
            context: {},
            closeCallback: async (config: MikrotikConfig) => {
                if (config) {
                    try {
                        const connected = await this.mikrotikService.connect(config);
                        this.isConnected = connected;
                        if (connected) {
                            await this.loadPackages();
                        }
                    } catch (error) {
                        console.error('Connection failed:', error);
                    }
                }
            },
            fullscreen: false
        };
        
        const page = require('tns-core-modules/ui/frame').topmost().currentPage;
        page.showModal('components/connection-modal', options);
    }

    async loadPackages() {
        try {
            const packages = await this.mikrotikService.getPackages();
            this.packages = packages;
        } catch (error) {
            console.error('Failed to load packages:', error);
        }
    }

    async onPackageSelect(args: any) {
        const selectedPackage = this.packages[args.index];
        try {
            const voucher = await this.mikrotikService.generateVoucher(selectedPackage.id);
            this.currentVoucher = voucher;
        } catch (error) {
            console.error('Failed to generate voucher:', error);
        }
    }

    onCopyVoucher() {
        if (this.currentVoucher) {
            Utils.copyToClipboard(this.currentVoucher.code);
        }
    }

    async onShareVoucher() {
        if (this.currentVoucher) {
            const message = `Your voucher code: ${this.currentVoucher.code}\n` +
                          `Package: ${this.currentVoucher.package.name}\n` +
                          `Valid for: ${this.currentVoucher.package.duration}`;
            
            try {
                await Utils.openUrl(`whatsapp://send?text=${encodeURIComponent(message)}`);
            } catch (error) {
                console.error('Failed to share voucher:', error);
            }
        }
    }
}