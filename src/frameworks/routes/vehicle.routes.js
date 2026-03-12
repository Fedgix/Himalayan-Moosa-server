import VehicleController from '../../modules/vehicle/controllers/vehicle.controller.js';
import { Router } from 'express';

const router = Router();
const vehicleController = new VehicleController();

// Vehicle Make routes
router.post('/makes', vehicleController.createMake);
router.get('/makes', vehicleController.getAllMakes);
router.get('/makes/:id', vehicleController.getMakeById);
router.put('/makes/:id', vehicleController.updateMake);
router.delete('/makes/:id', vehicleController.deleteMake);

// Vehicle Model routes
router.post('/models', vehicleController.createModel);
router.get('/models', vehicleController.getAllModels);
router.get('/models/:id', vehicleController.getModelById);
router.put('/models/:id', vehicleController.updateModel);
router.delete('/models/:id', vehicleController.deleteModel);

// Vehicle Variant routes
router.post('/variants', vehicleController.createVariant);
router.get('/variants', vehicleController.getAllVariants);
router.get('/variants/:id', vehicleController.getVariantById);
router.put('/variants/:id', vehicleController.updateVariant);
router.delete('/variants/:id', vehicleController.deleteVariant);

// Hierarchy routes
router.get('/hierarchy', vehicleController.getVehicleHierarchy);
router.get('/makes/:makeId/models', vehicleController.getModelsByMake);
router.get('/models/:modelId/variants', vehicleController.getVariantsByModel);
router.get('/compatible-variants', vehicleController.findCompatibleVariants);

// Search and utility routes
router.get('/search', vehicleController.searchVehicles);
router.get('/unique-models', vehicleController.getUniqueVehicleModels);
router.get('/complete-info/:id', vehicleController.getCompleteVehicleInfo);

export default router; 