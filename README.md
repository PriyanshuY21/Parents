For running it locally
Run pnpm install in both client and server app 
Copy .env.example and create a .env in server 
Generate JWT keys with pnpm generte-keys 
Add keys in JWT_PRIVATE_KEY and JWT_PUBLIC_KEY in .env with ' '
Add https://inference.do-ai.run/v1 in GROQ_BASE_URL and your_do_gradient_key in GROQ_API_KEY in .env 
