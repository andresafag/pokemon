Terraform modules to provision ECR and ECS cluster for the `pokemon` app.

Overview
- `modules/ecr` — creates an ECR repository and returns its URI.
- `modules/ecs` — creates an ECS cluster and minimal IAM roles (task execution role placeholder).
- Root configuration demonstrates how to call modules and includes a backend block example.

Backend
The `backend.tf` file below contains an S3 backend example with placeholder values. Do not commit production credentials into source control. Initialize the backend with:

  terraform init \
    -backend-config="bucket=YOUR_STATE_BUCKET" \
    -backend-config="key=path/to/terraform.tfstate" \
    -backend-config="region=YOUR_REGION" \
    -backend-config="dynamodb_table=YOUR_LOCK_TABLE"

Basic usage
1. Set AWS credentials in your environment (or use an assumed role).
2. Edit `terraform.tfvars` or pass variables via CLI.
3. `terraform init`
4. `terraform apply` (review plan and confirm)

Files
- `backend.tf` — S3 backend example.
- `provider.tf` — AWS provider configuration.
- `main.tf` — simple module usage wiring.
