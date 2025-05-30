import {
  // startTransition
  useTransition,
} from "../whichReact";

export default function Button({ refresh }) {
  // 这样就不会立即更新了
  const [isPending, startTransition] = useTransition();
  return (
    <div>
      <h3>Button</h3>
      <button
        disabled={isPending}
        onClick={() => {
          // 使用transition调度refresh, 则不会出现Suspense的Fallback效果, 而是等待loading结束后直接刷新页面
          startTransition(refresh);
        }}
      >
        refresh
      </button>
      <p>{isPending ? "loading" : ""}</p>
    </div>
  );
}
