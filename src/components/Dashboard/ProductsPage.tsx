import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Filter, Search, Package, CheckCircle2, Archive, AlertTriangle } from "lucide-react";

import { dashboardService } from "../../services/dashboardService";
import { panelConfigService } from "../../services/panelConfigService";
import { IMAGE_BASE_URL } from "../../config/api";
import { Product } from "../../aistudioTypes";

import ProductsTable from "../aistudio/products/ProductTable";
import ProductDetailsDrawer from "../aistudio/products/ProductDetailsDrawer";
import ProductDrawer from "../aistudio/products/ProductDrawer";
import ImportModal from "../aistudio/products/ImportModal";
import ExportModal from "../aistudio/products/ExportModal";
import ConfirmationModal from "../aistudio/ConfirmationModal";

function normalizeImageUrl(url?: string): string {
  if (!url) return "";
  const u = String(url).trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;
  if (u.startsWith("/")) return `${IMAGE_BASE_URL}${u}`;
  return `${IMAGE_BASE_URL}/${u}`;
}


function normalizeVariationAttributes(source: any): any[] {
  if (!source) return [];
  let raw = source;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((attr: any) => ({
    name: String(attr?.name || ''),
    type: attr?.type || 'other',
    values: Array.isArray(attr?.values)
      ? attr.values.map((value: any) => typeof value === 'string' ? ({ label: value, colorHex: '#111827', image: '' }) : ({
          label: String(value?.label || ''),
          colorHex: value?.colorHex || '#111827',
          image: value?.image || '',
        }))
      : [],
  })).filter((attr: any) => attr.name || attr.values.length);
}

