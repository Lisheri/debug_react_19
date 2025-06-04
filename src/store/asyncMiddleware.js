/**
 * Redux 异步中间件 - 支持 redux-thunk 和 redux-promise
 * @param {Function} createStore - 原始的 createStore 函数
 * @returns {Function} 增强后的 createStore 函数
 */
export function asyncMiddleware(createStore) {
  return function enhancedCreateStore(reducer) {
    // 创建原始 store
    const store = createStore(reducer);
    
    // 保存原始 dispatch
    const originalDispatch = store.dispatch;
    
    // 增强 dispatch 函数
    function enhancedDispatch(action) {
      // 处理null或undefined action
      if (!action) {
        return originalDispatch({ type: '@@NOOP' });
      }
      
      // redux-thunk: 如果 action 是函数，则执行它并传入 dispatch 和 getState
      if (typeof action === 'function') {
        return action(enhancedDispatch, store.getState);
      }
      
      // redux-promise: 如果 action 是 Promise，等待解析后再 dispatch
      if (action && typeof action.then === 'function') {
        return action.then(enhancedDispatch);
      }
      
      // redux-promise: 如果 action 对象包含 Promise 类型的 payload
      if (action && action.payload && typeof action.payload.then === 'function') {
        return action.payload
          .then(result => enhancedDispatch({ ...action, payload: result }))
          .catch(error => enhancedDispatch({ 
            ...action, 
            payload: error, 
            error: true 
          }));
      }
      
      // 普通 action 直接使用原始 dispatch
      return originalDispatch(action);
    }
    
    // 返回增强后的 store
    return {
      ...store,
      dispatch: enhancedDispatch
    };
  };
}

/**
 * Redux-Thunk 中间件实现
 */
export function thunkMiddleware(createStore) {
  return function enhancedCreateStore(reducer) {
    const store = createStore(reducer);
    const originalDispatch = store.dispatch;
    
    function thunkDispatch(action) {
      if (typeof action === 'function') {
        return action(thunkDispatch, store.getState);
      }
      return originalDispatch(action);
    }
    
    return {
      ...store,
      dispatch: thunkDispatch
    };
  };
}

/**
 * Redux-Promise 中间件实现
 */
export function promiseMiddleware(createStore) {
  return function enhancedCreateStore(reducer) {
    const store = createStore(reducer);
    const originalDispatch = store.dispatch;
    
    function promiseDispatch(action) {
      // 处理 Promise 类型的 action
      if (action && typeof action.then === 'function') {
        return action.then(promiseDispatch);
      }
      
      // 处理包含 Promise payload 的 action
      if (action && action.payload && typeof action.payload.then === 'function') {
        return action.payload
          .then(result => promiseDispatch({ ...action, payload: result }))
          .catch(error => promiseDispatch({ 
            ...action, 
            payload: error, 
            error: true 
          }));
      }
      
      return originalDispatch(action);
    }
    
    return {
      ...store,
      dispatch: promiseDispatch
    };
  };
}

/**
 * 增强版异步中间件 - 支持更多功能
 */
export function advancedAsyncMiddleware(createStore) {
  return function enhancedCreateStore(reducer) {
    const store = createStore(reducer);
    const originalDispatch = store.dispatch;
    
    function advancedDispatch(action) {
      // 1. Thunk 支持：函数类型 action
      if (typeof action === 'function') {
        return action(advancedDispatch, store.getState);
      }
      
      // 2. Promise 支持：Promise 类型 action
      if (action && typeof action.then === 'function') {
        return action.then(advancedDispatch);
      }
      
      // 3. FSA (Flux Standard Action) Promise 支持
      if (action && action.payload && typeof action.payload.then === 'function') {
        const { type, meta } = action;
        
        return action.payload
          .then(result => advancedDispatch({ 
            type, 
            payload: result, 
            meta 
          }))
          .catch(error => advancedDispatch({ 
            type, 
            payload: error, 
            error: true, 
            meta 
          }));
      }
      
      // 4. 自定义异步 action 对象
      if (action && action.async && typeof action.async === 'function') {
        const { type, async: asyncFn, meta, ...rest } = action;
        
        // 发送开始状态
        originalDispatch({ 
          type: `${type}_PENDING`, 
          meta,
          ...rest 
        });
        
        return asyncFn(advancedDispatch, store.getState)
          .then(result => {
            originalDispatch({ 
              type: `${type}_FULFILLED`, 
              payload: result,
              meta,
              ...rest 
            });
            return result;
          })
          .catch(error => {
            originalDispatch({ 
              type: `${type}_REJECTED`, 
              payload: error,
              error: true,
              meta,
              ...rest 
            });
            throw error;
          });
      }
      
      // 5. 普通 action
      return originalDispatch(action);
    }
    
    return {
      ...store,
      dispatch: advancedDispatch
    };
  };
}
