steps:
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-image'
    args:
      - 'build'
      - '-t'
      - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:$COMMIT_SHA'
      - '-t'
      - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:latest'
      - '.'

  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-sha'
    args:
      - 'push'
      - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:$COMMIT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-latest'
    args:
      - 'push'
      - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:latest'

  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'deploy'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'recipe-backend'
      - '--image=asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:$COMMIT_SHA'
      - '--region=asia-south1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--project=recipe-shopping-mvp'
      - '--quiet'

images:
  - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:$COMMIT_SHA'
  - 'asia-south1-docker.pkg.dev/recipe-shopping-mvp/cloud-run-source-deploy/recipe-backend:latest'

options:
  logging: CLOUD_LOGGING_ONLY