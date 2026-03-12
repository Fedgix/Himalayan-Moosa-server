export const sendSuccess = (res, message, data = {}, statusCode=200)=>{
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    })
}

export const responseHandler = (res, statusCode, data = {}, message = 'Success', meta = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...meta
    });
};

export default { sendSuccess, responseHandler };