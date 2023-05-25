quick prototype made for a friend

[see the video](https://vimeo.com/399089539)

![Image](/example.png)

```bash
	# modify server/.env.example -> server/.env
	# modify client/.env.example -> client/.env.development
	# (if no stripe key, disable stripe func in Join.vue & public.js controller)
	# (if using postgres, set "DATABASE_TYPE" in ./server/config/default.json to "pg" and uncomment and set postgres environment variables in ./deploy/docker-compose.*.yml)

	npm run deploy-dev
	# OR 
	npm run build
	cd deploy && docker-compose -p byzantine_dev -f docker-compose.yml -f docker-compose.dev.yml up
	
	cd server && npm run dev
	cd client && npm run serve

	# http://127.0.0.1:8080/join
```
