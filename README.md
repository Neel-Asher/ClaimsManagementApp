# InsuranceIQ — Cloud Deployment
### Branch: `dev-cloud-deployment`

> **Insurance Intelligence Platform** — Infrastructure, containerization, CI/CD, and cloud deployment configuration for the full InsuranceIQ microservices platform. This branch contains Dockerfiles for all four services, AWS EKS Kubernetes deployment manifests, a Jenkins CI/CD pipeline, and a Prometheus/Grafana monitoring stack.

---

## Table of Contents

1. [Overview](#overview)
2. [Cloud Architecture](#cloud-architecture)
3. [Infrastructure Stack](#infrastructure-stack)
4. [Containerization](#containerization)
5. [Kubernetes (EKS) Deployment](#kubernetes-eks-deployment)
6. [CI/CD Pipeline — Jenkins](#cicd-pipeline--jenkins)
7. [AWS Services Used](#aws-services-used)
8. [Monitoring — Prometheus & Grafana](#monitoring--prometheus--grafana)
9. [Environment Variables & Secrets](#environment-variables--secrets)
10. [Service Port Reference](#service-port-reference)
11. [Testing](#testing)
12. [Prerequisites](#prerequisites)
13. [Deployment Walkthrough](#deployment-walkthrough)

---

## Overview

The `dev-cloud-deployment` branch integrates the four application services (React, Spring Boot, Python FastAPI, Node.js) into a fully containerized, cloud-native deployment. The deployment target is **AWS EKS (Elastic Kubernetes Service)** with NGINX Ingress for routing, AWS ECR for image registry, AWS EBS for persistent MySQL storage, and Jenkins for automated CI/CD.

Each service is independently containerized with a production-optimized multi-stage Dockerfile, deployed as a Kubernetes workload, and exposed behind a unified NGINX Ingress that routes traffic based on URL path.

---

## Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Public Internet                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   AWS Network Load Balancer  │
              │   (Provisioned by EKS)       │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │   NGINX Ingress Controller    │
              │   Path-based routing          │
              └────┬───────┬───────┬──────────┘
                   │       │       │       │
          /        │ /api  │ /ml   │ /socket.io
          ▼        ▼       ▼       ▼
  ┌────────────┐ ┌──────┐ ┌─────┐ ┌──────────────┐
  │  React     │ │Spring│ │Fast │ │  Node.js     │
  │  Frontend  │ │ Boot │ │ API │ │  Notification│
  │  :80       │ │:8080 │ │:8000│ │  :5001       │
  └────────────┘ └──┬───┘ └─────┘ └──────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  MySQL 8.0       │
          │  :3306           │
          │  EBS Persistent  │
          │  Volume (gp2)    │
          └──────────────────┘

  ┌─────────────────────────────────┐
  │   Monitoring Namespace          │
  │   Prometheus → Grafana          │
  │   (kube-prometheus-stack/Helm)  │
  └─────────────────────────────────┘
```

---

## Infrastructure Stack

| Layer             | Technology                        | Version / Notes              |
|-------------------|-----------------------------------|------------------------------|
| Cloud Provider    | AWS                               | —                            |
| Container Runtime | Docker, containerd                | Latest                       |
| Orchestration     | AWS EKS (Kubernetes)              | EKS v1.34                    |
| EKS Provisioning  | eksctl                            | Latest                       |
| Image Registry    | AWS ECR (Elastic Container Registry)| Per-service repositories   |
| Ingress           | NGINX Ingress Controller          | Latest (via Helm)            |
| Load Balancer     | AWS Network Load Balancer (NLB)   | Auto-provisioned by EKS      |
| Persistent Storage| AWS EBS CSI Driver                | gp2 StorageClass             |
| CI/CD             | Jenkins (Pipeline as Code)        | Groovy Jenkinsfile           |
| Monitoring        | Prometheus + Grafana              | kube-prometheus-stack (Helm) |
| Secrets Mgmt      | Kubernetes Secrets + env var injection | —                       |

---

## Containerization

Each service has its own production-optimized `Dockerfile`. All images use lightweight Alpine or slim base images and are pushed to AWS ECR.

### React Frontend (`client/Dockerfile`)
**Multi-stage build:** Node 20 Alpine → Nginx Alpine

```
Stage 1 (build):
  - Base: node:20-alpine
  - Installs npm dependencies
  - Accepts VITE_SPRING_API_URL and VITE_SOCKET_URL as build-time ARGs
  - Runs: npm run build → outputs to /app/dist

Stage 2 (serve):
  - Base: nginx:alpine
  - Copies /app/dist → /usr/share/nginx/html
  - Copies custom nginx.conf (SPA routing: try_files $uri /index.html)
  - Exposes port 80
```

Build args:
```bash
docker build \
  --build-arg VITE_SPRING_API_URL=/api \
  --build-arg VITE_SOCKET_URL="" \
  -t insuranceiq-frontend .
```

### Spring Boot Backend (`server/Dockerfile`)
**Multi-stage build:** Maven 3.9.6 / JDK 17 Alpine → JRE 17 Alpine

```
Stage 1 (build):
  - Base: maven:3.9.6-eclipse-temurin-17-alpine
  - Copies pom.xml and src/, runs: mvn clean package -DskipTests
  - Output: target/*.jar

Stage 2 (run):
  - Base: eclipse-temurin:17-jre-alpine
  - Copies compiled JAR
  - Injects env vars: SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME,
    SPRING_DATASOURCE_PASSWORD, APP_FRAUD_SERVICE_URL,
    APP_NOTIFICATION_SERVICE_URL
  - Exposes port 8080
```

### Python ML Service (`ml-service/Dockerfile`)
```
- Base: python:3.11-slim
- Installs gcc for native dependencies (pymysql)
- pip install -r requirements.txt (no cache)
- Creates data/sample and data/uploads directories
- Exposes port 8000
- CMD: uvicorn main:app --host 0.0.0.0 --port 8000
```

Note: The cloud branch `requirements.txt` includes `pymysql>=1.1.0` for MySQL connectivity (vs SQLite in the dev branch) and `httpx>=0.27.0` for service-to-service calls.

### Node.js Notification Service (`notification-service/Dockerfile`)
```
- Base: node:20-alpine
- npm ci --only=production (production deps only, no devDependencies)
- Exposes port 5001
- CMD: node server.js
```

---

## Kubernetes (EKS) Deployment

The platform is deployed to an EKS cluster. Each service is deployed as a Kubernetes `Deployment` with a corresponding `Service`. MySQL uses a `StatefulSet` with an EBS-backed `PersistentVolumeClaim`.

### Cluster Setup

```bash
# Create EKS cluster using eksctl
eksctl create cluster \
  --name insuranceiq-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5

# Update kubeconfig
aws eks update-kubeconfig --name insuranceiq-cluster --region us-east-1

# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx

# Install AWS EBS CSI Driver
eksctl create addon --name aws-ebs-csi-driver --cluster insuranceiq-cluster
```

### Kubernetes Resource Overview

| Resource                  | Kind           | Namespace     | Description                              |
|---------------------------|----------------|---------------|------------------------------------------|
| `insuranceiq`             | Namespace      | —             | Dedicated namespace for all services     |
| `frontend-deployment`     | Deployment     | insuranceiq   | React app, 2 replicas, port 80           |
| `backend-deployment`      | Deployment     | insuranceiq   | Spring Boot API, 2 replicas, port 8080   |
| `ml-service-deployment`   | Deployment     | insuranceiq   | Python FastAPI, 1 replica, port 8000     |
| `notification-deployment` | Deployment     | insuranceiq   | Node.js Socket.IO, 1 replica, port 5001  |
| `mysql-statefulset`       | StatefulSet    | insuranceiq   | MySQL 8.0, 1 replica, port 3306          |
| `mysql-pvc`               | PVC            | insuranceiq   | 10Gi EBS gp2 persistent volume           |
| `insuranceiq-secrets`     | Secret         | insuranceiq   | DB credentials, JWT secret               |
| `insuranceiq-configmap`   | ConfigMap      | insuranceiq   | Service URLs, non-sensitive config       |
| `insuranceiq-ingress`     | Ingress        | insuranceiq   | NGINX routing rules (NLB entry point)    |

### Ingress Routing Rules

| Path         | Backend Service         | Port |
|--------------|-------------------------|------|
| `/`          | frontend-service        | 80   |
| `/api`       | backend-service         | 8080 |
| `/ml`        | ml-service              | 8000 |
| `/socket.io` | notification-service    | 5001 |

### Deploying to EKS

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets and configmap
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy MySQL (StatefulSet + PVC)
kubectl apply -f k8s/mysql-statefulset.yaml
kubectl apply -f k8s/mysql-pvc.yaml

# Deploy application services
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ml-service-deployment.yaml
kubectl apply -f k8s/notification-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n insuranceiq
kubectl get services -n insuranceiq
kubectl get ingress -n insuranceiq
```

---

## CI/CD Pipeline — Jenkins

The project uses **Jenkins Pipeline as Code** (Groovy Jenkinsfile). The pipeline is triggered on commits and automates the full build → test → push → deploy cycle.

### Pipeline Stages

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Checkout   │ → │    Build    │ → │    Test     │ → │  Docker     │
│  (SCM)      │   │  All Svcs   │   │  All Svcs   │   │  Build      │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                             │
                  ┌─────────────┐   ┌─────────────┐          │
                  │   Deploy    │ ← │  ECR Push   │ ←────────┘
                  │  to EKS     │   │  (all imgs) │
                  └─────────────┘   └─────────────┘
```

### Stage Details

| Stage       | Actions                                                              |
|-------------|----------------------------------------------------------------------|
| Checkout    | Pull source from GitHub                                              |
| Build       | `mvn clean package` (Spring Boot), `npm install` (React, Node.js), `pip install` (Python) |
| Test        | `mvn test`, `pytest`, `npm test` (Jest/Supertest), `npm test` (Vitest/RTL) |
| Docker Build| Build all 4 Docker images with ECR repo tags                         |
| ECR Push    | `docker push` all images to AWS ECR (auth via `aws ecr get-login-password`) |
| Deploy      | `kubectl set image` to rolling-update each Deployment in EKS         |

### ECR Image Tags

```
<account-id>.dkr.ecr.<region>.amazonaws.com/insuranceiq-frontend:latest
<account-id>.dkr.ecr.<region>.amazonaws.com/insuranceiq-backend:latest
<account-id>.dkr.ecr.<region>.amazonaws.com/insuranceiq-ml-service:latest
<account-id>.dkr.ecr.<region>.amazonaws.com/insuranceiq-notification:latest
```

### Jenkins Setup Requirements

- Jenkins with the following plugins: AWS Credentials, Kubernetes CLI, Docker Pipeline, Pipeline
- AWS IAM credentials configured in Jenkins with ECR push and EKS access permissions
- `KUBECONFIG` and `AWS_CREDENTIALS` credentials stored in Jenkins Credential Store
- Docker daemon available on the Jenkins agent

---

## AWS Services Used

| Service                   | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| EKS (Elastic Kubernetes Service) | Managed Kubernetes cluster for all microservices   |
| ECR (Elastic Container Registry) | Private Docker image registry for all 4 services   |
| EBS (Elastic Block Store) | Persistent volume for MySQL StatefulSet (gp2, 10Gi)        |
| NLB (Network Load Balancer)| Auto-provisioned entry point for NGINX Ingress Controller  |
| IAM                       | Service roles for EKS nodes, ECR access, EBS CSI driver     |
| VPC                       | Networking isolation for the EKS cluster                    |

---

## Monitoring — Prometheus & Grafana

The monitoring stack runs in a dedicated `monitoring` namespace, deployed via the `kube-prometheus-stack` Helm chart.

```bash
# Add Helm chart repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana (port-forward)
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
# Default login: admin / prom-operator
```

Prometheus scrapes metrics from all pods. Pre-built Grafana dashboards cover:
- Kubernetes cluster health (CPU, memory, pod restarts)
- HTTP request rates and latencies per service
- MySQL connection pool and query stats
- Node.js event loop lag and active socket connections

---

## Environment Variables & Secrets

All sensitive values are injected at runtime via **Kubernetes Secrets** and **ConfigMaps**. No secrets are hardcoded in container images.

### Kubernetes Secret: `insuranceiq-secrets`
```yaml
stringData:
  SPRING_DATASOURCE_PASSWORD: <db-password>
  APP_JWT_SECRET: <256-bit-jwt-secret>
  DB_PASSWORD: <notification-db-password>
  JWT_SECRET: <same-as-jwt-secret>
```

### Kubernetes ConfigMap: `insuranceiq-configmap`
```yaml
data:
  SPRING_DATASOURCE_URL: "jdbc:mysql://mysql-service:3306/insuranceiq_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
  SPRING_DATASOURCE_USERNAME: "root"
  APP_FRAUD_SERVICE_URL: "http://ml-service:8000"
  APP_NOTIFICATION_SERVICE_URL: "http://notification-service:5001"
  DB_HOST: "mysql-service"
  DB_PORT: "3306"
  DB_NAME: "insuranceiq_notifications"
  DB_USER: "root"
  SPRING_BOOT_URL: "http://backend-service:8080"
```

### React Build-time Variables
Set as Docker build-args (no runtime secrets in the frontend):
```
VITE_SPRING_API_URL=/api      ← routes through NGINX Ingress
VITE_SOCKET_URL=              ← empty = relative URL via ingress /socket.io
```

---

## Service Port Reference

| Service                   | Container Port | Kubernetes Service Port | Ingress Path |
|---------------------------|---------------|------------------------|--------------|
| React Frontend            | 80            | 80                     | `/`          |
| Spring Boot Backend       | 8080          | 8080                   | `/api`       |
| Python ML Service         | 8000          | 8000                   | `/ml`        |
| Node.js Notification Svc  | 5001          | 5001                   | `/socket.io` |
| MySQL                     | 3306          | 3306                   | Internal only|

---

## Testing

Each service has its own test suite. All tests run as part of the Jenkins CI pipeline before Docker images are built.

| Module                    | Framework                    | Command       | What's Tested                                         |
|---------------------------|------------------------------|---------------|-------------------------------------------------------|
| Spring Boot (Claims)      | JUnit 5 + Mockito            | `mvn test`    | ClaimService CRUD, ResourceNotFoundException, notifications |
| Python ML (Fraud)         | Pytest + HTTPX TestClient    | `pytest`      | Health endpoint, fraud prediction, analytics queries  |
| Node.js (Notifications)   | Jest + Supertest             | `npm test`    | Health check, JWT 401 rejection, event validation, 404 |
| React (Analytics)         | Vitest + React Testing Library| `npm test`   | FraudReport render, stat cards, loading state, empty state |

---

## Prerequisites

Before deploying, ensure the following are installed and configured:

- **Java JDK 17+** — Spring Boot build
- **Node.js v18+ & npm** — React and Node.js builds
- **Python 3.10+** — ML service
- **Apache Maven 3.8+** — Spring Boot package
- **Docker** (with daemon running) — image builds
- **kubectl** — Kubernetes CLI
- **eksctl** — EKS cluster provisioning
- **AWS CLI v2** — configured with IAM credentials (`aws configure`)
- **Helm 3.x** — NGINX Ingress + Prometheus/Grafana installation
- **Jenkins** — CI/CD server with required plugins and credentials

---

## Deployment Walkthrough

### 1. Provision the EKS Cluster
```bash
eksctl create cluster --name insuranceiq-cluster --region us-east-1 \
  --nodegroup-name workers --node-type t3.medium --nodes 3
```

### 2. Create ECR Repositories
```bash
aws ecr create-repository --repository-name insuranceiq-frontend
aws ecr create-repository --repository-name insuranceiq-backend
aws ecr create-repository --repository-name insuranceiq-ml-service
aws ecr create-repository --repository-name insuranceiq-notification
```

### 3. Build and Push Images
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
docker build -t insuranceiq-backend ./server
docker tag insuranceiq-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/insuranceiq-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/insuranceiq-backend:latest

# Repeat for frontend, ml-service, notification-service
```

### 4. Deploy to EKS
```bash
kubectl apply -f k8s/
```

### 5. Get the Public Endpoint
```bash
kubectl get ingress -n insuranceiq
# Copy the ADDRESS — this is your NLB DNS name
```

### 6. Set up Monitoring
```bash
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### 7. Configure Jenkins
- Add AWS credentials to Jenkins Credential Store
- Point the Jenkins pipeline to the repo and `Jenkinsfile`
- Enable GitHub webhook for automatic triggers
