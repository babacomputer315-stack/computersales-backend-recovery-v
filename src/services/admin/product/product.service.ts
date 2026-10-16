import { db } from "../../../db/client";
import {
  products,
  productToTags,
  productToCategories,
  productImages,
  productVariations,
  variationAttributeValues,
  productSpecifications,
  File,
} from "../../../db/schema/index";
import { and, eq, exists, ilike, inArray, or, sql } from "drizzle-orm";
import { NotFoundException } from "../../../utils/apiResponse";
import { productBundles } from "../../../db/schema/product/productBundles";
import { productBundleItems } from "../../../db/schema/product/productBundleItems";
import { productSpecificationOptions } from "../../../db/schema/product/productSpecificationOptions";
import { slugify } from "../../../utils/slugify";
import { cleanHtml } from "../../../utils/htmlCleaner";

// const isValidDate = (date: Date) =>
//   date instanceof Date && !isNaN(date.getTime());
const isValidDate = (date: any): date is Date =>
  date instanceof Date || !isNaN(Date.parse(date));

type CreateProductInput = {
  name: string;
  nameEn?: string;
  sku: string;
  regularPrice: number;
  salePrice?: number;
  saleDate?: [string, string];
  isPublished: boolean;
  isFeatured: boolean;
  isSinglePurchase?: boolean;
  shortDescription?: string;
  longDescription?: string;
  htmlDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  saleStartDate: Date;
  saleEndDate: Date;
  slug?: string;
  stockQuantity?: number;
  stockStatus: "instock" | "outofstock";
  showStock?: boolean;
  shippingClass?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  primaryCategoryId: number;
  selectedCategoryIds: number[];
  tags: number[];
  images?: {
    fileId: number;
    isThumbnail?: boolean;
    order?: number;
    alt?: string;
  }[];
  attributes: VariantCombination[];
  bundleItems?: number[];
  discountType?: "percentage" | "fixed";
  discountValue?: number;
};

export interface VariantCombination {
  attributes: {
    attributeId: number;
    valueId: number;
  }[];
  price: string;
  salePrice: string;
  saleStartDate?: Date;
  saleEndDate?: Date;
  stock: string;
  sku: string;
  purchaseLimit?: number;
  image: (File & { alt?: string }) | null;
}

