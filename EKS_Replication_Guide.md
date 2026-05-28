# InsuranceIQ: EKS Architecture & Exhaustive Replication Guide

This document is the **Ultimate Blueprint** for the InsuranceIQ platform. It contains the complete architectural breakdown, infrastructure topology, and a foolproof, step-by-step guide to recreating this exact AWS EKS production environment from scratch.

> **Note:** This guide is designed so that anyone can successfully replicate the entire system without guessing or missing any steps. Every command is exact, and all placeholders have been removed.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            PUBLIC INTERNET                                      │
│                                  │                                              │
│                    ┌─────────────▼──────────────┐                               │
│                    │   AWS Network Load Balancer  │                              │
│                    │   (Auto-provisioned ELB)     │                              │
│                    └─────────────┬──────────────┘                               │
│                                  │                                              │
│   ┌──────────────────────────────▼──────────────────────────────────┐            │
│   │              NGINX Ingress Controller (ingress-nginx namespace) │            │
│   │                                                                 │            │
│   │   /           → frontend-svc:80     (React)                     │            │
│   │   /api        → server-svc:8080     (Spring Boot)               │            │
│   │   /ml         → ml-svc:8000         (FastAPI)                   │            │
│   │   /socket.io  → notification-svc:5001 (Node.js Socket.io)       │            │
│   └─────────────────────────────────────────────────────────────────┘            │
│                                                                                  │
│   ┌──────────────────── insuranceiq namespace ──────────────────────┐            │
│   │                                                                 │            │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │            │
│   │   │ Frontend │  │  Server  │  │ ML Svc   │  │ Notification │  │            │
│   │   │ React    │  │ Spring   │  │ FastAPI  │  │ Node.js      │  │            │
│   │   │ :80      │  │ Boot     │  │ :8000    │  │ Socket.io    │  │            │
│   │   │          │  │ :8080    │  │          │  │ :5001        │  │            │
│   │   └──────────┘  └────┬─────┘  └──────────┘  └──────────────┘  │            │
│   │                      │                                         │            │
│   │                 ┌────▼─────┐                                   │            │
│   │                 │ MySQL 8  │ ← PVC (gp2 → AWS EBS Volume)     │            │
│   │                 │ :3306    │                                    │            │
│   │                 └──────────┘                                   │            │
│   └─────────────────────────────────────────────────────────────────┘            │
│                                                                                  │
│   ┌──────────────────── monitoring namespace ───────────────────────┐            │
│   │   ┌────────────┐  ┌────────────┐                               │            │
│   │   │ Prometheus │  │  Grafana   │ → Exposed via separate ELB    │            │
│   │   │            │→ │  :80       │                               │            │
│   │   └────────────┘  └────────────┘                               │            │
│   └─────────────────────────────────────────────────────────────────┘            │
│                                                                                  │
│   ┌──────── Bastion Host (t3.small) ────────┐                                   │
│   │  Jenkins CI/CD  │  kubectl  │  Docker   │                                   │
│   └─────────────────────────────────────────┘                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

InsuranceIQ is a modern, distributed microservices platform designed for cloud-native deployment:

1. **Frontend (React)**: The user interface where customers and agents interact. It runs in a container and talks to the backend via standard REST APIs.
2. **Backend Server (Spring Boot)**: The core engine of the platform. It handles business logic, connects securely to the MySQL database, and delegates complex tasks to other microservices.
3. **Database (MySQL 8.0)**: A persistent database. Thanks to the AWS EBS CSI driver, this database is tied to a real AWS Elastic Block Store (EBS) volume, meaning even if the database container crashes and is recreated, your data is perfectly safe.
4. **Machine Learning Service (Python FastAPI)**: A dedicated microservice that the Spring Boot server calls to generate real-time "Fraud Risk Probabilities" on insurance claims.
5. **Notification Service (Node.js/Socket.io)**: A lightweight WebSocket service. When the backend processes a claim, it pings this service, which immediately pushes a live notification to the user's browser without requiring a refresh.
6. **Networking (NGINX Ingress & AWS ELB)**: We use an NGINX Ingress Controller. This automatically creates an AWS Elastic Load Balancer (ELB) that takes traffic from the public internet and securely routes it to the correct private containers inside the cluster.

---

## 2. Infrastructure Topology & Live Endpoints

### EC2 Instances & Nodes
The environment consists of 1 Bastion Host (for CI/CD and secure cluster management) and 2 Managed EKS Worker Nodes running in the `ap-south-2` (Hyderabad) region.

| Role | Instance Name | Instance Type | Public IP | Private IP | State |
|---|---|---|---|---|---|
| Bastion Host / CI Server | `insuranceiq-bastion` | `t3.small` | **`18.61.166.57`** | `10.0.1.25` | Running |
| EKS Worker Node 1 | `insuranceiq-eks-standard-workers-Node` | `m7i-flex.large` | **`16.112.77.15`** | `192.168.54.1` | Running |
| EKS Worker Node 2 | `insuranceiq-eks-standard-workers-Node` | `m7i-flex.large` | **`18.61.172.162`** | `192.168.72.157` | Running |
| K3s Legacy Server | `insuranceiq-k3s` | `t3.small` | `None` | `10.0.2.150` | Running |

