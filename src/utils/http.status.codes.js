const HttpStatusCode = {
    // Success responses
    OK: 200, // Request succeeded
    CREATED: 201, // New resource created
    ACCEPTED: 202, // Request accepted but processing is ongoing
    NO_CONTENT: 204, // Request succeeded, but no content to return
    
    // Client error responses
    BAD_REQUEST: 400, // Client-side error (Invalid input)
    UNAUTHORIZED: 401, // User not authenticated
    FORBIDDEN: 403, // User authenticated but not allowed to perform this action
    NOT_FOUND: 404, // Resource not found
    CONFLICT: 409, // Conflict in request (e.g., duplicate data)
    GONE: 410, // Resource no longer available
    TOO_MANY_REQUESTS: 429, // Rate limit exceeded
    
    // Server error responses
    INTERNAL_SERVER_ERROR: 500, // Server-side error - Fixed the name!
    
    // Alternative names for backward compatibility
    INTERNAL_SERVER: 500 // Keep this if used elsewhere
};

export default HttpStatusCode;