export class VehicleModelEntity {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.makeId = data.makeId || null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.bannerImage = data.bannerImage || '';
    this.image = data.image || '';
    this.description = data.description || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.displayOrder = data.displayOrder || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.make = data.make || null;
    this.variantsCount = data.variantsCount || 0;
    this.variants = data.variants || [];
    this.fullName = data.fullName || '';
  }

  static fromModel(model) {
    if (!model) return null;
    return new VehicleModelEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => VehicleModelEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      makeId: this.makeId,
      name: this.name,
      slug: this.slug,
      bannerImage: this.bannerImage,
      image: this.image,
      description: this.description,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      make: this.make,
      variantsCount: this.variantsCount,
      variants: this.variants,
      fullName: this.fullName
    };
  }

  toCreateDTO() {
    return {
      makeId: this.makeId,
      name: this.name,
      slug: this.slug,
      bannerImage: this.bannerImage,
      image: this.image,
      description: this.description,
      isActive: this.isActive,
      displayOrder: this.displayOrder
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.makeId !== undefined) dto.makeId = this.makeId;
    if (this.name !== undefined) dto.name = this.name;
    if (this.slug !== undefined) dto.slug = this.slug;
    if (this.bannerImage !== undefined) dto.bannerImage = this.bannerImage;
    if (this.image !== undefined) dto.image = this.image;
    if (this.description !== undefined) dto.description = this.description;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    if (this.displayOrder !== undefined) dto.displayOrder = this.displayOrder;
    return dto;
  }
} 