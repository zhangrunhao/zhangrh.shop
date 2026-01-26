import { formatDate } from "../utils/date";
import type { Post } from "../types";
import { Link } from "./link";

export const PostList = ({ posts }: { posts: Post[] }) => (
  <div>
    {posts.map((post) => (
      <Link
        key={post.id}
        to={`/blogs/${post.id}`}
        className="flex flex-col space-y-1 mb-4"
      >
        <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
          <p className="text-neutral-600 w-[120px] tabular-nums">
            {formatDate(post.date)}
          </p>
          <p className="text-neutral-900 tracking-tight">{post.title}</p>
        </div>
      </Link>
    ))}
  </div>
);
