import { WorkCard } from "../components/work-card";
import { WORKS } from "../shared/data";

export const ProductsPage = () => {
  return (
    <section className="space-y-6 pb-14 pt-8">
      <div>
        <h1 className="text-[36px] font-semibold leading-[40px] tracking-normal text-[#171717]">
          作品
        </h1>
        <p className="mt-3 text-base leading-7 tracking-normal text-[#525252]">
          测试作品列表，后续替换为正式作品。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {WORKS.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </section>
  );
};
