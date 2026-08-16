# ---------------------------------------------------------------------------
# Root variables
# ---------------------------------------------------------------------------

variable "app_name" {
  description = "Application name — used as a prefix across all resources"
  type        = string
  default     = "pokemon"
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "pokemon-app"
}

variable "desired_count" {
  description = "Initial number of Fargate tasks (CI/CD owns this value after first apply)"
  type        = number
  default     = 1
}

locals {
  tags = { Application = var.app_name }

  # Derive two AZs from the configured region automatically
  az_a = "${var.aws_region}a"
  az_b = "${var.aws_region}b"
}

# ---------------------------------------------------------------------------
# Module: VPC
# Provisions the VPC, subnets, internet gateway, route tables, and the
# security group that ECS tasks will be attached to.
# ---------------------------------------------------------------------------
module "vpc" {
  source = "./modules/vpc"

  name               = var.app_name
  availability_zones = [local.az_a, local.az_b]
  container_port     = 10000
  tags               = local.tags
}

# ---------------------------------------------------------------------------
# Module: ECR
# Provisions the container image registry.
# ---------------------------------------------------------------------------
module "ecr" {
  source = "./modules/ecr"

  name = var.ecr_repository_name
  tags = local.tags
}

# ---------------------------------------------------------------------------
# Module: IAM
# Provisions the ECS execution role (pulls images, writes logs) and the
# task role (granted to the running container for AWS API calls).
# ---------------------------------------------------------------------------
module "iam" {
  source = "./modules/iam"

  name = var.app_name
  tags = local.tags
}

# ---------------------------------------------------------------------------
# Module: ECS
# Provisions the ECS cluster, CloudWatch log group, and the bootstrap
# task definition. CI/CD registers new revisions on every push to main.
# ---------------------------------------------------------------------------
module "ecs" {
  source = "./modules/ecs"

  name               = var.app_name
  aws_region         = var.aws_region
  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn
  tags               = local.tags
}



output "ecr_repository_uri" {
  description = "ECR URI — used to build the Docker image tag in CI"
  value       = module.ecr.repository_uri
}

output "ecr_repository_name" {
  description = "ECR repository name — set as ECR_REPOSITORY secret in GitHub"
  value       = module.ecr.repository_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name — set as ECS_CLUSTER secret in GitHub"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name — set as ECS_SERVICE secret in GitHub"
  value       = module.ecs_express_mode.service_name
}

output "ecs_execution_role_arn" {
  description = "ECS execution role ARN — used in .aws/task-definition.json"
  value       = module.iam.execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN — used in .aws/task-definition.json"
  value       = module.iam.task_role_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
