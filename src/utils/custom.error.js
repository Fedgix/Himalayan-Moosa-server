class CustomError extends Error{
    constructor(error, statusCode, isOperational, details){
        let message;
        if(error instanceof Error){
            message = error.message;
        }else if(error && typeof error ==='object' && 'message' in error){
            message = String(error.message);
        }else if(typeof error === 'string'){
            message = error;
        }else{
            message = "oops something went wrong!";
        }

        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode <500? 'fail' : 'error';
        this.isOperational = true;
        this.details = details
    }
    
    toJson() {
        return {
            status: this.status,
            error: this.message,
            ...(this.details && { details: this.details })
        };
    }
    
}

export default CustomError