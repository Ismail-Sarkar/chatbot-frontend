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
# ENV PORT=4000
# ENV NODE_ENV=production
# ENV REACT_APP_CSP=block
# EXPOSE 4000


# development
ENV SHARETRIBE_SDK_CLIENT_SECRET=ab49c194dfdf93e1e01859fdecb58b040f3e2446



#prod
# REACT_APP_SHARETRIBE_SDK_CLIENT_ID=448034b7-91b7-4904-9158-60336bf17325
# SHARETRIBE_SDK_CLIENT_SECRET=549334dae2f5d42fc5016478767574ebb83df119



ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51MsV6SFqKQyn7tbqwWY1TYeYlZNqMQOpue3BZQ44Sj4cDo4V71TLr6YsfDYGKFbqI0kOTirqNpLrG2R9FWA2ovMT00euM05MWs
ENV STRIPE_SECRET_KEY=sk_test_51MsV6SFqKQyn7tbqlGsHvT3QmcrEJbX8tYvHqu0IcEJzQpN3XXG5XR1ToaTy9OJzqdwDZp391IleRBC5hgFSuzyT00NRTRSFMM
# main
# REACT_APP_SHARETRIBE_SDK_CLIENT_ID=b4c987b1-65e2-42a6-8cd9-8759d8c5aa10
# SHARETRIBE_SDK_CLIENT_SECRET=dc274625240eab6c293062a2085d1dcbec63f0e2


ENV REACT_APP_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYml0ZnR3IiwiYSI6ImNqdG9kNDE3dTA1cjczeXMzcjB6NHo3Y2sifQ.lCt9ALCcfucgIsC4F_n8jA

# If you are using a process with privileged transitions,
# Client Secret needs to be set too. The one related to Client ID.
# You get this at Flex Console (Build -> Applications -> Add new).



# Or set up an alternative map provider (Google Maps). Check documentation.
# REACT_APP_GOOGLE_MAPS_API_KEY=

# Defaults
#
ENV REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY=USD
# Host/domain - don't use trailing slash: "/"
# REACT_APP_CANONICAL_ROOT_URL=http://localhost:3000
ENV REACT_APP_MARKETPLACE_ROOT_URL=http://localhost:3000

# Social logins && SSO
# If the app or client id is not set the auhtentication option is not shown in FTW
ENV REACT_APP_FACEBOOK_APP_ID=698557361573025
ENV FACEBOOK_APP_SECRET=2e3dca3d3194e59ba2964a02f5ace0b1

# REACT_APP_GOOGLE_CLIENT_ID=758977501081-bee43nrshgm9kb8111o53bveqggjhi3p.apps.googleusercontent.com
ENV REACT_APP_GOOGLE_CLIENT_ID=900807463806-2803p86nlg50lc1jird2bp6dm5tivvgc.apps.googleusercontent.com

ENV GOOGLE_CLIENT_SECRET=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
# BACKEND_GOOGLE_CLIENT_SECRET=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
ENV BACKEND_GOOGLE_CLIENT_SECRET=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


# This is overwritten by configuration in .env.development and
# .env.test. In production deployments use env variable and set it to
# 'production'
ENV REACT_APP_ENV=development


# CSP. You can use value 'report' or 'block'.
# If the env varibale is missing, csp is disabled.
ENV REACT_APP_CSP=report

# Options. Uncomment and set to test.
#

# REACT_APP_SHARETRIBE_USING_SSL=true
# SERVER_SHARETRIBE_TRUST_PROXY=true
# REACT_APP_SENTRY_DSN=change-me
# BASIC_AUTH_USERNAME=sharetribe
# BASIC_AUTH_PASSWORD=secret
# REACT_APP_GOOGLE_ANALYTICS_ID=change-me


# Features
#

ENV REACT_APP_AVAILABILITY_ENABLED=true
ENV REACT_APP_DEFAULT_SEARCHES_ENABLED=true

ENV REACT_APP_DEV_API_SERVER_PORT=3500

ENV SKIP_PREFLIGHT_CHECK=true

RUN yarn run build
USER node
CMD ["yarn", "start"]
EXPOSE 4000
RUN yarn run build
USER node
CMD ["yarn", "start"]
