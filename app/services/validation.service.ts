export class ValidationService {
    static isValidIpAddress(ip: string): boolean {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    static validateRouterConfig(host: string, username: string, password: string): string[] {
        const errors: string[] = [];

        if (!host) {
            errors.push('Router IP address is required');
        } else if (!this.isValidIpAddress(host)) {
            errors.push('Invalid IP address format');
        }

        if (!username) {
            errors.push('Username is required');
        } else if (username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }

        if (!password) {
            errors.push('Password is required');
        } else if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        return errors;
    }
}</content>