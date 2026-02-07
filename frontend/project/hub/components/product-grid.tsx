import type { Product } from "../types";
import { Link } from "./link";

export const ProductGrid = ({ products }: { products: Product[] }) => (
  <div className="grid grid-cols-1 gap-5 min-[576px]:grid-cols-2 min-[768px]:grid-cols-3">
    {products.map((product) => (
      <Link
        key={product.id}
        to={`/products/${product.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        ariaLabel={product.title}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={product.cover}
            alt={product.title}
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="text-sm font-semibold leading-5 text-neutral-900">
            {product.title}
          </h3>
          <p className="text-sm leading-5 text-neutral-600">
            {product.summary}
          </p>
        </div>
      </Link>
    ))}
  </div>
);
