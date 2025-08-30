DATE := $(shell date +%s)

frontend:
	npm ci
	vite build

container: frontend
	docker kill pr || true 
	docker rm pr || true
	docker build . --file Dockerfile -t ghcr.io/jamesread/powerrunner:${DATE}
	docker run -p 3000:3000 -d --name pr ghcr.io/jamesread/powerrunner:${DATE}

publish: container
	docker push ghcr.io/jamesread/powerrunner:${DATE}


.PHONY: default publish