### Live Application Endpoints
| Service | Access URL |
|---|---|
| **Main App (ELB)** | `http://a9460194965694ed283b10d8107c61e6-703999105.ap-south-2.elb.amazonaws.com/` |
| **Grafana Dashboards** | `http://ae199f91cb55d4f0b80ce4d4e0f6a6d8-1790269069.ap-south-2.elb.amazonaws.com/dashboards` |
| **Jenkins Dashboard** | `http://18.61.166.57:8080` |
| **Swagger UI (via tunnel)** | `http://localhost:8080/swagger-ui/index.html` |

### Default Credentials
| Service | Username | Password |
|---|---|---|
| **InsuranceIQ App** | `admin@insuranceiq.com` | `password123` |
| **Jenkins** | `admin` | `da37dc258f7e4329a161209e6cb27ac3` |
| **Grafana** | `admin` | `prom-operator` |
| **MySQL** | `root` | *(stored in K8s secret `insuranceiq-secrets`, key `db-password`)* |

---

## 3. Step-by-Step Rebuild Guide (From Scratch)

If you ever need to tear everything down and rebuild it perfectly, follow these exact steps. **Do not skip anything.**

### Step 1: Clone Repository & Provision Initial Infrastructure
First, clone the project repository from GitHub and navigate into the root directory. Then, execute the AWS infrastructure provisioning script:

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd ClaimsManagementApp
./cloud-infra/infra/provision_eks.ps1
```
*(Note: If running on Windows, use PowerShell to execute `.\cloud-infra\infra\provision_eks.ps1`)*

This script creates the VPC, subnets, security groups, and the Bastion EC2 host.

### Step 2: SSH into Bastion & Provision the EKS Cluster
1. SSH into the newly created Bastion host:
   ```bash
   ssh -i insuranceiq-key.pem ubuntu@<BASTION_PUBLIC_IP>
   ```
2. Copy the EKS setup script to the Bastion and run it. **Crucial:** Ensure it uses `m7i-flex.large` for the node type, because `t3.large` is blocked by AWS Free Tier restrictions in `ap-south-2`.
   ```bash
   # The setup script is at: infrastructure-scripts/setup-eks.sh
   chmod +x setup-eks.sh
   ./setup-eks.sh
   ```
   This script does **three things automatically**:
   - Installs `eksctl` CLI tool
   - Creates the EKS cluster with 2 `m7i-flex.large` worker nodes
   - Installs the **NGINX Ingress Controller** via Helm (this auto-creates the AWS ELB)

### Step 3: Install Helm (Required for Monitoring)
Helm is needed to deploy the Prometheus/Grafana stack:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### Step 4: Configure AWS EBS CSI Driver (CRITICAL FOR DATABASE)
For MySQL to save data permanently, the cluster must be allowed to create AWS EBS Volumes. Run these exact commands:

```bash
# 1. Automatically fetch your node's IAM role name and attach the EBS permission policy
NODE_ROLE=$(aws iam list-roles --query "Roles[?contains(RoleName, 'insuranceiq-eks-nodegroup')].RoleName" --output text)
aws iam attach-role-policy --role-name $NODE_ROLE --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy

# 2. Install the driver into the cluster
aws eks create-addon \
  --cluster-name insuranceiq-eks \
  --addon-name aws-ebs-csi-driver \
  --region ap-south-2
```

### Step 5: Create ECR Repositories
Each microservice Docker image needs an ECR repository to be stored in:
```bash
AWS_REGION=ap-south-2
for repo in insuranceiq-frontend insuranceiq-server insuranceiq-ml insuranceiq-notification; do
  aws ecr create-repository --repository-name $repo --region $AWS_REGION
done
```

### Step 6: Configure Jenkins CI/CD
1. Jenkins is pre-installed on the Bastion host via the `deploy.sh` script. Access it at `http://<BASTION_PUBLIC_IP>:8080`.
2. The initial admin password is:
   ```
   da37dc258f7e4329a161209e6cb27ac3
   ```
3. Give the Jenkins user permission to interact with EKS and Docker:
   ```bash
   sudo -u jenkins aws eks update-kubeconfig --name insuranceiq-eks --region ap-south-2
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```
4. Create a Pipeline job in Jenkins pointing to the repository. The `Jenkinsfile` is located at:
   ```
   cloud-infra/jenkins/Jenkinsfile
   ```
5. Configure your GitHub webhook to point to:
   ```
   http://<BASTION_PUBLIC_IP>:8080/github-webhook/
   ```

### Step 7: Deploy Observability (Prometheus & Grafana)
Deploy the monitoring stack so it can track everything from the start:
```bash
kubectl create namespace monitoring

# Add the Prometheus community Helm chart repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack with our custom values
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f cloud-infra/k8s/monitoring/values.yaml

# Apply the Grafana Ingress to expose it via its own ELB
kubectl apply -f cloud-infra/k8s/monitoring/grafana-ingress.yaml
```

