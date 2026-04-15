import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Trash2, Plus, GripVertical, Image as ImageIcon, 
  Upload, Check, AlertCircle, Info, ChevronDown, Trash,
  Settings, Package, Truck, DollarSign, Layers, Camera,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Product, ProductVariant, Category, ProductVariationAttribute, ProductVariationValue } from '../../../aistudioTypes';
import { useToast } from '../../../context/ToastContext';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  editingProduct: Product | null;
  categories: Category[];
}

export default function ProductDrawer({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  categories
}: ProductDrawerProps) {
  const toast = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    categoryId: '',
    categoryName: '',
    status: 'active',
    shortDescription: '',
    fullDescription: '',
    price: 0,
    compareAtPrice: undefined,
    cost: undefined,
    stock: 0,
    lowStockThreshold: 5,
    trackInventory: true,
    allowBackorder: false,
    shippingType: 'melhor_envio',
    useDefaultShipping: true,
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    mainImage: '',
    galleryImages: [],
    hasVariants: false,
    variants: [],
    variationAttributes: [],
    featured: false,
    allowReviews: true,
    tags: [],
    slug: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingProduct) {
      setFormData({ ...editingProduct });
    } else {
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        categoryName: '',
        status: 'active',
        shortDescription: '',
        fullDescription: '',
        price: 0,
        stock: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
        shippingType: 'melhor_envio',
        useDefaultShipping: true,
        weight: 0,
        height: 0,
        width: 0,
        length: 0,
        mainImage: '',
        galleryImages: [],
        hasVariants: false,
        variants: [],
        variationAttributes: [],
        featured: false,
        allowReviews: true,
        tags: [],
        slug: '',
      });
    }
    setActiveStep(0);
    setErrors({});
  }, [editingProduct, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (!formData.categoryId) newErrors.categoryId = 'Categoria é obrigatória';
    
    if (!formData.useDefaultShipping && formData.shippingType === 'melhor_envio') {
      if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Peso é obrigatório';
      if (!formData.height || formData.height <= 0) newErrors.height = 'Altura é obrigatória';
      if (!formData.width || formData.width <= 0) newErrors.width = 'Largura é obrigatória';
      if (!formData.length || formData.length <= 0) newErrors.length = 'Comprimento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePickerTarget, setImagePickerTarget] = useState<{ attrIndex: number; valueIndex: number } | null>(null);

  const normalizeAttributes = (attributes?: ProductVariationAttribute[]) => {
    return (attributes || []).map((attr) => ({
      name: attr?.name || '',
      type: attr?.type || 'other',
      values: (attr?.values || []).map((value) => {
        if (typeof value === 'string') {
          return { label: value, colorHex: '#111827', image: '', stock: 0, sku: '', priceExtra: 0, minStockAlert: 5 } as ProductVariationValue;
        }
        return {
          label: value?.label || '',
          colorHex: value?.colorHex || '#111827',
          image: value?.image || '',
          stock: Number((value as any)?.stock || 0),
          sku: String((value as any)?.sku || ''),
          priceExtra: Number((value as any)?.priceExtra || 0),
          minStockAlert: Number((value as any)?.minStockAlert || 5),
        } as ProductVariationValue;
      }),
    }));
  };

  const slugify = (value: string) => String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const buildVariantName = (attributes: ProductVariationAttribute[], values: ProductVariationValue[]) =>
    values.map((value) => value.label).filter(Boolean).join(' / ');

  const buildVariantKey = (attributes: ProductVariationAttribute[], values: ProductVariationValue[]) =>
    attributes.map((attr, idx) => `${slugify(attr.name || attr.type || `attr-${idx}`)}:${slugify(values[idx]?.label || '')}`).join('|');

  const cartesianValues = (attributes: ProductVariationAttribute[]) => {
    if (!attributes.length) return [] as ProductVariationValue[][];
    return attributes.reduce<ProductVariationValue[][]>((acc, attr) => {
      const currentValues = (attr.values || []).filter((value) => String((value as ProductVariationValue)?.label || '').trim());
      if (!currentValues.length) return acc;
      if (!acc.length) return currentValues.map((value) => [value as ProductVariationValue]);
      return acc.flatMap((combo) => currentValues.map((value) => [...combo, value as ProductVariationValue]));
    }, []);
  };

  const syncVariantsFromAttributes = (attributes: ProductVariationAttribute[], prevVariants: ProductVariant[] = []) => {
    const cleanAttributes = attributes
      .map((attr) => ({
        ...attr,
        name: String(attr.name || '').trim(),
        values: (attr.values || []).filter((value) => String((value as ProductVariationValue)?.label || '').trim()),
      }))
      .filter((attr) => attr.name && attr.values.length);

    if (!cleanAttributes.length) return [] as ProductVariant[];

    const prevByKey = new Map(prevVariants.map((variant) => [String((variant as any).variationKey || ''), variant]));

    if (cleanAttributes.length === 1) {
      const attr = cleanAttributes[0];
      return attr.values.map((rawValue, index) => {
        const value = rawValue as ProductVariationValue;
        const key = buildVariantKey([attr], [value]);
        const prev = prevByKey.get(key);
        return {
          id: String(prev?.id || `${Date.now()}-${index}`),
          name: value.label,
          sku: String(value.sku || prev?.sku || ''),
          price: Number(value.priceExtra || prev?.price || 0),
          stock: Number(value.stock || prev?.stock || 0),
          status: (prev?.status || 'active') as 'active' | 'inactive',
          image: value.image || prev?.image || '',
          attributes: {
            [attr.name]: {
              label: value.label,
              hex: value.colorHex || undefined,
            },
          },
          variationKey: key,
          minStockAlert: Number(value.minStockAlert || (prev as any)?.minStockAlert || 5),
        } as ProductVariant;
      });
    }

    const combinations = cartesianValues(cleanAttributes);
    return combinations.map((combo, index) => {
      const key = buildVariantKey(cleanAttributes, combo);
      const prev = prevByKey.get(key);
      const image = combo.find((value) => value.image)?.image || prev?.image || '';
      const price = combo.reduce((sum, value) => sum + Number(value.priceExtra || 0), 0);
      const attributesMap = cleanAttributes.reduce<Record<string, any>>((acc, attr, attrIndex) => {
        const currentValue = combo[attrIndex];
        acc[attr.name] = {
          label: currentValue?.label || '',
          hex: currentValue?.colorHex || undefined,
        };
        return acc;
      }, {});
      return {
        id: String(prev?.id || `${Date.now()}-${index}`),
        name: buildVariantName(cleanAttributes, combo),
        sku: String(prev?.sku || ''),
        price: Number(prev?.price || price || 0),
        stock: Number(prev?.stock || 0),
        status: (prev?.status || 'active') as 'active' | 'inactive',
        image,
        attributes: attributesMap,
        variationKey: key,
        minStockAlert: Number((prev as any)?.minStockAlert || 5),
      } as ProductVariant;
    });
  };

  const buildAllImages = () => {
    const main = formData.mainImage ? [formData.mainImage] : [];
    const gallery = (formData.galleryImages || []).filter((img) => img && img !== formData.mainImage);
    return [...main, ...gallery];
  };

  const pushImages = (incoming: string[]) => {
    const clean = incoming.map((item) => String(item || '').trim()).filter(Boolean);
    if (!clean.length) return;

    setFormData((prev) => {
      const currentMain = prev.mainImage || '';
      const currentGallery = Array.isArray(prev.galleryImages) ? prev.galleryImages : [];
      const ordered = [currentMain, ...currentGallery, ...clean].filter(Boolean);
      const unique: string[] = [];
      for (const image of ordered) {
        if (!unique.includes(image)) unique.push(image);
      }
      return {
        ...prev,
        mainImage: unique[0] || '',
        galleryImages: unique.slice(1),
      };
    });

    toast.success('Imagens adicionadas', `${clean.length} imagem(ns) carregada(s) com sucesso.`);
  };

  const filesToDataUrls = async (files: File[]) => {
    return Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from((e.target.files || []) as File[]);
    if (!files.length) return;
    const images = await filesToDataUrls(files);
    pushImages(images);
    e.target.value = '';
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from((e.dataTransfer.files || []) as File[]).filter((file) => file.type.startsWith('image/'));
    if (files.length) {
      const images = await filesToDataUrls(files);
      pushImages(images);
      return;
    }

    const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    const url = String(uriList || '').trim().split('\n')[0]?.trim();
    if (/^https?:\/\//i.test(url)) {
      const dataUrl = await fetchRemoteImageAsDataUrl(url);
      if (dataUrl) {
        pushImages([dataUrl]);
        return;
      }
    }

    toast.info('Nada adicionado', 'Arraste arquivos de imagem do seu dispositivo.');
  };

  const fetchRemoteImageAsDataUrl = async (url: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Falha ao buscar a imagem.');
      const blob = await response.blob();
      const file = new File([blob], 'imagem-arrastada', { type: blob.type || 'image/png' });
      const [dataUrl] = await filesToDataUrls([file]);
      return dataUrl;
    } catch (error) {
      console.error(error);
      return '';
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...(formData.galleryImages || [])];
    newGallery.splice(index, 1);
    setFormData({ ...formData, galleryImages: newGallery });
  };

  const setPrimaryImage = (image: string) => {
    setFormData((prev) => {
      const ordered = [prev.mainImage || '', ...(prev.galleryImages || [])].filter(Boolean);
      return {
        ...prev,
        mainImage: image,
        galleryImages: ordered.filter((item) => item && item !== image),
      };
    });
  };


  const addVariationAttribute = () => {
    const newAttrs = [...normalizeAttributes(formData.variationAttributes), { name: '', type: 'other', values: [{ label: '', colorHex: '#111827', image: '' }] }];
    setFormData({ ...formData, variationAttributes: newAttrs });
  };

  const updateVariationAttribute = (index: number, patch: Partial<ProductVariationAttribute>) => {
    const newAttrs = normalizeAttributes(formData.variationAttributes);
    newAttrs[index] = { ...newAttrs[index], ...patch };
    setFormData({ ...formData, variationAttributes: newAttrs });
  };

  const addVariationValue = (attrIndex: number) => {
    const newAttrs = normalizeAttributes(formData.variationAttributes);
    newAttrs[attrIndex].values.push({ label: '', colorHex: '#111827', image: '' });
    setFormData({ ...formData, variationAttributes: newAttrs });
  };

  const updateVariationValue = (attrIndex: number, valIndex: number, patch: Partial<ProductVariationValue>) => {
    const newAttrs = normalizeAttributes(formData.variationAttributes);
    const current = newAttrs[attrIndex].values[valIndex] as ProductVariationValue;
    newAttrs[attrIndex].values[valIndex] = { ...current, ...patch };
    setFormData({ ...formData, variationAttributes: newAttrs });
  };

  const updateVariant = (variantIndex: number, patch: Partial<ProductVariant>) => {
    const currentVariants = Array.isArray(formData.variants) ? [...formData.variants] : [];
    currentVariants[variantIndex] = { ...currentVariants[variantIndex], ...patch } as ProductVariant;
    setFormData({ ...formData, variants: currentVariants });
  };

  const removeVariationAttribute = (index: number) => {
    const newAttrs = normalizeAttributes(formData.variationAttributes);
    newAttrs.splice(index, 1);
    setFormData({ ...formData, variationAttributes: newAttrs, variants: [] });
  };

  const removeVariationValue = (attrIndex: number, valIndex: number) => {
    const newAttrs = normalizeAttributes(formData.variationAttributes);
    newAttrs[attrIndex].values.splice(valIndex, 1);
    if (!newAttrs[attrIndex].values.length) {
      newAttrs[attrIndex].values.push({ label: '', colorHex: '#111827', image: '' });
    }
    setFormData({ ...formData, variationAttributes: newAttrs, variants: [] });
  };

  const normalizedAttributes = normalizeAttributes(formData.variationAttributes);
  const imageLibrary = buildAllImages();

  useEffect(() => {
    if (!formData.hasVariants) {
      if ((formData.variants || []).length) {
        setFormData((prev) => ({ ...prev, variants: [] }));
      }
      return;
    }

    const generated = syncVariantsFromAttributes(normalizedAttributes, Array.isArray(formData.variants) ? formData.variants : []);
    const currentSerialized = JSON.stringify((formData.variants || []).map((variant: any) => ({
      variationKey: variant.variationKey || '', sku: variant.sku || '', price: Number(variant.price || 0), stock: Number(variant.stock || 0), image: variant.image || '', status: variant.status || 'active', minStockAlert: Number(variant.minStockAlert || 5), name: variant.name || ''
    })));
    const nextSerialized = JSON.stringify(generated.map((variant: any) => ({
      variationKey: variant.variationKey || '', sku: variant.sku || '', price: Number(variant.price || 0), stock: Number(variant.stock || 0), image: variant.image || '', status: variant.status || 'active', minStockAlert: Number(variant.minStockAlert || 5), name: variant.name || ''
    })));

    if (currentSerialized !== nextSerialized) {
      setFormData((prev) => ({ ...prev, variants: generated }));
    }
  }, [formData.hasVariants, JSON.stringify(normalizedAttributes)]);

  const variationTypeMeta: Record<string, { label: string; placeholder: string; addLabel: string }> = {
    color: { label: 'Cor', placeholder: 'Ex: Azul', addLabel: 'Nova cor' },
    size: { label: 'Tamanho', placeholder: 'Ex: M', addLabel: 'Novo tamanho' },
    material: { label: 'Material', placeholder: 'Ex: Couro', addLabel: 'Novo material' },
    model: { label: 'Modelo', placeholder: 'Ex: Com alça', addLabel: 'Novo modelo' },
    other: { label: 'Outro', placeholder: 'Ex: Opção', addLabel: 'Nova opção' },
  };


  const handleSave = (isDraft = false) => {
    if (!validate()) {
      toast.error('Erro de Validação', 'Por favor, preencha os campos obrigatórios.');
      return;
    }

    const finalData = { ...formData, variationAttributes: normalizedAttributes, _saveMode: isDraft ? 'draft' : 'publish' } as Partial<Product> & { _saveMode?: string };
    if (!finalData.sku) {
      finalData.sku = `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      toast.info('SKU Gerado', `O SKU ${finalData.sku} foi gerado automaticamente.`);
    }

    finalData.variants = Array.isArray(finalData.variants) ? finalData.variants : [];

    onSave(finalData);
  };

  const steps = [
    { id: 'basic', label: 'Básico', icon: Package },
    { id: 'prices', label: 'Preços', icon: DollarSign },
    { id: 'stock', label: 'Estoque', icon: Layers },
    { id: 'shipping', label: 'Frete & Dimensões', icon: Truck },
    { id: 'images', label: 'Imagens', icon: Camera },
    { id: 'variants', label: 'Variações', icon: Settings },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (activeStep < steps.length - 1) {
        e.preventDefault();
        setActiveStep(prev => prev + 1);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-slate-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {editingProduct ? `SKU: ${editingProduct.sku}` : 'Cadastre um novo item no seu catálogo'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={clsx(
                  "flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                  activeStep === idx
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <div className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                  activeStep === idx ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {idx + 1}
                </div>
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" onKeyDown={handleKeyDown}>
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Basic Step */}
            {activeStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Nome do Produto *</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={clsx(
                          "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                          errors.name ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        )}
                        placeholder="Ex: Camiseta Algodão Egípcio"
                        autoFocus
                      />
                      {errors.name && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        SKU
                        <span className="text-[10px] lowercase font-medium text-slate-400">Opcional</span>
                      </label>
                      <input 
                        type="text" 
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className={clsx(
                          "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                          errors.sku ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        )}
                        placeholder="Se vazio, será gerado automaticamente"
                      />
                      {errors.sku && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">{errors.sku}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Categoria *</label>
                      <select 
                        value={formData.categoryId}
                        onChange={(e) => {
                          const cat = categories.find(c => c.id === e.target.value);
                          setFormData({ ...formData, categoryId: e.target.value, categoryName: cat?.name || '' });
                        }}
                        className={clsx(
                          "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all appearance-none",
                          errors.categoryId ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        )}
                      >
                        <option value="">Selecionar...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.categoryId && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">{errors.categoryId}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Descrição Curta</label>
                    <textarea 
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all h-20 resize-none"
                      placeholder="Breve resumo do produto..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Descrição Completa</label>
                    <textarea 
                      value={formData.fullDescription}
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all h-40 resize-none"
                      placeholder="Detalhes técnicos, benefícios, etc..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prices Step */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Preço de Venda (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Preço Comparativo (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.compareAtPrice || ''}
                        onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || undefined })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        placeholder="Ex: 159.90"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Custo por Item (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.cost || ''}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || undefined })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        placeholder="Ex: 45.00"
                      />
                    </div>
                  </div>
                  
                  {formData.price && formData.cost && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Margem de Lucro</span>
                        <span className="text-sm font-black text-emerald-700">
                          {(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%
                        </span>
                      </div>

                      {!!(formData.variants || []).length && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                          <div>
                            <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider">Estoque por variação</h5>
                            <p className="mt-1 text-xs text-slate-500">Defina a quantidade real de cada opção. Isso será salvo nas variações do produto.</p>
                          </div>
                          <div className="space-y-3">
                            {(formData.variants || []).map((variant, variantIdx) => (
                              <div key={(variant as any).variationKey || variant.id || variantIdx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                  {(variant.image || '').trim() ? (
                                    <img src={variant.image} alt={variant.name} className="w-12 h-12 rounded-xl border border-slate-200 object-cover bg-slate-50" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-300">IMG</div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{variant.name || `Variação ${variantIdx + 1}`}</p>
                                    <p className="text-[11px] text-slate-500">Controle individual de estoque, SKU e ajuste de preço.</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Estoque</label>
                                    <input type="number" min="0" value={variant.stock ?? 0} onChange={(e) => updateVariant(variantIdx, { stock: parseInt(e.target.value || '0', 10) || 0 })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">SKU da variação</label>
                                    <input type="text" value={variant.sku || ''} onChange={(e) => updateVariant(variantIdx, { sku: e.target.value })} placeholder="Opcional" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Preço extra (R$)</label>
                                    <input type="number" step="0.01" value={variant.price ?? 0} onChange={(e) => updateVariant(variantIdx, { price: Number(e.target.value || 0) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Step */}
            {activeStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Controlar Estoque</h4>
                      <p className="text-xs text-slate-500">Gerenciar quantidade disponível automaticamente.</p>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, trackInventory: !formData.trackInventory })}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.trackInventory ? "bg-orange-500" : "bg-slate-200"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.trackInventory ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  {formData.trackInventory && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Estoque Atual</label>
                        <input 
                          type="number" 
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Estoque Mínimo (Alerta)</label>
                        <input 
                          type="number" 
                          value={formData.lowStockThreshold}
                          onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Permitir Venda sem Estoque</h4>
                      <p className="text-xs text-slate-500">Continuar vendendo mesmo se o estoque chegar a zero.</p>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, allowBackorder: !formData.allowBackorder })}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.allowBackorder ? "bg-orange-500" : "bg-slate-200"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.allowBackorder ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Step */}
            {activeStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Configuração de Frete</h4>
                      <p className="text-xs text-slate-500">Escolha se este produto usa as dimensões padrão da loja ou dimensões próprias para cotação.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setFormData({ ...formData, useDefaultShipping: true })}
                        className={clsx(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          formData.useDefaultShipping ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Usar padrão da loja
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, useDefaultShipping: false })}
                        className={clsx(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          !formData.useDefaultShipping ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Usar dimensões próprias
                      </button>
                    </div>
                  </div>

                  {!formData.useDefaultShipping && (
                    <div className="space-y-6 pt-6 border-t border-slate-100 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Frete</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'melhor_envio', label: 'Melhor Envio', icon: Truck },
                            { id: 'fixo', label: 'Frete Fixo', icon: DollarSign },
                            { id: 'retirada', label: 'Retirada', icon: Package },
                            { id: 'digital', label: 'Produto Digital', icon: Layers },
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => setFormData({ ...formData, shippingType: type.id as any })}
                              className={clsx(
                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                formData.shippingType === type.id
                                  ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              )}
                            >
                              <type.icon className="w-4 h-4" />
                              <span className="text-xs font-bold">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.shippingType !== 'digital' && (
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Peso (kg) *</label>
                              <input 
                                type="number" 
                                step="0.001"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                                className={clsx(
                                  "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                                  errors.weight ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                )}
                              />
                              {errors.weight && <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase">{errors.weight}</p>}
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Frete Grátis</label>
                              <button 
                                onClick={() => setFormData({ ...formData, freeShipping: !formData.freeShipping })}
                                className={clsx(
                                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-xs transition-all",
                                  formData.freeShipping 
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                                    : "bg-white border-slate-200 text-slate-500"
                                )}
                              >
                                {formData.freeShipping ? <Check className="w-3 h-3" /> : null}
                                {formData.freeShipping ? 'Ativado' : 'Desativado'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Altura (cm) *</label>
                              <input 
                                type="number" 
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                                className={clsx(
                                  "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                                  errors.height ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Largura (cm) *</label>
                              <input 
                                type="number" 
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                                className={clsx(
                                  "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                                  errors.width ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Comprimento (cm) *</label>
                              <input 
                                type="number" 
                                value={formData.length}
                                onChange={(e) => setFormData({ ...formData, length: parseInt(e.target.value) || 0 })}
                                className={clsx(
                                  "w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all",
                                  errors.length ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.useDefaultShipping && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center text-center">
                      <Truck className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usando Configurações Padrão</p>
                      <p className="text-[10px] text-slate-400 mt-1">Quando este produto não tiver peso e medidas próprias, a cotação vai usar as dimensões padrão configuradas na loja.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images Step */}
            {activeStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Imagens do Produto</label>
                    <p className="mt-1 text-xs text-slate-500">Envie várias imagens de uma vez ou arraste aqui. A estrela marca a foto principal.</p>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImageDrop}
                    onClick={() => galleryInputRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 transition-all hover:border-orange-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                      <Camera className="w-4 h-4" />
                      Arraste imagens aqui ou clique para escolher do dispositivo
                    </div>
                  </div>

                  <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Galeria de Fotos</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {buildAllImages().map((img, idx) => {
                        const isPrimary = idx === 0;
                        return (
                          <div key={`${img}-${idx}`} className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <div className="aspect-square bg-slate-50">
                              <img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const all = buildAllImages().filter((image) => image !== img);
                                setFormData({ ...formData, mainImage: all[0] || '', galleryImages: all.slice(1) });
                              }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 shadow-sm flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="p-3 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-500 truncate">{isPrimary ? 'Imagem principal' : `Imagem ${idx + 1}`}</span>
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(img)}
                                className={clsx(
                                  "h-8 min-w-8 px-2 rounded-full border text-[11px] font-black transition-all flex items-center justify-center",
                                  isPrimary
                                    ? "bg-orange-50 border-orange-200 text-orange-600"
                                    : "bg-white border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200"
                                )}
                                title={isPrimary ? 'Imagem principal' : 'Definir como principal'}
                              >
                                ★
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer"
                      >
                        <Plus className="w-6 h-6 text-slate-300" />
                        <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Step */}
            {activeStep === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Este produto tem variações?</h4>
                      <p className="text-xs text-slate-500">Ex: cor, tamanho, material, modelo ou kit.</p>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, hasVariants: !formData.hasVariants, variants: !formData.hasVariants ? (formData.variants || []) : [] })}
                      className={clsx(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.hasVariants ? "bg-orange-500" : "bg-slate-200"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.hasVariants ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>


                  {formData.hasVariants && (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider">Atributos</h5>
                          <p className="mt-1 text-xs text-slate-500">Cadastre os grupos como cor, tamanho, material ou modelo. Cada item abaixo é salvo como opção do produto.</p>
                        </div>
                        <button 
                          onClick={addVariationAttribute}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Adicionar atributo
                        </button>
                      </div>

                      <div className="space-y-4">
                        {normalizedAttributes.map((attr, attrIdx) => {
                          const currentType = attr.type || 'other';
                          const meta = variationTypeMeta[currentType] || variationTypeMeta.other;
                          return (
                            <div key={attrIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Tipo</label>
                                    <select
                                      value={currentType}
                                      onChange={(e) => {
                                        const nextType = e.target.value as any;
                                        updateVariationAttribute(attrIdx, { type: nextType, name: nextType === 'other' ? attr.name : (variationTypeMeta[nextType]?.label || attr.name) });
                                      }}
                                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    >
                                      <option value="color">Cor</option>
                                      <option value="size">Tamanho</option>
                                      <option value="material">Material</option>
                                      <option value="model">Modelo</option>
                                      <option value="other">Outro</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Nome do atributo</label>
                                    <input 
                                      type="text"
                                      value={attr.name}
                                      onChange={(e) => updateVariationAttribute(attrIdx, { name: e.target.value })}
                                      placeholder={currentType === 'other' ? 'Ex: Kit, Voltagem, Sabor' : meta.label}
                                      disabled={currentType !== 'other'}
                                      className={clsx(
                                        "w-full px-3 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                                        currentType !== 'other' ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700'
                                      )}
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeVariationAttribute(attrIdx)}
                                  className="mt-6 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="pt-3 border-t border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Valores</p>
                                <div className="space-y-3">
                                  {attr.values.map((rawVal, valIdx) => {
                                    const val = rawVal as ProductVariationValue;
                                    return (
                                      <div key={valIdx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center">
                                          <input 
                                            type="text"
                                            value={val.label}
                                            onChange={(e) => updateVariationValue(attrIdx, valIdx, { label: e.target.value })}
                                            placeholder={meta.placeholder}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                          />
                                          {currentType === 'color' && (
                                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                              <input
                                                type="color"
                                                value={val.colorHex || '#111827'}
                                                onChange={(e) => updateVariationValue(attrIdx, valIdx, { colorHex: e.target.value })}
                                                className="w-7 h-7 rounded border-0 bg-transparent p-0"
                                              />
                                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cor</span>
                                            </div>
                                          )}
                                          <div className="flex items-center justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!imageLibrary.length) {
                                                  toast.info('Adicione imagens primeiro', 'Cadastre as fotos do produto para poder vincular uma variação.');
                                                  return;
                                                }
                                                setImagePickerTarget({ attrIndex: attrIdx, valueIndex: valIdx });
                                              }}
                                              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                                            >
                                              {val.image ? 'Trocar imagem' : 'Vincular imagem'}
                                            </button>
                                            <button 
                                              onClick={() => removeVariationValue(attrIdx, valIdx)}
                                              className="w-10 h-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                                            >
                                              <X className="w-4 h-4 mx-auto" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          {currentType === 'color' && (
                                            <div className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: val.colorHex || '#111827' }} />
                                          )}
                                          {val.image ? (
                                            <img src={val.image} alt={val.label || 'Variação'} className="w-12 h-12 rounded-xl border border-slate-200 object-cover bg-slate-50" referrerPolicy="no-referrer" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-300">IMG</div>
                                          )}
                                          <div>
                                            <p className="text-xs font-bold text-slate-700">{val.label || 'Valor da variação'}</p>
                                            <p className="text-[11px] text-slate-500">{val.image ? 'Imagem vinculada.' : 'Sem imagem vinculada.'}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <button 
                                    onClick={() => addVariationValue(attrIdx)}
                                    className="px-3 py-2 border border-dashed border-slate-300 rounded-xl text-[11px] font-bold text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-all self-start"
                                  >
                                    + {meta.addLabel}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!!(formData.variants || []).length && (
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                          <div>
                            <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider">Estoque por variação</h5>
                            <p className="mt-1 text-xs text-slate-500">Defina a quantidade real de cada opção. Isso será salvo nas variações do produto.</p>
                          </div>
                          <div className="space-y-3">
                            {(formData.variants || []).map((variant, variantIdx) => (
                              <div key={(variant as any).variationKey || variant.id || variantIdx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                  {(variant.image || '').trim() ? (
                                    <img src={variant.image} alt={variant.name} className="w-12 h-12 rounded-xl border border-slate-200 object-cover bg-slate-50" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-300">IMG</div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{variant.name || `Variação ${variantIdx + 1}`}</p>
                                    <p className="text-[11px] text-slate-500">Controle individual de estoque, SKU e ajuste de preço.</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Estoque</label>
                                    <input type="number" min="0" value={variant.stock ?? 0} onChange={(e) => updateVariant(variantIdx, { stock: parseInt(e.target.value || '0', 10) || 0 })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">SKU da variação</label>
                                    <input type="text" value={variant.sku || ''} onChange={(e) => updateVariant(variantIdx, { sku: e.target.value })} placeholder="Opcional" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Preço extra (R$)</label>
                                    <input type="number" step="0.01" value={variant.price ?? 0} onChange={(e) => updateVariant(variantIdx, { price: Number(e.target.value || 0) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        {imagePickerTarget && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setImagePickerTarget(null)} />
            <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-slate-900">Selecionar imagem da variação</h4>
                  <p className="text-xs text-slate-500">Escolha uma das imagens já cadastradas neste produto.</p>
                </div>
                <button onClick={() => setImagePickerTarget(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {imageLibrary.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => {
                      updateVariationValue(imagePickerTarget.attrIndex, imagePickerTarget.valueIndex, { image: img });
                      setImagePickerTarget(null);
                    }}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="aspect-square bg-slate-50"><img src={img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>
                    <div className="p-2 text-[11px] font-bold text-slate-600">Imagem {idx + 1}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}

        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
            >
              Cancelar
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
              Pressione Enter para ir para o próximo campo
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeStep > 0 && (
              <button 
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Voltar
              </button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <button 
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg"
              >
                Próxima etapa
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleSave(true)}
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Salvar rascunho
                </button>
                <button 
                  onClick={() => handleSave(false)}
                  className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Publicar Produto'}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
