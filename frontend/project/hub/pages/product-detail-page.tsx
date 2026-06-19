import { Link } from "../components/link";
import { ArrowIcon } from "../components/icons";
import { ProductDetailMeta, ProductStatusBadge } from "../components/product-card";
import { PRODUCTS } from "../shared/data";
import { resolveImageUrl } from "../shared/format";

export const ProductDetailPage = ({ productId }: { productId: string }) => {
  const product = PRODUCTS.find((item) => item.id === productId);

  if (!product) {
    return (
      <section className="space-y-4 pb-14 pt-8">
        <h1 className="text-2xl font-semibold text-[#171717]">作品不存在</h1>
        <p className="text-[#525252]">未找到对应作品，请返回作品列表查看。</p>
        <div>
          <Link
            to="/products"
            className="inline-flex h-10 items-center rounded-xl bg-[#009966] px-4 text-sm font-medium text-white"
          >
            返回作品列表
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#525252]"
        >
          <ArrowIcon />
          返回作品列表
        </Link>
      </div>

      <article className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
        <div className="h-[420px] w-full overflow-hidden bg-neutral-100">
          <img
            src={resolveImageUrl(product.coverImage)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
              {product.name}
            </h1>
            <ProductStatusBadge status={product.status} />
          </div>

          <p className="text-sm leading-7 text-[#525252]">{product.summary}</p>
          <ProductDetailMeta product={product} />
        </div>
      </article>
    </section>
  );
};
