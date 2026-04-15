# 🚀 Running my-ada-web on macOS

This Docker image supports:

- ✅ Intel Macs (amd64)
- ✅ Apple Silicon Macs (M1 / M2 / M3 – arm64)

Docker will automatically pull the correct architecture.

---

## 📦 1. Install Docker Desktop (If Not Installed)

Download from:

https://www.docker.com/products/docker-desktop/

Verify installation:

```bash
docker --version
```

---

## 📥 2. Pull the Image

```bash
docker pull zakiraghakishiyev/my-ada-web:1.1
```

(Optional: pull latest tag)

```bash
docker pull zakiraghakishiyev/my-ada-web:latest
```

---

## ▶️ 3. Run the Container

If the app is served using nginx on port 80 (default setup):

```bash
docker run -d \
  --name my-ada-web \
  -p 8080:80 \
  zakiraghakishiyev/my-ada-web:latest
```

---

## 🌐 4. Open in Browser

Open:

http://localhost:8080

---

## 🔍 5. Check Running Containers

```bash
docker ps
```

---

## 🛑 6. Stop & Remove Container

Stop container:

```bash
docker stop my-ada-web
```

Remove container:

```bash
docker rm my-ada-web
```

---

## 🧠 (Optional) Force Architecture Manually

Docker auto-detects architecture, but if needed:

Force Apple Silicon (ARM64):

```bash
docker run --platform linux/arm64 -d -p 8080:80 zakiraghakishiyev/my-ada-web:latest
```

Force Intel (AMD64):

```bash
docker run --platform linux/amd64 -d -p 8080:80 zakiraghakishiyev/my-ada-web:latest
```

---

✅ The image is multi-architecture and works seamlessly on all Mac systems.