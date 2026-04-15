import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { IMAGE_BASE_URL } from "@/src/config/api";

const products = [
  { id: 1, name: "iPhone 15 Pro Max", sales: 124, revenue: "R$ 842.000", image: "https://picsum.photos/seed/iphone/100/100" },
  { id: 2, name: "MacBook Air M3", sales: 86, revenue: "R$ 654.000", image: "https://picsum.photos/seed/macbook/100/100" },
  { id: 3, name: "AirPods Pro 2", sales: 245, revenue: "R$ 342.000", image: "https://picsum.photos/seed/airpods/100/100" },
  { id: 4, name: "iPad Pro 12.9", sales: 52, revenue: "R$ 284.000", image: "https://picsum.photos/seed/ipad/100/100" },
];

export function TopProducts({ data }: { data?: any[] }) {
  const products = data || [];
  
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {products.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">Nenhum produto vendido ainda.</p>
          )}
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted">
                <img 
                  src={product.image ? `${IMAGE_BASE_URL}/${product.image.replace('./', '')}` : `https://picsum.photos/seed/${product.id}/100/100`} 
                  alt={product.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-br-lg bg-[#f97316] text-[10px] font-bold text-white shadow-sm">
                  #{index + 1}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold leading-none">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.totalSold} unidades vendidas</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand">R$ {parseFloat(product.revenue).toLocaleString('pt-BR')}</p>
                <Badge variant="secondary" className="text-[10px] rounded-full">Top {index + 1}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