### Step 8: Deploy the Core Application
Apply all the Kubernetes manifests in this exact sequential order to prevent crash loops:

```bash
# 1. Create the application namespace
kubectl apply -f cloud-infra/k8s/namespace.yaml

# 2. Create ECR pull secret so pods can pull images from your private ECR
AWS_ACCOUNT_ID=054014031154
AWS_REGION=ap-south-2
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)
kubectl create secret docker-registry ecr-secret \
  --docker-server=$ECR_REGISTRY \
  --docker-username=AWS \
  --docker-password=$ECR_PASSWORD \
  --namespace=insuranceiq
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "ecr-secret"}]}' -n insuranceiq

# 3. Apply secrets
kubectl apply -f cloud-infra/k8s/secrets.yaml

# 4. Deploy MySQL database
kubectl apply -f cloud-infra/k8s/mysql/mysql.yaml

# ⚠️  DO NOT proceed until you verify MySQL is running:
#    kubectl get pods -n insuranceiq
#    Wait until mysql-0 says 1/1 READY.

# 5. Deploy remaining microservices
kubectl apply -f cloud-infra/k8s/server/server.yaml
kubectl apply -f cloud-infra/k8s/ml-service/ml-service.yaml
kubectl apply -f cloud-infra/k8s/notification/notification.yaml
kubectl apply -f cloud-infra/k8s/frontend/frontend.yaml

# 6. Apply Ingress routing rules
kubectl apply -f cloud-infra/k8s/ingress.yaml
```

### Step 9: Verify the Deployment
Run these commands to confirm everything is healthy:
```bash
# All pods should be 1/1 READY
kubectl get pods -n insuranceiq

# The ingress should show the ELB address
kubectl get ingress -n insuranceiq

# PVCs should be Bound with gp2 storage class
kubectl get pvc -n insuranceiq
```

### Step 10: Verify Database Seeding
To guarantee everything worked, jump inside the running database and check if the initial users were created:

```bash
# Jump directly into the MySQL container
kubectl exec -it mysql-0 -n insuranceiq -- bash -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" insuranceiq_db'
```
Once inside the `mysql>` prompt, run:
```sql
SELECT * FROM customers ORDER BY customer_id DESC LIMIT 5;
exit
```

---

## 4. Viewing Secure Internal Documentation (Swagger)
For security, the Backend Swagger UI is explicitly blocked from the public internet. To view it, you must securely tunnel into the cluster from your local computer:

1. Open a terminal and SSH into the Bastion with port forwarding:
   ```bash
   ssh -i insuranceiq-key.pem -L 8080:localhost:8080 ubuntu@18.61.166.57
   ```
2. Inside that terminal (now on the Bastion host), run:
   ```bash
   kubectl port-forward svc/server-svc 8080:8080 -n insuranceiq
   ```
3. Open your local browser to: `http://localhost:8080/swagger-ui/index.html`

---

## 5. Operational Usage: Where to View the Action

Once everything is deployed, here is exactly how to interact with the platform and where to look to see your data live in action.

### 1. The Application & Simulation Load Test
1. Go to your frontend ELB URL: `http://a9460194965694ed283b10d8107c61e6-703999105.ap-south-2.elb.amazonaws.com/`
2. **Login:** Use `admin@insuranceiq.com` and `password123`.
3. **Action:** Click on the **"Simulation" / "Load Test"** button in the UI. This will start bombarding the backend with traffic. Leave this tab open.

### 2. Grafana (Visualizing the Load)
1. In a new tab, go to your Grafana ELB URL: `http://ae199f91cb55d4f0b80ce4d4e0f6a6d8-1790269069.ap-south-2.elb.amazonaws.com/dashboards`
2. **Login:** Use `admin` / `prom-operator`.
3. **Where to click:** In the left sidebar, click on **Dashboards**.
4. **The Graph:** Navigate to **Kubernetes / Compute Resources / Pods**. Select the `insuranceiq` namespace from the dropdown at the top.
5. **Result:** You will see the live CPU and Memory usage graphs spiking violently as a result of the frontend simulation you started in the other tab!

### 3. Jenkins (Viewing CI/CD Logs)
1. Go to: `http://18.61.166.57:8080`
2. **Login:** Use `admin` / `da37dc258f7e4329a161209e6cb27ac3`.
3. **Where to click:** Click on the **InsuranceIQ** project.
4. **The Logs:** Click on the most recent build number on the bottom left, then click **Console Output**. You will see the exact multi-stage logs of Docker building, pushing to ECR, and `kubectl` applying the deployment.

---

## 6. Teardown
To safely destroy the entire environment and stop incurring AWS charges:
```bash
# 1. Delete the EKS cluster (this removes all pods, services, ELBs, and EBS volumes)
eksctl delete cluster --name insuranceiq-eks --region ap-south-2

# 2. Delete ECR repositories
for repo in insuranceiq-frontend insuranceiq-server insuranceiq-ml insuranceiq-notification; do
  aws ecr delete-repository --repository-name $repo --region ap-south-2 --force
done

# 3. Terminate the Bastion EC2 instance via the AWS Console or CLI
```
