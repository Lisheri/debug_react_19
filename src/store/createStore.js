// reducer是状态修改规则
export default function createStore(reducer, enhancer) {
  // 如果存在enhancer, 则使用enhancer来创建store, 否则使用默认的createStore
  // 目的是用于支持中间件, 中间件可以增强dispatch函数, 从而实现异步action, 日志记录, 数据持久化等功能
  if (enhancer) {
    return enhancer(createStore)(reducer);
  }
  // 当前状态
  let currentState;
  let listenerIdCounter = 0;
  let listeners = new Map();

  // 获取状态
  function getState() {
    return currentState;
  }

  // 通过dispatch分发action, 修改状态
  function dispatch(action) {
    // reducer用于确定当前action是什么类型, 做不同的处理, 是一个纯函数
    currentState = reducer(action, currentState);

    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    const listenerId = listenerIdCounter++;
    // 订阅, 将listener添加到listeners数组中, 每次dispatch后会调用所有订阅的subscribe
    listeners.set(listenerId, listener);
    return () => {
      // 取消当前订阅
      listeners.delete(listenerId);
    };
  }

  // 产生一个初始值
  dispatch({ type: "ADDDDDDDDDDDDDDDDD" });

  return {
    getState,
    dispatch,
    subscribe,
  };
}
