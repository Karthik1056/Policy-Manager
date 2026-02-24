type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

const asyncHandler = <T>(fn: AsyncFunction<T>) => {
    return async (...args: any[]): Promise<T> => {
        return await fn(...args);
    };
};

export default asyncHandler;
