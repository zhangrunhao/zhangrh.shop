import type { Product } from "../types";
import { ProductGrid } from "./product-grid";

export const ProductListPage = ({ products }: { products: Product[] }) => (
  <section>
    <h1 className="mb-8 text-2xl font-semibold tracking-tighter">产品列表</h1>
    <ProductGrid products={products} />
  </section>
);
