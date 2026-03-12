export class VehicleMakeEntity {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.logo = data.logo || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.displayOrder = data.displayOrder || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.modelsCount = data.modelsCount || 0;
    this.models = data.models || [];
  }

  static fromModel(model) {
    if (!model) return null;
    return new VehicleMakeEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => VehicleMakeEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      logo: this.logo,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      modelsCount: this.modelsCount,
      models: this.models
    };
  }

  toCreateDTO() {
    return {
      name: this.name,
      slug: this.slug,
      logo: this.logo,
      isActive: this.isActive,
      displayOrder: this.displayOrder
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.name !== undefined) dto.name = this.name;
    if (this.slug !== undefined) dto.slug = this.slug;
    if (this.logo !== undefined) dto.logo = this.logo;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    if (this.displayOrder !== undefined) dto.displayOrder = this.displayOrder;
    return dto;
  }
} 