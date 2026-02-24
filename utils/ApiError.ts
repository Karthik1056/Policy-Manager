import { ApiError as ApiErrorInterface } from "@/interface/interface";


class ApiError extends Error implements ApiErrorInterface {
    statusCode: number;
    data: null;
    success: boolean;
    errors: any[];

    constructor(
        statusCode: number,
        message: string = "Something Went wrong",
        errors: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };