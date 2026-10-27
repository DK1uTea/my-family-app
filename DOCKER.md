# Build docker
```
docker build --build-arg NEXT_PUBLIC_API_BASE_URL= --build-arg NEXT_PUBLIC_API_VERSION= --build-arg NEXT_PUBLIC_IMAGE_HOST= --build-arg NEXT_PUBLIC_VERSION= --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY= \
  -t ft-my-family-app .
```

# Run docker
```
docker run -e RECAPTCHA_SECRET_KEY= -p 3000:3000 ft-my-family-app
```