export class ProductService {
  static async getAll(
    options: {
      page?: number;
      limit?: number;
      sortBy?: keyof typeof products.$inferSelect;
      sortOrder?: "asc" | "desc";
      filters?: {
        name?: string;
        isPublished?: boolean;
        categoryId?: number; // تک‌تایی
        categoryIds?: number[]; // چندتایی
        tagId?: number; // 🔹 اضافه شد: فیلتر بر اساس تگ
        isFeatured?: boolean;
        brandId?: number;
      };
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = options;

    const whereClauses = [];

    // 🔹 فیلتر نام
    if (filters.name) {
      whereClauses.push(
        or(
          ilike(products.name, `%${filters.name}%`),
          ilike(products.nameEn, `%${filters.name}%`),
          ilike(products.slug, `%${filters.name}%`),
          ilike(products.sku, `%${filters.name}%`)
        )
      );
    }

    // 🔹 فیلتر انتشار
    if (filters.isPublished !== undefined) {
      whereClauses.push(eq(products.isPublished, filters.isPublished));
    }

    // await this.updateAllSlugs();

    // 🔹 فیلتر دسته‌بندی (تکی یا چندتایی)
    if (filters.categoryId) {
      // فقط primary
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                eq(productToCategories.categoryId, filters.categoryId)
                // eq(productToCategories.isPrimary, true)
              )
            )
        )
      );
    }

    if (filters.categoryIds?.length) {
      // همه محصولات مرتبط
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToCategories)
            .where(
              and(
                eq(productToCategories.productId, products.id),
                inArray(productToCategories.categoryId, filters.categoryIds)
              )
            )
        )
      );
    }

    // 🔹 فیلتر تگ (tagId)
    if (filters?.tagId) {
      whereClauses.push(
        exists(
          db
            .select()
            .from(productToTags)
            .where(
              and(
                eq(productToTags.productId, products.id),
                eq(productToTags.tagId, filters.tagId)
              )
            )
        )
      );
    }

    if (filters?.isFeatured) {
      whereClauses.push(eq(products.isFeatured, filters.isFeatured));
    }

    if (filters?.brandId) {
      whereClauses.push(eq(products.brandId, filters.brandId));
    }

    const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    // 🔹 صفحه‌بندی
    const offset = (page - 1) * limit;

    // 🔹 کوئری اصلی
    const data = await db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: (fields, { asc, desc }) =>
        sortOrder === "asc"
          ? asc(fields[sortBy as keyof typeof fields])
          : desc(fields[sortBy as keyof typeof fields]),
      with: {
        brand: true,
        shippingClass: true,
        tags: { with: { tag: true } },
        images: { with: { file: true } },
        categories: { with: { category: true } },
        variations: {
          with: {
            attributeValues: {
              with: {
                attributeValue: { with: { attribute: true } },
              },
            },
            imageFile: true,
          },
        },
      },
    });

    // 🔹 گرفتن تعداد کل برای pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(where ?? sql`true`);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  // static async migrateProducts() {
  //   const allProducts = await db.query.products.findMany();
  //   console.log("allProducts", allProducts.length);
  //   for (const product of allProducts) {
  //     const cleanedHtml = cleanHtml(product.shortDescription || "");
  //     await db
  //       .update(products)
  //       .set({ shortDescription: cleanedHtml })
  //       .where(eq(products.id, product.id));
  //   }
  // }

  static async updateAllSlugs() {
    const allProducts = await db.select().from(products);

    const usedSlugs = new Set<string>();

    for (const product of allProducts) {
      let baseSlug =
        product.slug?.replace(/ /g, "-")?.trim() ??
        product.nameEn?.replace(/ /g, "-")?.trim() ??
        product.name?.replace(/ /g, "-")?.trim();

      if (!baseSlug) continue;

      let newSlug = baseSlug;
      let counter = 1;

      // اطمینان از اینکه slug تکراری نشه
      while (usedSlugs.has(newSlug)) {
        newSlug = `${baseSlug}-${counter++}`;
      }

      usedSlugs.add(newSlug);

      if (newSlug !== product.slug) {
        try {
          await db
            .update(products)
            .set({ slug: newSlug })
            .where(eq(products.id, product.id));
        } catch (err: any) {
          if (err.code === "23505") {
            console.error(
              `⚠️ Duplicate slug skipped for product ${product.id}`
            );
          } else {
            console.error(`❌ Error updating product ${product.id}:`, err);
          }
        }
      }
    }

    console.log("✅ All product slugs updated safely.");
  }

  static async getById(id: number) {
    const result = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        shippingClass: true,
        tags: {
          with: { tag: true },
        },
        images: {
          with: { file: true },
        },
        categories: {
          with: { category: true },
        },
        bundle: {
          with: {
            bundleItems: {
              with: {
                product: true,
              },
            },
          },
        },
        variations: {
          where: (productVariations, { eq }) =>
            eq(productVariations.isArchived, false),
          with: {
            attributeValues: {
              with: {
                attributeValue: {
                  with: { attribute: true },
                },
              },
            },
            imageFile: true,
          },
        },
      },
    });
    if (!result) throw new Error("Product not found");
    return result;
  }

  static async create(data: CreateProductInput) {
    const {
      primaryCategoryId,
      selectedCategoryIds,
      tags,
      images,
      attributes,
      saleStartDate,
      saleEndDate,
      isFeatured,
      bundleItems,
      discountType,
      discountValue,
      slug,
      ...productData
    } = data;

    // if (!data.slug) {
    //   throw new Error("اسلاگ نمی‌تواند خالی باشد");
    // }

    if (slug) {
      const existingProductSlug = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.slug, slug ?? ""),
      });

      if (existingProductSlug) {
        throw new Error(`محصولی با اسلاگ "${data.slug}" قبلاً ثبت شده است`);
      }
    }

    if (!slug) {
      const existingProductSlug = await db.query.products.findFirst({
        where: (products, { eq }) =>
          eq(
            products.slug,
            productData?.nameEn?.replace(/ /g, "-")?.trim() ??
              productData?.name?.replace(/ /g, "-")?.trim()
          ),
      });

      if (existingProductSlug) {
        throw new Error(
          `محصولی با اسلاگ "${
            data.nameEn?.replace(/ /g, "-")?.trim() ??
            data.name?.replace(/ /g, "-")?.trim()
          }" قبلاً ثبت شده است`
        );
      }
    }

    // if (!data.sku) {
    //   throw new Error("SKU نمی‌تواند خالی باشد");
    // }

    if (data?.sku) {
      const existingProductSku = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.sku, data.sku),
      });

      if (existingProductSku) {
        throw new Error(`محصولی با کد SKU "${data.sku}" از قبل وجود دارد`);
      }
    }

    const variantSkus = attributes.map((attr: any) => attr.sku).filter(Boolean);
    if (new Set(variantSkus).size !== variantSkus.length) {
      throw new Error("SKUهای واریانت‌ها نباید تکراری باشند");
    }

    for (const variationData of attributes) {
      if (variationData.sku) {
        if (variationData.sku === data.sku) {
          throw new Error(
            `SKU واریانت "${variationData.sku}" نباید با SKU اصلی محصول یکسان باشد`
          );
        }

        const existingProduct = await db.query.products.findFirst({
          where: (products, { eq }) => eq(products.sku, variationData.sku),
        });

        if (existingProduct) {
          throw new Error(
            `SKU "${variationData.sku}" قبلاً برای یک محصول دیگر استفاده شده است`
          );
        }

        const existingVariant = await db.query.productVariations.findFirst({
          where: (pv, { eq }) => eq(pv.sku, variationData.sku),
        });

        if (existingVariant) {
          throw new Error(
            `SKU "${variationData.sku}" قبلاً برای یک واریانت دیگر استفاده شده است`
          );
        }
      }
    }

    const cleanedHtml = cleanHtml(productData.htmlDescription || "");
    const cleanedShortDescription = cleanHtml(
      productData.shortDescription || ""
    );

    const [newProduct] = await db
      .insert(products)
      .values({
        ...productData,
        htmlDescription: cleanedHtml,
        shortDescription: cleanedShortDescription,
        slug:
          slug?.replace(/ /g, "-")?.trim() ??
          productData?.nameEn?.replace(/ /g, "-")?.trim() ??
          productData?.name?.replace(/ /g, "-")?.trim(),
        isFeatured,
        isSinglePurchase: data.isSinglePurchase || false,
        ...(isFeatured
          ? {
              saleStartDate: isValidDate(saleStartDate)
                ? new Date(saleStartDate)
                : undefined,
              saleEndDate: isValidDate(saleEndDate)
                ? new Date(saleEndDate)
                : undefined,
            }
          : {}),
      })
      .returning();

    const productId = newProduct.id;

    if (selectedCategoryIds?.length) {
      await db.insert(productToCategories).values(
        selectedCategoryIds.map((categoryId) => ({
          productId,
          categoryId,
          isPrimary: categoryId === primaryCategoryId,
        }))
      );
    }

    if (tags?.length) {
      await db.insert(productToTags).values(
        tags.map((tag) => ({
          productId,
          tagId: tag,
        }))
      );
    }

    if (
      images?.length &&
      images.map((image) => image.fileId).every((fileId) => fileId)
    ) {
      await db.insert(productImages).values(
        images.map((image) => ({
          ...image,
          productId,
        }))
      );
    }

    for (const variationData of attributes) {
      const {
        price = "",
        stock = "",
        sku = "",
        salePrice = "",
        saleStartDate = "",
        saleEndDate = "",
        purchaseLimit,
        image,
        attributes: variationAttributes,
      }: any = variationData;

      const [variation] = await db
        .insert(productVariations)
        .values({
          productId,
          price: price ? Number(price) : undefined,
          salePrice: salePrice ? Number(salePrice) : undefined,
          saleStartDate: isValidDate(saleStartDate)
            ? new Date(saleStartDate)
            : undefined,
          saleEndDate: isValidDate(saleEndDate)
            ? new Date(saleEndDate)
            : undefined,
          stockQuantity: stock ? Number(stock) : undefined,
          purchaseLimit: purchaseLimit ? Number(purchaseLimit) : undefined,
          stockStatus: "instock",
          sku: sku || undefined,
          imageFileId: image?.id || undefined,
          imageAlt: image?.alt || undefined,
        })
        .returning();

      // Insert variation attribute values
      for (const { attributeId, valueId } of variationAttributes) {
        await db.insert(variationAttributeValues).values({
          variationId: variation.id,
          attributeValueId: Number(valueId),
        });
      }
    }

    // بعد از اینکه newProduct ساخته شد
    if (data.bundleItems?.length) {
      // ایجاد خود Bundle
      const [newBundle] = await db
        .insert(productBundles)
        .values({
          // name: `${newProduct.name} - Bundle`,
          mainProductId: newProduct.id,
          discountType: data.discountType ?? "percentage", // می‌تونی بعداً از ورودی بگیری
          discountValue: data.discountValue?.toString() ?? "0",
          isActive: true,
        })
        .returning();

      await db.insert(productBundleItems).values(
        data.bundleItems.map((productId: number, index: number) => ({
          bundleId: newBundle.id,
          productId,
          // isRequired: true,
          displayOrder: index,
        }))
      );
    }

    return newProduct;
  }

  static async update(
    id: number,
    data: Partial<CreateProductInput> & {
      specifications?: {
        specificationId: number;
        value: string;
        optionId: number;
      }[];
    }
  ) {
    const existing = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, id),
      with: {
        variations: { with: { attributeValues: true } },
        images: true,
        tags: true,
        categories: true,
        specifications: true,
      },
    });

    if (!existing) throw new NotFoundException("Product not found");

    const {
      primaryCategoryId,
      selectedCategoryIds = [],
      tags = [],
      images = [],
      attributes = [],
      discountType,
      discountValue,
      specifications = [],
      saleStartDate,
      saleEndDate,
      isFeatured,
      slug,
      ...productData
    } = data;

    // --- Update main product ---

    const cleanedHtml = cleanHtml(productData.htmlDescription || "");
    const cleanedShortDescription = cleanHtml(
      productData.shortDescription || ""
    );

    await db
      .update(products)
      .set({
        ...productData,
        htmlDescription: cleanedHtml,
        shortDescription: cleanedShortDescription,
        slug:
          slug?.replace(/ /g, "-")?.trim() ??
          existing.slug?.replace(/ /g, "-")?.trim() ??
          productData?.nameEn?.replace(/ /g, "-")?.trim() ??
          productData?.name?.replace(/ /g, "-")?.trim(),
        isFeatured,
        isSinglePurchase: data.isSinglePurchase ?? existing.isSinglePurchase,
        ...(isFeatured
          ? {
              saleStartDate: isValidDate(saleStartDate)
                ? new Date(saleStartDate)
                : null,
              saleEndDate: isValidDate(saleEndDate)
                ? new Date(saleEndDate)
                : null,
            }
          : {
              saleStartDate: null,
              saleEndDate: null,
            }),
      })
      .where(eq(products.id, id));

    // --- Update tags ---
    const existingTagIds = existing.tags.map((t) => t.tagId);
    const incomingTagIds = tags.map((t) => t);
    const tagIdsToAdd = incomingTagIds.filter(
      (tid) => !existingTagIds.includes(tid)
    );
    const tagIdsToRemove = existingTagIds.filter(
      (tid) => !incomingTagIds.includes(tid)
    );

    if (tagIdsToAdd.length) {
      await db.insert(productToTags).values(
        tagIdsToAdd.map((tagId) => ({
          productId: id,
          tagId,
        }))
      );
    }

    if (tagIdsToRemove.length) {
      await db
        .delete(productToTags)
        .where(
          and(
            eq(productToTags.productId, id),
            inArray(productToTags.tagId, tagIdsToRemove)
          )
        );
    }

    // --- Update categories ---
    const existingCategoryIds = existing.categories.map((c) => c.categoryId);
    const categoryIdsToAdd = selectedCategoryIds.filter(
      (cid) => !existingCategoryIds.includes(cid)
    );
    const categoryIdsToRemove = existingCategoryIds.filter(
      (cid) => !selectedCategoryIds.includes(cid)
    );

    if (categoryIdsToRemove.length) {
      await db
        .delete(productToCategories)
        .where(
          and(
            eq(productToCategories.productId, id),
            inArray(productToCategories.categoryId, categoryIdsToRemove)
          )
        );
    }

    if (categoryIdsToAdd.length) {
      await db.insert(productToCategories).values(
        categoryIdsToAdd.map((categoryId) => ({
          productId: id,
          categoryId,
          isPrimary: categoryId === primaryCategoryId,
        }))
      );
    }

    // ریست کردن primaryCategory
    await db
      .update(productToCategories)
      .set({ isPrimary: false })
      .where(eq(productToCategories.productId, id));

    if (primaryCategoryId) {
      await db
        .update(productToCategories)
        .set({ isPrimary: true })
        .where(
          and(
            eq(productToCategories.productId, id),
            eq(productToCategories.categoryId, primaryCategoryId)
          )
        );
    }

    // --- Update images ---
    await db.delete(productImages).where(eq(productImages.productId, id));
    if (
      images.length &&
      images.map((image) => image.fileId).every((fileId) => fileId)
    ) {
      await db.insert(productImages).values(
        images.map((image) => ({
          ...image,
          productId: id,
        }))
      );
    }

    // --- Update specifications ---
    // await db
    //   .delete(productSpecifications)
    //   .where(eq(productSpecifications.productId, id));

    // if (specifications.length) {
    //   await db.insert(productSpecifications).values(
    //     specifications.map((spec) => ({
    //       productId: id,
    //       specificationId: spec.specificationId,
    //       value: spec.value,
    //       optionId: spec.optionId,
    //     }))
    //   );
    // }

    // --- Update variations (smart diff with SKU) ---
    await db
      .delete(productVariations)
      .where(eq(productVariations.productId, id));

    for (const attr of attributes) {
      const {
        sku,
        price,
        salePrice,
        saleStartDate,
        saleEndDate,
        stock,
        purchaseLimit,
        image,
        attributes: variationAttributes,
      } = attr;

      const [newVar] = await db
        .insert(productVariations)
        .values({
          productId: id,
          sku: sku || undefined,
          price: price ? Number(price) : undefined,
          salePrice: salePrice ? Number(salePrice) : undefined,
          saleStartDate: isValidDate(saleStartDate)
            ? new Date(saleStartDate)
            : undefined,
          saleEndDate: isValidDate(saleEndDate)
            ? new Date(saleEndDate)
            : undefined,
          stockQuantity: stock ? Number(stock) : undefined,
          purchaseLimit: purchaseLimit ? Number(purchaseLimit) : undefined,
          stockStatus: "instock",
          imageFileId: image?.id || undefined,
          imageAlt: image?.alt || undefined,
        })
        .returning();

      if (variationAttributes?.length) {
        await db.insert(variationAttributeValues).values(
          variationAttributes.map(({ attributeId, valueId }) => ({
            variationId: newVar.id,
            attributeValueId: Number(valueId),
          }))
        );
      }
    }

    // --- Update or create bundle ---
    if (data.bundleItems) {
      // Check if product already has a bundle
      const existingBundle = await db.query.productBundles.findFirst({
        where: (b, { eq }) => eq(b.mainProductId, id),
      });

      if (existingBundle) {
        // Delete old bundle items
        await db
          .delete(productBundleItems)
          .where(eq(productBundleItems.bundleId, existingBundle.id));

        // Insert new bundle items
        if (data.bundleItems.length) {
          await db.insert(productBundleItems).values(
            data.bundleItems.map((productId: number, index: number) => ({
              bundleId: existingBundle.id,
              productId,
              isRequired: true, // یا بر اساس نیاز ورودی
              displayOrder: index,
            }))
          );
        }

        // Optionally update bundle discount info if you have discountType/discountValue in data
        await db
          .update(productBundles)
          .set({
            discountType: discountType ?? existingBundle.discountType,
            discountValue:
              discountValue?.toString() ?? existingBundle.discountValue,
          })
          .where(eq(productBundles.id, existingBundle.id));
      } else {
        // Create a new bundle
        const [newBundle] = await db
          .insert(productBundles)
          .values({
            // name: `${existing.name} Bundle`,
            mainProductId: id,
            discountType: discountType ?? "percentage",
            discountValue: discountValue?.toString() ?? "0",
            isActive: true,
            // isFeatured: data.isFeatured ?? false,
          })
          .returning();

        if (data.bundleItems.length) {
          await db.insert(productBundleItems).values(
            data.bundleItems.map((productId: number, index: number) => ({
              bundleId: newBundle.id,
              productId,
              // isRequired: true,
              displayOrder: index,
            }))
          );
        }
      }
    }

    return this.getById(id);
  }

  static async delete(id: number) {
    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existing) {
      throw new NotFoundException("Product not found");
    }

    await db
      .delete(productToCategories)
      .where(eq(productToCategories.productId, id));
    await db.delete(productToTags).where(eq(productToTags.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));

    // حذف مشخصات محصول از جدول productSpecifications
    await db
      .delete(productSpecifications)
      .where(eq(productSpecifications.productId, id));

    const variationIds = await db
      .select({ id: productVariations.id })
      .from(productVariations)
      .where(eq(productVariations.productId, id));

    const variationIdList = variationIds.map((v) => v.id);

    if (variationIdList.length > 0) {
      await db
        .delete(variationAttributeValues)
        .where(inArray(variationAttributeValues.variationId, variationIdList));
    }
    await db
      .delete(productVariations)
      .where(eq(productVariations.productId, id));

    await db
      .delete(productBundleItems)
      .where(eq(productBundleItems.productId, id));
    await db.delete(productBundles).where(eq(productBundles.mainProductId, id));

    return db.delete(products).where(eq(products.id, id)).returning();
  }

  static async duplicate(id: number) {
    const source = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        tags: true,
        images: true,
        categories: true,
        specifications: { with: { selectedOptions: true } },
        bundle: { with: { bundleItems: true } },
        variations: {
          where: (productVariations, { eq }) =>
            eq(productVariations.isArchived, false),
          with: { attributeValues: true },
        },
      },
    });

    if (!source) {
      throw new NotFoundException("Product not found");
    }

    const generateUniqueSlug = async (
      tx: any,
      base: string
    ): Promise<string> => {
      let attempt = 0;
      const normalizedBase = slugify(base);
      while (true) {
        const candidate =
          attempt === 0 ? normalizedBase : `${normalizedBase}-${attempt + 1}`;
        const existing = await tx.query.products.findFirst({
          where: (p: any, { eq }: any) => eq(p.slug, candidate),
        });
        if (!existing) return candidate;
        attempt += 1;
      }
    };

    const isSkuTaken = async (tx: any, candidate: string) => {
      if (!candidate) return false;
      const existingProduct = await tx.query.products.findFirst({
        where: (p: any, { eq }: any) => eq(p.sku, candidate),
      });
      if (existingProduct) return true;
      const existingVariation = await tx.query.productVariations.findFirst({
        where: (pv: any, { eq }: any) => eq(pv.sku, candidate),
      });
      return !!existingVariation;
    };

    const generateUniqueSku = async (
      tx: any,
      base: string
    ): Promise<string> => {
      const baseSku = base?.trim() || `${slugify(source.name)}-sku`;
      let attempt = 0;
      while (true) {
        const candidate =
          attempt === 0 ? `${baseSku}-copy` : `${baseSku}-copy-${attempt + 1}`;
        // Ensure length limit ~100
        const trimmed =
          candidate.length > 100 ? candidate.slice(0, 100) : candidate;
        const taken = await isSkuTaken(tx, trimmed);
        if (!taken) return trimmed;
        attempt += 1;
      }
    };

    const generateUniqueVariationSku = async (
      tx: any,
      base: string | null
    ): Promise<string | null> => {
      if (!base) return null;
      let attempt = 0;
      while (true) {
        const candidate =
          attempt === 0 ? `${base}-copy` : `${base}-copy-${attempt + 1}`;
        const trimmed =
          candidate.length > 100 ? candidate.slice(0, 100) : candidate;
        const taken = await isSkuTaken(tx, trimmed);
        if (!taken) return trimmed;
        attempt += 1;
      }
    };

    const result = await db.transaction(async (tx) => {
      const newSlug = await generateUniqueSlug(tx, source.slug || source.name);
      const newSku = await generateUniqueSku(tx, source.sku || "");

      const [newProduct] = await tx
        .insert(products)
        .values({
          name: source.name,
          sku: newSku,
          regularPrice: source.regularPrice,
          salePrice: source.salePrice ?? null,
          saleStartDate: source.saleStartDate ?? null,
          saleEndDate: source.saleEndDate ?? null,
          isPublished: source.isPublished,
          isFeatured: source.isFeatured,
          isSinglePurchase: source.isSinglePurchase,
          shortDescription: source.shortDescription ?? null,
          longDescription: source.longDescription ?? null,
          seoTitle: source.seoTitle ?? null,
          seoDescription: source.seoDescription ?? null,
          slug: newSlug,
          stockQuantity: source.stockQuantity ?? 0,
          stockStatus: source.stockStatus,
          showStock: source.showStock,
          shippingClassId: source.shippingClassId ?? null,
          weight: source.weight ?? null,
          length: source.length ?? null,
          width: source.width ?? null,
          height: source.height ?? null,
          brandId: source.brandId ?? null,
        })
        .returning();

      const newProductId = newProduct.id;

      // Categories
      if (source.categories?.length) {
        await tx.insert(productToCategories).values(
          source.categories.map((c) => ({
            productId: newProductId,
            categoryId: c.categoryId,
            isPrimary: c.isPrimary ?? false,
          }))
        );
      }

      // Tags
      if (source.tags?.length) {
        await tx.insert(productToTags).values(
          source.tags.map((t) => ({
            productId: newProductId,
            tagId: t.tagId,
          }))
        );
      }

      // Images
      if (source.images?.length) {
        await tx.insert(productImages).values(
          source.images.map((img) => ({
            productId: newProductId,
            fileId: img.fileId,
            isThumbnail: img.isThumbnail ?? false,
            order: img.order ?? 0,
            alt: img.alt ?? null,
          }))
        );
      }

      // Specifications + selected options
      const specIdMap = new Map<number, number>();
      if (source.specifications?.length) {
        for (const spec of source.specifications) {
          const [newSpec] = await tx
            .insert(productSpecifications)
            .values({
              productId: newProductId,
              specificationId: spec.specificationId,
              value: spec.value ?? null,
              optionId: spec.optionId ?? null,
            })
            .returning();
          specIdMap.set(spec.id, newSpec.id);
        }

        // Copy selectedOptions for multi-select
        const selectedOptions = source.specifications.flatMap(
          (s) => (s as any).selectedOptions || []
        );
        if (selectedOptions.length) {
          await tx.insert(productSpecificationOptions).values(
            selectedOptions.map((sel: any) => ({
              productSpecificationId: specIdMap.get(
                sel.productSpecificationId
              )!,
              optionId: sel.optionId,
            }))
          );
        }
      }

      // Variations + attribute values
      if (source.variations?.length) {
        for (const v of source.variations) {
          const newVarSku = await generateUniqueVariationSku(tx, v.sku || null);
          const [newVar] = await tx
            .insert(productVariations)
            .values({
              productId: newProductId,
              sku: newVarSku || null,
              price: v.price ?? null,
              salePrice: v.salePrice ?? null,
              saleStartDate: v.saleStartDate ?? null,
              saleEndDate: v.saleEndDate ?? null,
              stockQuantity: v.stockQuantity ?? 0,
              purchaseLimit: v.purchaseLimit ?? null,
              stockStatus: v.stockStatus,
              imageFileId: v.imageFileId ?? null,
              imageAlt: v.imageAlt ?? null,
              isArchived: false,
            })
            .returning();

          if (v.attributeValues?.length) {
            await tx.insert(variationAttributeValues).values(
              v.attributeValues.map((av: any) => ({
                variationId: newVar.id,
                attributeValueId: av.attributeValueId,
              }))
            );
          }
        }
      }

      // Bundle
      if (source.bundle) {
        const [newBundle] = await tx
          .insert(productBundles)
          .values({
            name: source.bundle.name ?? null,
            description: source.bundle.description ?? null,
            mainProductId: newProductId,
            discountType: source.bundle.discountType,
            discountValue: source.bundle.discountValue,
            isActive: source.bundle.isActive,
            isFeatured: source.bundle.isFeatured,
          })
          .returning();

        if (source.bundle.bundleItems?.length) {
          await tx.insert(productBundleItems).values(
            source.bundle.bundleItems.map((bi: any) => ({
              bundleId: newBundle.id,
              productId: bi.productId,
            }))
          );
        }
      }

      return newProduct;
    });

    return this.getById(result.id);
  }
}
