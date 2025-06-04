import createStore from './createStore.js';
import { applyMiddleware } from './applyMiddleware.js';
import { asyncMiddleware, thunkMiddleware, promiseMiddleware } from './asyncMiddleware.js';

// 示例 reducer
function userReducer(action, state = { 
  users: [], 
  loading: false, 
  error: null 
}) {
  switch (action.type) {
    case 'FETCH_USERS_PENDING':
      return { ...state, loading: true, error: null };
    case 'FETCH_USERS_FULFILLED':
      return { ...state, loading: false, users: action.payload };
    case 'FETCH_USERS_REJECTED':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

// 创建带异步中间件的 store
const store = createStore(userReducer, asyncMiddleware);

// ==================== Redux-Thunk 示例 ====================

// Thunk Action Creator
const fetchUsersThunk = () => {
  return async (dispatch, getState) => {
    dispatch({ type: 'FETCH_USERS_PENDING' });
    
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      
      dispatch({ 
        type: 'FETCH_USERS_FULFILLED', 
        payload: users 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_USERS_REJECTED', 
        payload: error.message 
      });
    }
  };
};

// 使用 Thunk
store.dispatch(fetchUsersThunk());

// ==================== Redux-Promise 示例 ====================

// Promise Action Creator
const fetchUsersPromise = () => {
  return {
    type: 'FETCH_USERS',
    payload: fetch('/api/users').then(res => res.json())
  };
};

// 使用 Promise
store.dispatch(fetchUsersPromise());

// 直接 dispatch Promise
store.dispatch(
  fetch('/api/users')
    .then(res => res.json())
    .then(users => ({ 
      type: 'FETCH_USERS_FULFILLED', 
      payload: users 
    }))
);

// ==================== 组合使用示例 ====================

// 复杂的异步操作
const complexAsyncAction = (userId) => {
  return async (dispatch, getState) => {
    // 1. 获取用户信息
    const userResponse = await fetch(`/api/users/${userId}`);
    const user = await userResponse.json();
    
    dispatch({ 
      type: 'USER_LOADED', 
      payload: user 
    });
    
    // 2. 基于用户信息获取相关数据
    if (user.type === 'admin') {
      // 使用 Promise action
      dispatch({
        type: 'ADMIN_DATA',
        payload: fetch('/api/admin-data').then(res => res.json())
      });
    }
    
    // 3. 嵌套的 thunk 调用
    dispatch((dispatch) => {
      setTimeout(() => {
        dispatch({ 
          type: 'DELAYED_ACTION', 
          payload: 'executed after delay' 
        });
      }, 1000);
    });
  };
};

// ==================== 错误处理示例 ====================

const errorHandlingExample = () => {
  return async (dispatch) => {
    try {
      dispatch({ type: 'API_CALL_START' });
      
      // 模拟可能失败的 API 调用
      const response = await fetch('/api/might-fail');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      dispatch({ 
        type: 'API_CALL_SUCCESS', 
        payload: data 
      });
      
    } catch (error) {
      dispatch({ 
        type: 'API_CALL_ERROR', 
        payload: error.message,
        error: true 
      });
    }
  };
};

// ==================== 监听状态变化 ====================

store.subscribe(() => {
  const state = store.getState();
  console.log('State updated:', state);
});

// 导出示例函数供外部使用
export {
  fetchUsersThunk,
  fetchUsersPromise,
  complexAsyncAction,
  errorHandlingExample,
  store
}; 