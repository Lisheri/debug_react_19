import createStore from './createStore.js';
import { applyMiddleware } from './applyMiddleware.js';
import { 
  asyncMiddleware, 
  thunkMiddleware, 
  promiseMiddleware,
  advancedAsyncMiddleware 
} from './asyncMiddleware.js';

// 测试用的简单 reducer
function testReducer(action, state = { data: null, status: 'idle' }) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'FETCH_DATA_PENDING':
      return { ...state, status: 'loading' };
    case 'FETCH_DATA_FULFILLED':
      return { ...state, status: 'success', data: action.payload };
    case 'FETCH_DATA_REJECTED':
      return { ...state, status: 'error', data: action.payload };
    default:
      return state;
  }
}

console.log('=== Redux 异步中间件测试 ===\n');

// ==================== 测试 1: Redux-Thunk 中间件 ====================
console.log('1. 测试 Redux-Thunk 中间件');

const thunkStore = createStore(testReducer, thunkMiddleware);

thunkStore.subscribe(() => {
  console.log('Thunk Store State:', thunkStore.getState());
});

// Thunk action
const thunkAction = (dispatch, getState) => {
  console.log('执行 thunk action, 当前状态:', getState());
  dispatch({ type: 'SET_STATUS', payload: 'thunk-executed' });
  
  // 模拟异步操作
  setTimeout(() => {
    dispatch({ type: 'SET_DATA', payload: 'thunk data' });
  }, 100);
};

thunkStore.dispatch(thunkAction);

// ==================== 测试 2: Redux-Promise 中间件 ====================
console.log('\n2. 测试 Redux-Promise 中间件');

const promiseStore = createStore(testReducer, promiseMiddleware);

promiseStore.subscribe(() => {
  console.log('Promise Store State:', promiseStore.getState());
});

// Promise action (方式1: 直接dispatch Promise)
const promiseAction1 = Promise.resolve({ 
  type: 'SET_DATA', 
  payload: 'promise data 1' 
});

promiseStore.dispatch(promiseAction1);

// Promise action (方式2: FSA格式)
const promiseAction2 = {
  type: 'FETCH_DATA',
  payload: Promise.resolve('promise data 2')
};

promiseStore.dispatch(promiseAction2);

// ==================== 测试 3: 组合异步中间件 ====================
console.log('\n3. 测试组合异步中间件 (Thunk + Promise)');

const combinedStore = createStore(testReducer, asyncMiddleware);

combinedStore.subscribe(() => {
  console.log('Combined Store State:', combinedStore.getState());
});

// 测试 thunk 功能
combinedStore.dispatch((dispatch) => {
  dispatch({ type: 'SET_STATUS', payload: 'combined-thunk' });
});

// 测试 promise 功能
combinedStore.dispatch({
  type: 'FETCH_DATA',
  payload: Promise.resolve('combined promise data')
});

// ==================== 测试 4: 高级异步中间件 ====================
console.log('\n4. 测试高级异步中间件');

const advancedStore = createStore(testReducer, advancedAsyncMiddleware);

advancedStore.subscribe(() => {
  console.log('Advanced Store State:', advancedStore.getState());
});

// 测试自定义异步action对象
advancedStore.dispatch({
  type: 'FETCH_DATA',
  async: async (dispatch, getState) => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'advanced async data';
  }
});

// ==================== 测试 5: 多中间件组合 ====================
console.log('\n5. 测试多中间件组合');

// 简单的日志中间件
function loggerMiddleware(createStore) {
  return function enhancedCreateStore(reducer) {
    const store = createStore(reducer);
    const originalDispatch = store.dispatch;
    
    function loggedDispatch(action) {
      console.log('🚀 Dispatching:', action);
      const result = originalDispatch(action);
      console.log('📦 New State:', store.getState());
      return result;
    }
    
    return {
      ...store,
      dispatch: loggedDispatch
    };
  };
}

const multiStore = createStore(
  testReducer, 
  applyMiddleware(loggerMiddleware, asyncMiddleware)
);

console.log('测试多中间件组合:');
multiStore.dispatch({ type: 'SET_DATA', payload: 'multi-middleware test' });

multiStore.dispatch((dispatch) => {
  dispatch({ type: 'SET_STATUS', payload: 'multi-middleware-thunk' });
});

// ==================== 性能测试 ====================
console.log('\n6. 性能测试');

const perfStore = createStore(testReducer, asyncMiddleware);
const startTime = performance.now();

// 批量dispatch测试
for (let i = 0; i < 1000; i++) {
  perfStore.dispatch({ type: 'SET_DATA', payload: `data-${i}` });
}

const endTime = performance.now();
console.log(`批量dispatch 1000次耗时: ${(endTime - startTime).toFixed(2)}ms`);

// ==================== 错误处理测试 ====================
console.log('\n7. 错误处理测试');

const errorStore = createStore(testReducer, asyncMiddleware);

errorStore.subscribe(() => {
  console.log('Error Store State:', errorStore.getState());
});

// 测试Promise错误处理
const errorPromiseAction = {
  type: 'FETCH_DATA',
  payload: Promise.reject('Promise error occurred')
};

errorStore.dispatch(errorPromiseAction)
  .catch(error => console.log('捕获到Promise错误:', error));

// 测试Thunk错误处理
const errorThunkAction = (dispatch) => {
  try {
    throw new Error('Thunk error occurred');
  } catch (error) {
    dispatch({ 
      type: 'FETCH_DATA_REJECTED', 
      payload: error.message,
      error: true 
    });
  }
};

errorStore.dispatch(errorThunkAction);

console.log('\n=== 测试完成 ===');

export {
  thunkStore,
  promiseStore,
  combinedStore,
  advancedStore,
  multiStore
};