
/**
 * Custom Logger to standardize output formats and replace direct console calls
 */
class Logger {
    public info(message: string, meta?: any): void {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] ${timestamp}: ${message}`, meta ? meta : '');
    }

    public error(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp}: ${message}`, error ? error : '');
    }

    public warn(message: string, meta?: any): void {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN] ${timestamp}: ${message}`, meta ? meta : '');
    }

    public debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV !== 'production') {
            const timestamp = new Date().toISOString();
            console.debug(`[DEBUG] ${timestamp}: ${message}`, meta ? meta : '');
        }
    }
}

export const logger = new Logger();