function mapProduct(p: any): Product {
  const imageList = Array.isArray(p.images)
    ? p.images.map((img: any) => normalizeImageUrl(img?.image_url || img?.url || img)).filter(Boolean)
    : typeof p.images === 'string'
      ? p.images.split(',').map((s: string) => normalizeImageUrl(s.trim())).filter(Boolean)
      : [];
  const mainImage = normalizeImageUrl(p.main_image || p.image || p.image_url || imageList[0] || '');
  const gallery = imageList.length
    ? imageList.filter((img: string) => img && img !== mainImage)
    : [];
  const variationAttributes = normalizeVariationAttributes(p.variationAttributes || p.variation_attributes_json);

  const stock = Number(p.total_stock ?? p.stock ?? 0);
  const active = Number(p.active ?? (p.status === "active" ? 1 : 0)) === 1;
  const categoryName = p.category || p.category_name || "Geral";

  return {
    id: String(p.id ?? ""),
    name: p.name || p.product_name || "Produto",
    sku: p.sku || p.slug || "",
    categoryId: String(p.category_id ?? categoryName),
    categoryName,
    collectionIds: [],
    status: active ? "active" : "inactive",
    shortDescription: p.shortDescription || p.short_description || "",
    fullDescription: p.description || p.fullDescription || "",
    tags: [],
    price: Number(p.basePrice ?? p.base_price ?? p.price ?? 0),
    compareAtPrice: Number(p.compareAtPrice ?? p.compare_at_price ?? 0) || undefined,
    cost: Number(p.cost ?? 0) || undefined,
    stock,
    lowStockThreshold: Number(p.min_stock_alert ?? 5),
    trackInventory: true,
    allowBackorder: false,
    mainImage,
    galleryImages: gallery,
    shippingType: (p.shippingType || p.shipping_type || 'melhor_envio') as any,
    useDefaultShipping: !((Number(p.weight_kg ?? p.weight ?? 0) > 0) || (Number(p.height_cm ?? p.height ?? 0) > 0) || (Number(p.width_cm ?? p.width ?? 0) > 0) || (Number(p.length_cm ?? p.length ?? 0) > 0)),
    weight: Number(p.weight_kg ?? p.weight ?? 0),
    height: Number(p.height_cm ?? p.height ?? 0),
    width: Number(p.width_cm ?? p.width ?? 0),
    length: Number(p.length_cm ?? p.length ?? 0),
    declaredValue: Number(p.declared_value ?? 0) || undefined,
    freeShipping: Boolean(p.free_shipping ?? false),
    hasVariants: Array.isArray(p.variations) && p.variations.length > 0,
    variants: Array.isArray(p.variations)
      ? p.variations.map((v: any, idx: number) => {
          let attributes: any = {};
          if (v.attributes_json) {
            try { attributes = typeof v.attributes_json === 'string' ? JSON.parse(v.attributes_json) : (v.attributes_json || {}); } catch { attributes = {}; }
          }
          return {
            id: String(v.id ?? idx + 1),
            name: v.name || `Variação ${idx + 1}`,
            sku: v.sku || "",
            price: Number(v.priceExtra ?? v.price ?? v.basePrice ?? 0),
            stock: Number(v.stock ?? 0),
            status: Number(v.active ?? 1) === 1 ? "active" : "inactive",
            image: normalizeImageUrl(v.image_url || v.image || ''),
            attributes,
            variationKey: v.variation_key || '',
            minStockAlert: Number(v.min_stock_alert ?? 5),
          };
        })
      : [],
    variationAttributes,
    seoTitle: p.seo_title || undefined,
    seoDescription: p.seo_description || undefined,
    slug: p.slug || "",
    featured: Boolean(p.featured ?? false),
    allowReviews: true,
    views: Number(p.views ?? 0),
    salesCount: Number(p.sales_count ?? p.salesCount ?? 0),
    createdAt: p.created_at || new Date().toISOString(),
    updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
  } as Product;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [serverTotal, setServerTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await dashboardService.getProducts("", 9999, 0);
      const mapped = (res.products || []).map(mapProduct);
      setProducts(mapped);
      setServerTotal(Number(res.total || mapped.length || 0));
      setVisibleCount(15);
      try {
        const catRes: any = await panelConfigService.getCategories();
        const cats = Array.isArray(catRes?.categories) ? catRes.categories : [];
        setCategories(
          cats.map((c: any) => ({
            id: String(c.id ?? c.name ?? ""),
            name: c.name || c.title || "Sem categoria",
            slug: c.slug || "",
            type: (c.type || (c.parent_id ? "subcategory" : "category")) as any,
            status: c.status === "inactive" || c.status === 0 ? "inactive" : "active",
          }))
        );
      } catch {
        const uniq = Array.from(new Set(mapped.map((m: any) => m.categoryName).filter(Boolean)));
        setCategories(uniq.map((name: any, idx: number) => ({ id: String(idx + 1), name, slug: "", type: "category", status: "active" })));
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const ativos = products.filter((p) => p.status === "active").length;
    const inativos = products.filter((p) => p.status === "inactive").length;
    const estoqueBaixo = products.filter((p) => (p.stock ?? 0) <= 5).length;
    return { total, ativos, inativos, estoqueBaixo };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.categoryName || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const canLoadMore = visibleCount < filtered.length || filtered.length < serverTotal;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-center gap-4">
        <button
          onClick={() => setEditing(mapProduct({}))}
          className="h-11 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-sm min-w-[200px]"
        >
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total produtos" value={stats.total} icon={Package} />
        <Kpi label="Produtos ativos" value={stats.ativos} icon={CheckCircle2} />
        <Kpi label="Produtos inativos" value={stats.inativos} icon={Archive} />
        <Kpi label="Estoque baixo" value={stats.estoqueBaixo} icon={AlertTriangle} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria..."
              className="w-full h-11 rounded-xl border border-slate-200 pl-11 pr-4 outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowExport(true)} className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700">
              Exportar
            </button>
            <button onClick={() => setShowImport(true)} className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700">
              Importar
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="h-11 rounded-xl border border-slate-200 bg-white px-4 flex items-center text-sm font-medium text-slate-600">Status: ativos, inativos e estoque baixo</div>
            <div className="h-11 rounded-xl border border-slate-200 bg-white px-4 flex items-center text-sm font-medium text-slate-600">Categoria: qualquer categoria cadastrada</div>
            <div className="h-11 rounded-xl border border-slate-200 bg-white px-4 flex items-center text-sm font-medium text-slate-600">Busca atual: {query || 'sem termo aplicado'}</div>
          </div>
        )}

      </div>

      <ProductsTable
          products={visibleProducts}
          onView={async (p) => {
            try {
              const detail = await dashboardService.getProductDetails(Number(p.id));
              setSelected(mapProduct(detail));
            } catch {
              setSelected(p);
            }
          }}
          onEdit={async (p) => {
            try {
              const detail = await dashboardService.getProductDetails(Number(p.id));
              setEditing(mapProduct(detail));
            } catch {
              setEditing(p);
            }
          }}
          onDuplicate={(p) => {
            const clone = { ...p, id: 0, name: `${p.name} (Cópia)`, sku: p.sku ? `${p.sku}-COPY` : "" } as Product;
            setEditing(clone);
          }}
          onArchive={async (p) => {
            try {
              const nextActive = p.status !== "active";
              await dashboardService.updateProductStatus(Number(p.id), nextActive);
              setProducts((prev) => prev.map((item) => item.id === p.id ? { ...item, status: nextActive ? "active" : "inactive" } : item));
            } catch (error: any) {
              alert(error?.message || 'Não foi possível atualizar o status do produto.');
            }
          }}
          onDelete={(p) => setConfirmDelete(p)}
          sortConfig={null}
          onSort={() => {}}
        />

      {canLoadMore && (
        <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount((prev) => prev + 15)}
              className="h-11 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
            >
              Ver mais 15 produtos
            </button>
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Carregando produtos...</div>}

      <AnimatePresence>
        {selected && (
          <ProductDetailsDrawer
            isOpen={!!selected}
            product={selected}
            onClose={() => setSelected(null)}
            onEdit={(p) => { setEditing(p); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <ProductDrawer
            isOpen={!!editing}
            editingProduct={editing.id ? editing : null}
            categories={categories as any}
            onClose={() => setEditing(null)}
            onSave={async (payload: any) => {
              const body = {
                id: payload?.id ? Number(payload.id) : undefined,
                name: payload?.name || "",
                sku: payload?.sku || "",
                shortDescription: payload?.shortDescription || "",
                description: payload?.fullDescription || "",
                basePrice: Number(payload?.price || 0),
                category: payload?.categoryName || categories.find((c: any) => String(c.id) === String(payload?.categoryId))?.name || "",
                active: payload?.status === "inactive" ? 0 : 1,
                shippingType: payload?.useDefaultShipping ? 'melhor_envio' : (payload?.shippingType || 'melhor_envio'),
                shippingPrice: Number(payload?.shippingPrice || 0),
                weight_kg: payload?.useDefaultShipping ? null : Number(payload?.weight || 0),
                height_cm: payload?.useDefaultShipping ? null : Number(payload?.height || 0),
                width_cm: payload?.useDefaultShipping ? null : Number(payload?.width || 0),
                length_cm: payload?.useDefaultShipping ? null : Number(payload?.length || 0),
                variationAttributes: Array.isArray(payload?.variationAttributes) ? payload.variationAttributes : [],
                variations: (Array.isArray(payload?.variants) && payload.variants.length ? payload.variants : [{
                  name: payload?.name || "Padrão",
                  sku: payload?.sku || "",
                  price: 0,
                  stock: Number(payload?.stock || 0),
                  minStockAlert: Number(payload?.lowStockThreshold || 5),
                  status: payload?.status === "inactive" ? "inactive" : "active",
                  attributes: {},
                  image: payload?.mainImage || "",
                }]).map((variant: any, idx: number) => ({
                  id: variant?.id,
                  name: variant?.name || `Variação ${idx + 1}`,
                  sku: variant?.sku || "",
                  priceExtra: Number(variant?.price || 0),
                  stock: Number(variant?.stock || 0),
                  min_stock_alert: Number(variant?.minStockAlert || payload?.lowStockThreshold || 5),
                  active: variant?.status === "inactive" ? 0 : 1,
                  image_url: variant?.image || "",
                  attributes_json: variant?.attributes || {},
                  variation_key: variant?.variationKey || "",
                })),
                images: [
                  ...(payload?.mainImage ? [{ image_url: payload.mainImage, image_order: 0 }] : []),
                  ...((payload?.galleryImages || []).filter((img: string) => img && img !== payload?.mainImage).map((img: string, idx: number) => ({ image_url: img, image_order: idx + 1 })))
                ],
              };

              await dashboardService.saveProduct(body);
              setEditing(null);
              await load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImport={async (rows) => {
              for (const row of rows || []) {
                await dashboardService.saveProduct({
                  name: row.name || 'Produto importado',
                  basePrice: Number(String(row.price || 0).replace(',', '.')) || 0,
                  category: row.category || '',
                  active: String(row.status || 'active').toLowerCase() === 'inactive' ? 0 : 1,
                  images: row.image ? [{ image_url: row.image, image_order: 0 }] : [],
                  variations: [{ name: 'Padrão', priceExtra: 0, stock: Number(row.stock || 0), min_stock_alert: 5, active: 1 }],
                  sku: row.sku || ''
                });
              }
              setShowImport(false);
              await load();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportModal
            products={filtered}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Excluir produto"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.name}"? Essa ação não poderá ser desfeita.` : ''}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isLoading={deletingProduct}
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            setDeletingProduct(true);
            await dashboardService.deleteProduct(Number(confirmDelete.id));
            await load();
            setConfirmDelete(null);
          } catch (error: any) {
            alert(error?.message || 'Não foi possível excluir o produto.');
          } finally {
            setDeletingProduct(false);
          }
        }}
        onClose={() => {
          if (deletingProduct) return;
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-semibold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
