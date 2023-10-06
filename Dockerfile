# export PROJECT_ID=$(gcloud config list project --format "value(core.project)")
# export REPO_NAME=adv-marketplace
# export IMAGE_NAME=matketplace-ui
# export IMAGE_TAG=latest
# export IMAGE_URI=us-central1-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${IMAGE_TAG}

# to build image: docker build --platform linux/amd64 -t ${IMAGE_URI} -f Dockerfile .
# to test locally: docker run --platform linux/amd64 -ti --rm ${IMAGE_URI}
# to push gcp artificats: docker push ${IMAGE_URI}

FROM node:16
WORKDIR /home/node/app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
ENV PORT=4000
ENV NODE_ENV=production
ENV REACT_APP_CSP=block
ENV REACT_APP_SHARETRIBE_SDK_CLIENT_ID=41d902b5-a68a-473e-bc72-c5b2f82b2082
EXPOSE 4000
RUN yarn run build
USER node
CMD ["yarn", "start"]
