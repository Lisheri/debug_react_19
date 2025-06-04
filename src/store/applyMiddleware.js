// src/middleware/applyMiddleware.js

/**
 * 应用多个中间件
 * @param {...Function} middlewares - 中间件函数数组
 * @returns {Function} 组合后的 enhancer
 */
export function applyMiddleware(...middlewares) {
  return function enhancer(createStore) {
    return function enhancedCreateStore(reducer) {
      // 从右到左组合中间件
      const composedCreateStore = middlewares.reduceRight(
        (prevCreateStore, middleware) => middleware(prevCreateStore),
        createStore,
      );

      return composedCreateStore(reducer);
    };
  };
}
