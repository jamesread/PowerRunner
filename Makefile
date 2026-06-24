DATE := $(shell date +%s)
IMAGE := ghcr.io/jamesread/powerrunner:$(DATE)

.PHONY: frontend image container publish

frontend:
	npm ci
	npm run lint
	npm test
	npm run build

image: frontend
	docker build . --file Dockerfile -t $(IMAGE)

container: image
	docker kill pr || true
	docker rm pr || true
	docker run -p 3000:3000 -d --name pr $(IMAGE)

publish: image
	docker push $(IMAGE)
