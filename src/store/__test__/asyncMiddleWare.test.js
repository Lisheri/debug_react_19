import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createStore from '../createStore.js';
import { applyMiddleware } from '../applyMiddleware.js';
import { 
  asyncMiddleware, 
  thunkMiddleware, 
  promiseMiddleware,
  advancedAsyncMiddleware 
} from '../asyncMiddleware.js';

// 测试用的简单 reducer
function testReducer(action, state = { data: null, status: 'idle', error: null }) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'FETCH_DATA_PENDING':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_DATA_FULFILLED':
      return { ...state, status: 'success', data: action.payload, error: null };
    case 'FETCH_DATA_REJECTED':
      return { ...state, status: 'error', error: action.payload };
    case 'RESET':
      return { data: null, status: 'idle', error: null };
    default:
      return state;
  }
}

describe('Redux 异步中间件测试', () => {
  
  describe('Redux-Thunk 中间件', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, thunkMiddleware);
    });
    
    it('应该支持dispatch函数类型的action', () => {
      const thunkAction = (dispatch, getState) => {
        const currentState = getState();
        expect(currentState.status).toBe('idle');
        dispatch({ type: 'SET_STATUS', payload: 'thunk-executed' });
      };
      
      store.dispatch(thunkAction);
      
      expect(store.getState().status).toBe('thunk-executed');
    });
    
    it('应该支持异步thunk action', async () => {
      const asyncThunkAction = (dispatch) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            dispatch({ type: 'SET_DATA', payload: 'async thunk data' });
            resolve('completed');
          }, 10);
        });
      };
      
      const result = await store.dispatch(asyncThunkAction);
      
      expect(result).toBe('completed');
      expect(store.getState().data).toBe('async thunk data');
    });
    
    it('应该支持嵌套的thunk调用', () => {
      const nestedThunkAction = (dispatch) => {
        dispatch({ type: 'SET_STATUS', payload: 'outer' });
        
        dispatch((innerDispatch) => {
          innerDispatch({ type: 'SET_DATA', payload: 'nested data' });
        });
      };
      
      store.dispatch(nestedThunkAction);
      
      expect(store.getState().status).toBe('outer');
      expect(store.getState().data).toBe('nested data');
    });
  });
  
  describe('Redux-Promise 中间件', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, promiseMiddleware);
    });
    
    it('应该支持直接dispatch Promise', async () => {
      const promiseAction = Promise.resolve({ 
        type: 'SET_DATA', 
        payload: 'promise data' 
      });
      
      await store.dispatch(promiseAction);
      
      expect(store.getState().data).toBe('promise data');
    });
    
    it('应该支持FSA格式的Promise action', async () => {
      const promiseAction = {
        type: 'SET_DATA',
        payload: Promise.resolve('fsa promise data')
      };
      
      await store.dispatch(promiseAction);
      
      expect(store.getState().data).toBe('fsa promise data');
    });
    
    it('应该处理Promise rejection', async () => {
      const errorPromiseAction = {
        type: 'SET_DATA',
        payload: Promise.reject('Promise rejection error')
      };
      
      await store.dispatch(errorPromiseAction);
      
      expect(store.getState().data).toBe('Promise rejection error');
    });
  });
  
  describe('组合异步中间件 (Thunk + Promise)', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, asyncMiddleware);
    });
    
    it('应该同时支持thunk和promise功能', async () => {
      // 先测试thunk
      const thunkAction = (dispatch) => {
        dispatch({ type: 'SET_STATUS', payload: 'thunk-ready' });
      };
      
      store.dispatch(thunkAction);
      expect(store.getState().status).toBe('thunk-ready');
      
      // 再测试promise
      const promiseAction = {
        type: 'SET_DATA',
        payload: Promise.resolve('combined data')
      };
      
      await store.dispatch(promiseAction);
      expect(store.getState().data).toBe('combined data');
    });
    
    it('应该支持在thunk中使用promise', async () => {
      const complexAction = (dispatch) => {
        dispatch({ type: 'SET_STATUS', payload: 'loading' });
        
        return dispatch({
          type: 'SET_DATA',
          payload: Promise.resolve('complex data')
        });
      };
      
      await store.dispatch(complexAction);
      
      expect(store.getState().data).toBe('complex data');
      expect(store.getState().status).toBe('loading');
    });
  });
  
  describe('高级异步中间件', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, advancedAsyncMiddleware);
    });
    
    it('应该支持自定义异步action对象', async () => {
      const asyncAction = {
        type: 'FETCH_DATA',
        async: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'advanced async data';
        }
      };
      
      const result = await store.dispatch(asyncAction);
      
      expect(result).toBe('advanced async data');
      expect(store.getState().data).toBe('advanced async data');
      expect(store.getState().status).toBe('success');
    });
    
    it('应该自动生成PENDING状态', () => {
      const asyncAction = {
        type: 'FETCH_DATA',
        async: async () => {
          return 'test data';
        }
      };
      
      store.dispatch(asyncAction);
      
      // 应该立即设置为loading状态
      expect(store.getState().status).toBe('loading');
    });
    
    it('应该处理异步action中的错误', async () => {
      const errorAsyncAction = {
        type: 'FETCH_DATA',
        async: async () => {
          throw new Error('async error');
        }
      };
      
      try {
        await store.dispatch(errorAsyncAction);
      } catch (error) {
        expect(error.message).toBe('async error');
      }
      
      expect(store.getState().status).toBe('error');
    });
  });
  
  describe('中间件组合', () => {
    let store;
    let logSpy;
    
    // 简单的日志中间件
    function loggerMiddleware(createStore) {
      return function enhancedCreateStore(reducer) {
        const store = createStore(reducer);
        const originalDispatch = store.dispatch;
        
        function loggedDispatch(action) {
          logSpy(action);
          return originalDispatch(action);
        }
        
        return {
          ...store,
          dispatch: loggedDispatch
        };
      };
    }
    
    beforeEach(() => {
      logSpy = vi.fn();
      store = createStore(
        testReducer, 
        applyMiddleware(loggerMiddleware, asyncMiddleware)
      );
    });
    
    afterEach(() => {
      vi.clearAllMocks();
    });
    
    it('应该按正确顺序执行多个中间件', () => {
      store.dispatch({ type: 'SET_DATA', payload: 'multi-middleware test' });
      
      expect(logSpy).toHaveBeenCalledWith({ 
        type: 'SET_DATA', 
        payload: 'multi-middleware test' 
      });
      expect(store.getState().data).toBe('multi-middleware test');
    });
    
    it('应该在组合中间件中支持thunk', () => {
      const thunkAction = (dispatch) => {
        dispatch({ type: 'SET_STATUS', payload: 'multi-thunk' });
      };
      
      store.dispatch(thunkAction);
      
      // logger中间件会记录thunk函数本身，而不是内部的action
      expect(logSpy).toHaveBeenCalledWith(thunkAction);
      expect(store.getState().status).toBe('multi-thunk');
    });
  });
  
  describe('性能测试', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, asyncMiddleware);
    });
    
    it('应该能够处理大量同步dispatch', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        store.dispatch({ type: 'SET_DATA', payload: `data-${i}` });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(store.getState().data).toBe('data-999');
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
    
    it('应该正确处理并发异步操作', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const promise = store.dispatch({
          type: 'SET_DATA',
          payload: Promise.resolve(`concurrent-${i}`)
        });
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      // 最后一个值应该被保存
      expect(store.getState().data).toContain('concurrent-');
      expect(store.getState().status).toBe('idle');
    });
  });
  
  describe('错误处理', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, asyncMiddleware);
    });
    
    it('应该处理thunk中的同步错误', () => {
      const errorThunkAction = (dispatch) => {
        try {
          throw new Error('Thunk sync error');
        } catch (error) {
          dispatch({ 
            type: 'FETCH_DATA_REJECTED', 
            payload: error.message 
          });
        }
      };
      
      store.dispatch(errorThunkAction);
      
      expect(store.getState().error).toBe('Thunk sync error');
      expect(store.getState().status).toBe('error');
    });
    
    it('应该处理thunk中的异步错误', async () => {
      const errorThunkAction = async (dispatch) => {
        try {
          await Promise.reject('Thunk async error');
        } catch (error) {
          dispatch({ 
            type: 'FETCH_DATA_REJECTED', 
            payload: error 
          });
        }
      };
      
      await store.dispatch(errorThunkAction);
      
      expect(store.getState().error).toBe('Thunk async error');
      expect(store.getState().status).toBe('error');
    });
    
    it('应该处理Promise rejection', async () => {
      const errorPromiseAction = {
        type: 'SET_DATA',
        payload: Promise.reject('Promise rejection error')
      };
      
      await store.dispatch(errorPromiseAction);
      
      expect(store.getState().data).toBe('Promise rejection error');
    });
  });
  
  describe('边界情况', () => {
    let store;
    
    beforeEach(() => {
      store = createStore(testReducer, asyncMiddleware);
    });
    
    it('应该处理null action', () => {
      expect(() => {
        store.dispatch(null);
      }).not.toThrow();
    });
    
    it('应该处理undefined action', () => {
      expect(() => {
        store.dispatch(undefined);
      }).not.toThrow();
    });
    
    it('应该处理空对象action', () => {
      store.dispatch({});
      expect(store.getState()).toBeDefined();
    });
    
    it('应该处理没有payload的Promise action', async () => {
      const action = {
        type: 'SET_DATA',
        payload: Promise.resolve()
      };
      
      await store.dispatch(action);
      
      expect(store.getState().data).toBeUndefined();
    });
  });
});