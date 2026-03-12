export class VehicleVariantEntity {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.modelId = data.modelId || null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.yearRange = {
      startYear: data.yearRange?.startYear || null,
      endYear: data.yearRange?.endYear || null
    };
    this.engineSpecs = data.engineSpecs || '';
    this.fuelType = data.fuelType || 'Petrol';
    this.transmission = data.transmission || 'Manual';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.model = data.model || null;
    this.make = data.make || null;
    this.fullName = data.fullName || '';
    this.isCurrentYearCompatible = data.isCurrentYearCompatible || false;
  }

  static fromModel(model) {
    if (!model) return null;
    return new VehicleVariantEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => VehicleVariantEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      modelId: this.modelId,
      name: this.name,
      slug: this.slug,
      yearRange: this.yearRange,
      engineSpecs: this.engineSpecs,
      fuelType: this.fuelType,
      transmission: this.transmission,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      model: this.model,
      make: this.make,
      fullName: this.fullName,
      isCurrentYearCompatible: this.isCurrentYearCompatible
    };
  }

  toCreateDTO() {
    return {
      modelId: this.modelId,
      name: this.name,
      slug: this.slug,
      yearRange: this.yearRange,
      engineSpecs: this.engineSpecs,
      fuelType: this.fuelType,
      transmission: this.transmission,
      isActive: this.isActive
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.modelId !== undefined) dto.modelId = this.modelId;
    if (this.name !== undefined) dto.name = this.name;
    if (this.slug !== undefined) dto.slug = this.slug;
    if (this.yearRange !== undefined) dto.yearRange = this.yearRange;
    if (this.engineSpecs !== undefined) dto.engineSpecs = this.engineSpecs;
    if (this.fuelType !== undefined) dto.fuelType = this.fuelType;
    if (this.transmission !== undefined) dto.transmission = this.transmission;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    return dto;
  }
} 