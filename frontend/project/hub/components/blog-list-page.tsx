import type { Post } from "../types";
import { PostList } from "./post-list";

export const BlogListPage = ({ posts }: { posts: Post[] }) => (
  <section>
    <h1 className="mb-8 text-2xl font-semibold tracking-tighter">博客</h1>
    <PostList posts={posts} />
  </section>
);
