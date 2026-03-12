import VehicleService from '../services/vehicle.service.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';

class VehicleController {
    constructor() {
        this.vehicleService = new VehicleService();
    }

    // Vehicle Make operations
    createMake = catchAsync(async (req, res) => {
        const result = await this.vehicleService.createMake(req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    getMakeById = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.getMakeById(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getAllMakes = catchAsync(async (req, res) => {
        const filters = req.query;
        const result = await this.vehicleService.getAllMakes(filters);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    updateMake = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.updateMake(id, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    deleteMake = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.deleteMake(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Vehicle Model operations
    createModel = catchAsync(async (req, res) => {
        const result = await this.vehicleService.createModel(req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    getModelById = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.getModelById(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getAllModels = catchAsync(async (req, res) => {
        const filters = req.query;
        const result = await this.vehicleService.getAllModels(filters);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    updateModel = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.updateModel(id, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    deleteModel = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.deleteModel(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Vehicle Variant operations
    createVariant = catchAsync(async (req, res) => {
        const result = await this.vehicleService.createVariant(req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    getVariantById = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.getVariantById(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getAllVariants = catchAsync(async (req, res) => {
        const filters = req.query;
        const result = await this.vehicleService.getAllVariants(filters);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    updateVariant = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.updateVariant(id, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    deleteVariant = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.deleteVariant(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Hierarchy operations
    getVehicleHierarchy = catchAsync(async (req, res) => {
        const result = await this.vehicleService.getVehicleHierarchy();
        return sendSuccess(res, result.message, result.data, 200);
    });

    getModelsByMake = catchAsync(async (req, res) => {
        const { makeId } = req.params;
        const result = await this.vehicleService.getModelsByMake(makeId);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    getVariantsByModel = catchAsync(async (req, res) => {
        const { modelId } = req.params;
        const result = await this.vehicleService.getVariantsByModel(modelId);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    findCompatibleVariants = catchAsync(async (req, res) => {
        const filters = req.query;
        const result = await this.vehicleService.findCompatibleVariants(filters);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    searchVehicles = catchAsync(async (req, res) => {
        const { q } = req.query;
        const result = await this.vehicleService.searchVehicles(q);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });

    getCompleteVehicleInfo = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.vehicleService.getCompleteVehicleInfo(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get unique vehicle models (for your original requirement)
    getUniqueVehicleModels = catchAsync(async (req, res) => {
        const result = await this.vehicleService.getUniqueVehicleModels();
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });
}

export default VehicleController; 