// reducer是状态修改规则
export default function createStore(reducer) {
  // 当前状态
  let currentState;
  let listeners = [];

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
    // 订阅, 将listener添加到listeners数组中, 每次dispatch后会调用所有订阅的subscribe
    listeners.push(listener);
    return () => {
      // 取消当前订阅
      listeners = listeners.filter((l) => l !== listener);
    }
  }

  // 产生一个初始值
  dispatch({ type: "ADDDDDDDDDDDDDDDDD" });

  return {
    getState,
    dispatch,
    subscribe,
  };
}
