import {
  useId,
  useSyncExternalStore,
  useInsertionEffect,
  useState,
  useEffect,
  useLayoutEffect,
  useReducer,
} from "../whichReact";

import store from "../store/";

const createStore = () => {
  let state = 0;
  const listeners = new Set();

  const setState = (newState) => {
    state = newState;
    console.info(listeners.size, "订阅长度");
    listeners.forEach((listener) => listener());
  };
  const getState = () => {
    return state;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      // 必须清理订阅
      listeners.delete(listener);
    };
  };
  return {
    setState,
    getState,
    subscribe,
  };
};

const store2 = createStore();

const ComponentCount2 = () => {
  const state2 = useSyncExternalStore(store2.subscribe, store2.getState);
  return (
    <>
      <button onClick={() => store2.setState(state2 + 1)}>
        btnState2: - {state2}
      </button>
    </>
  );
};

export default function NewHookApi({ storeProps }) {
  // 产生一个专属的id, 一定不会重复, 用于处理ssr渲染问题
  const id = useId();

  // const state = store.getState();

  // const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // useEffect(() => {
  // 如果带这个调用, 不使用 useReducer返回的dispatch(第二个参数), 那么
  //   store.subscribe(() => {
  //     forceUpdate();
  //   });
  // }, []);
  // 第一个参数是订阅, 第二个参数是获取快照, 第三个参数是获取初始值
  // 这个获取快照, 其实就是获取状态
  // 其实就是类似增加了自动订阅状态的机制, 在state发生变化后, 会自动更新
  const state = useSyncExternalStore(store.subscribe, store.getState);

  const state2 = useSyncExternalStore(store2.subscribe, store2.getState);

  useInsertionEffect(() => {
    // debugger;
    console.info("useInsertionEffect");
  }, []);
  useLayoutEffect(() => {
    // debugger;
    console.info("useLayoutEffect");
  }, []);
  useEffect(() => {
    // debugger;
    console.info("useEffect");
  }, []);

  return (
    <div>
      <h3 id={id}>NewHookApi</h3>

      <button
        onClick={() => {
          store.dispatch({ type: "ADD" });
        }}
      >
        state-: {state}
      </button>

      <button onClick={() => store2.setState(state2 + 1)}>
        state2-: {state2}
      </button>
      <ComponentCount2 />
      {/* <button onClick={() => setCount(count + 1)}>count: {count}</button>  */}
    </div>
  );
}
