import * as React from 'react'

function hashKey(queryKey) {
  return JSON.stringify(queryKey);
}

export class QueryClient {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get(queryKey) {
    const hash = hashKey(queryKey);

    if (!this.cache.has(hash)) {
      this.set(queryKey, {
        status: 'pending',
      })
    }

    return this.cache.get(h\ash);
  }

  set(queryKey, query) {
    const hash = hashKey(queryKey);
    this.cache.set(hash, { ...this.cache.get(hash), ...query });
    this.listeners.forEach(listener => listener(queryKey));
  }

  async obtain({ queryKey, queryFn }) {
    try {
      const data = await queryFn(queryKey);
      this.set(queryKey, { data, status: 'success' });
    } catch (error) {
      this.set(queryKey, { error, status: 'error' });
    }   
  }
}

function createObserver(queryClient, options) {
  return {
    subscribe(notify) {
      const unscubscribe = queryClient.subscribe(queryKey => {
        if (hashKey(options.queryKey) === hashKey(queryKey)) {
          notify();
        }
      });
      queryClient.obtain(options);
      return unsubscribe;
    },
    getSnapshot() {
      return queryClient.get(options.queryKey);
    }
  }
}

export function useQuery(options) {
  const queryClient = React.useContext(QueryClientContext)
  const observerRef = React.useRef()

  if (!observerRef.current) {
    observerRef.current = createObserver(queryClient, options)
  }

  return React.useSyncExternalStore(
    observerRef.current.subscribe,
    observerRef.current.getSnapshot
  )
}

const QueryClientContext = React.createContext()

export function QueryClientProvider({ client, children }) {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  )
}
