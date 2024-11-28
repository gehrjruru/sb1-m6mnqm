import { Observable, Frame } from '@nativescript/core';
import { MikrotikConfig, DEFAULT_CONFIG } from '../services/api.config';
import { ValidationService } from '../services/validation.service';

export class ConnectionModalViewModel extends Observable {
    private _config: MikrotikConfig;
    private _errorMessage: string = '';
    private _isLoading: boolean = false;
    private closeCallback: Function;

    constructor(params: any) {
        super();
        this._config = { ...DEFAULT_CONFIG, host: '192.168.1.1' };
        this.closeCallback = params.closeCallback;
    }

    get config(): MikrotikConfig {
        return this._config;
    }

    set config(value: MikrotikConfig) {
        this._config = value;
        this.notifyPropertyChange('config', value);
    }

    get errorMessage(): string {
        return this._errorMessage;
    }

    set errorMessage(value: string) {
        this._errorMessage = value;
        this.notifyPropertyChange('errorMessage', value);
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    set isLoading(value: boolean) {
        this._isLoading = value;
        this.notifyPropertyChange('isLoading', value);
    }

    async onConnect() {
        try {
            const errors = ValidationService.validateRouterConfig(
                this.config.host,
                this.config.username,
                this.config.password
            );

            if (errors.length > 0) {
                this.errorMessage = errors.join('\n');
                return;
            }

            this.isLoading = true;
            this.errorMessage = '';

            const page = Frame.topmost().currentPage;
            if (page?.modal) {
                page.modal.close(this.config);
            }
        } catch (error) {
            this.errorMessage = error.message || 'Connection failed';
        } finally {
            this.isLoading = false;
        }
    }

    onCancel() {
        const page = Frame.topmost().currentPage;
        if (page?.modal) {
            page.modal.close();
        }
    }

    onTextFieldFocus() {
        this.errorMessage = '';
    }
}