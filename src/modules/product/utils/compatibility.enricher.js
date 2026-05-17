import VehicleMake from '../../vehicle/models/vehicle-make.model.js';
import VehicleModel from '../../vehicle/models/vehicle-model.model.js';
import VehicleVariant from '../../vehicle/models/vehicle-variant.model.js';

const toId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return (value._id ?? value.id ?? value.variantId)?.toString?.() ?? null;
  }
  return String(value);
};

const mapMake = (make) => {
  if (!make) return null;
  if (typeof make === 'object' && make.name) {
    return {
      id: toId(make._id ?? make.id ?? make),
      name: make.name,
      slug: make.slug ?? null
    };
  }
  return { id: toId(make), name: null, slug: null };
};

const mapModel = (model) => {
  if (!model) return null;
  if (typeof model === 'object' && model.name) {
    const makeRef = model.makeId && typeof model.makeId === 'object' ? model.makeId : model.make;
    return {
      id: toId(model._id ?? model.id ?? model),
      name: model.name,
      slug: model.slug ?? null,
      make: mapMake(makeRef)
    };
  }
  return { id: toId(model), name: null, slug: null, make: null };
};

const mapVariant = (variant, entryYearRange) => {
  if (!variant) return null;

  if (typeof variant === 'object' && variant.name) {
    const modelRef = variant.modelId && typeof variant.modelId === 'object' ? variant.modelId : variant.model;
    const makeRef = modelRef?.makeId && typeof modelRef.makeId === 'object' ? modelRef.makeId : modelRef?.make;

    return {
      variantId: toId(variant._id ?? variant.id ?? variant.variantId),
      name: variant.name,
      slug: variant.slug ?? null,
      yearRange: entryYearRange ?? variant.yearRange ?? null,
      model: mapModel(modelRef),
      make: mapMake(makeRef)
    };
  }

  return {
    variantId: toId(variant.variantId ?? variant),
    name: null,
    slug: null,
    yearRange: entryYearRange ?? null,
    model: null,
    make: null
  };
};

/** Build API compatibility from mongoose doc (uses populated virtuals when present). */
export function formatCompatibilityFromDocument(raw = {}) {
  const base = raw.compatibility || {};
  const variantById = new Map();

  (raw.compatibleVariants || []).forEach((variant) => {
    const id = toId(variant?._id ?? variant?.id);
    if (id) variantById.set(id, variant);
  });

  const specificVariants = (base.specificVariants || []).map((entry) => {
    const variantId = toId(entry?.variantId ?? entry);
    const populated = variantById.get(variantId);
    return mapVariant(populated || { variantId }, entry?.yearRange);
  });

  const populatedMakes = raw.compatibleMakes;
  const compatibleMakes = Array.isArray(populatedMakes) && populatedMakes.some((m) => m && typeof m === 'object' && m.name)
    ? populatedMakes.map(mapMake).filter(Boolean)
    : (base.compatibleMakes || []).map(mapMake).filter(Boolean);

  const populatedModels = raw.compatibleModels;
  const compatibleModels = Array.isArray(populatedModels) && populatedModels.some((m) => m && typeof m === 'object' && m.name)
    ? populatedModels.map(mapModel).filter(Boolean)
    : (base.compatibleModels || []).map(mapModel).filter(Boolean);

  return {
    type: base.type || 'universal',
    notes: base.notes || '',
    specificVariants,
    compatibleModels,
    compatibleMakes
  };
}

