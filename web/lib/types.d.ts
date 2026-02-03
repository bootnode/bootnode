declare global {
  interface Window {
    __BOOTNODE_API_URL__?: string
    __BOOTNODE_API_KEY__?: string
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL?: string
      NEXT_PUBLIC_API_KEY?: string
    }
  }
}

export {}