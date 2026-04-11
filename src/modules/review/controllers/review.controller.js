import reviewService from "../services/review.service.js";
import catchAsync from "../../../frameworks/middlewares/catch.async.js";
import { sendSuccess } from "../../../utils/response.handler.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

function userIdFromReq(req) {
    return req.user?._id ?? req.user?.id;
}

export const reviewController = {
    listByProduct: catchAsync(async (req, res) => {
        const { productId } = req.params;
        const result = await reviewService.listByProduct(productId, req.query);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
    }),

    create: catchAsync(async (req, res) => {
        const userId = userIdFromReq(req);
        const { productId } = req.params;
        const result = await reviewService.create(userId, productId, req.body);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.CREATED);
    }),

    update: catchAsync(async (req, res) => {
        const userId = userIdFromReq(req);
        const { reviewId } = req.params;
        const result = await reviewService.update(userId, reviewId, req.body);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
    }),

    deleteOwn: catchAsync(async (req, res) => {
        const userId = userIdFromReq(req);
        const { reviewId } = req.params;
        const result = await reviewService.deleteOwn(userId, reviewId);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
    }),

    report: catchAsync(async (req, res) => {
        const reporterUserId = userIdFromReq(req);
        const { reviewId } = req.params;
        const result = await reviewService.report(reporterUserId, reviewId, req.body);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.CREATED);
    }),

    adminRemove: catchAsync(async (req, res) => {
        const { reviewId } = req.params;
        const result = await reviewService.adminRemove(reviewId);
        return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
    }),
};