/** Fill missing compatibility names from DB (batch-friendly for lists). */
export async function enrichCompatibilityFromDb(compatibility) {
  if (!compatibility) return compatibility;

  const makeIds = new Set();
  const modelIds = new Set();
  const variantIds = new Set();

  (compatibility.compatibleMakes || []).forEach((m) => {
    const id = toId(m?.id ?? m);
    if (id && !m?.name) makeIds.add(id);
  });

  (compatibility.compatibleModels || []).forEach((m) => {
    const id = toId(m?.id ?? m);
    if (id && !m?.name) modelIds.add(id);
  });

  (compatibility.specificVariants || []).forEach((v) => {
    const id = toId(v?.variantId ?? v?.id ?? v);
    if (id && !v?.name) variantIds.add(id);
  });

  if (!makeIds.size && !modelIds.size && !variantIds.size) {
    return compatibility;
  }

  const [makes, models, variants] = await Promise.all([
    makeIds.size
      ? VehicleMake.find({ _id: { $in: [...makeIds] } }).select('name slug').lean()
      : [],
    modelIds.size
      ? VehicleModel.find({ _id: { $in: [...modelIds] } })
          .select('name slug makeId')
          .populate('makeId', 'name slug')
          .lean()
      : [],
    variantIds.size
      ? VehicleVariant.find({ _id: { $in: [...variantIds] } })
          .select('name slug yearRange modelId')
          .populate({ path: 'modelId', select: 'name slug', populate: { path: 'makeId', select: 'name slug' } })
          .lean()
      : []
  ]);

  const makeMap = new Map(makes.map((m) => [toId(m._id), m]));
  const modelMap = new Map(models.map((m) => [toId(m._id), m]));
  const variantMap = new Map(variants.map((v) => [toId(v._id), v]));

  return {
    ...compatibility,
    compatibleMakes: (compatibility.compatibleMakes || []).map((m) => {
      if (m?.name) return m;
      const doc = makeMap.get(toId(m?.id ?? m));
      return doc ? mapMake(doc) : mapMake(m);
    }),
    compatibleModels: (compatibility.compatibleModels || []).map((m) => {
      if (m?.name) return m;
      const doc = modelMap.get(toId(m?.id ?? m));
      return doc ? mapModel(doc) : mapModel(m);
    }),
    specificVariants: (compatibility.specificVariants || []).map((v) => {
      if (v?.name) return v;
      const doc = variantMap.get(toId(v?.variantId ?? v?.id ?? v));
      return doc ? mapVariant(doc, v?.yearRange) : mapVariant(v, v?.yearRange);
    })
  };
}

export async function enrichProductsCompatibility(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const makeIds = new Set();
  const modelIds = new Set();
  const variantIds = new Set();

  products.forEach((product) => {
    const c = product?.compatibility;
    if (!c) return;

    (c.compatibleMakes || []).forEach((m) => {
      const id = toId(m?.id ?? m);
      if (id && !m?.name) makeIds.add(id);
    });
    (c.compatibleModels || []).forEach((m) => {
      const id = toId(m?.id ?? m);
      if (id && !m?.name) modelIds.add(id);
    });
    (c.specificVariants || []).forEach((v) => {
      const id = toId(v?.variantId ?? v?.id ?? v);
      if (id && !v?.name) variantIds.add(id);
    });
  });

  if (!makeIds.size && !modelIds.size && !variantIds.size) {
    return products;
  }

  const [makes, models, variants] = await Promise.all([
    makeIds.size
      ? VehicleMake.find({ _id: { $in: [...makeIds] } }).select('name slug').lean()
      : [],
    modelIds.size
      ? VehicleModel.find({ _id: { $in: [...modelIds] } })
          .select('name slug makeId')
          .populate('makeId', 'name slug')
          .lean()
      : [],
    variantIds.size
      ? VehicleVariant.find({ _id: { $in: [...variantIds] } })
          .select('name slug yearRange modelId')
          .populate({ path: 'modelId', select: 'name slug', populate: { path: 'makeId', select: 'name slug' } })
          .lean()
      : []
  ]);

  const makeMap = new Map(makes.map((m) => [toId(m._id), m]));
  const modelMap = new Map(models.map((m) => [toId(m._id), m]));
  const variantMap = new Map(variants.map((v) => [toId(v._id), v]));

  return products.map((product) => {
    if (!product?.compatibility) return product;

    const c = product.compatibility;
    return {
      ...product,
      compatibility: {
        ...c,
        compatibleMakes: (c.compatibleMakes || []).map((m) => {
          if (m?.name) return m;
          const doc = makeMap.get(toId(m?.id ?? m));
          return doc ? mapMake(doc) : mapMake(m);
        }),
        compatibleModels: (c.compatibleModels || []).map((m) => {
          if (m?.name) return m;
          const doc = modelMap.get(toId(m?.id ?? m));
          return doc ? mapModel(doc) : mapModel(m);
        }),
        specificVariants: (c.specificVariants || []).map((v) => {
          if (v?.name) return v;
          const doc = variantMap.get(toId(v?.variantId ?? v?.id ?? v));
          return doc ? mapVariant(doc, v?.yearRange) : mapVariant(v, v?.yearRange);
        })
      }
    };
  });
}
